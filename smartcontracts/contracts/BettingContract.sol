// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsRouter.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BettingToken.sol";
import "./BetTicketNFT.sol";
import "./USDT.sol";

contract BettingContract is FunctionsClient, AutomationCompatibleInterface, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    BettingToken public bettingToken;
    BetTicketNFT public betTicketNFT;
    USDT public usdt;

    uint64 public subscriptionId;
    bytes32 public donId;
    uint32 public gasLimit = 300000;

    string public matchesSourceCode;
    string public resultsSourceCode;

    struct Match {
        uint256 id;
        string homeTeam;
        string awayTeam;
        uint256 matchDate;
        uint8 result; // 0: not played, 1: home win, 2: draw, 3: away win
        uint256 homeOdds;
        uint256 drawOdds;
        uint256 awayOdds;
    }

    mapping(uint256 => Match) public matches;
    uint256[] public matchIds;

    mapping(bytes32 => uint256) public requestToMatchId;
    mapping(bytes32 => bool) public requestType; // true for matches, false for results

    uint256 public lastMatchRequestTime;
    uint256 public requestInterval = 10 seconds;

    uint8 public secretsLocation; // 0 = DON hosted, 1 = inline, 255 = no secrets
    bytes public encryptedSecretsReference; // For DON: version as bytes8, For inline: encrypted secrets

    event MatchesFetched(uint256[] matchIds);
    event MatchResultFetched(uint256 matchId, uint8 result);
    event BetPlaced(address user, uint256 tokenId, uint256 matchId, uint8 prediction, uint256 amount);
    event BetResolved(uint256 tokenId, bool won, uint256 payout);

    constructor(
        address router,
        uint64 _subscriptionId,
        bytes32 _donId,
        address _bettingToken,
        address _betTicketNFT,
        address _usdt
    ) FunctionsClient(router) Ownable() {
        subscriptionId = _subscriptionId;
        donId = _donId;
        bettingToken = BettingToken(_bettingToken);
        betTicketNFT = BetTicketNFT(_betTicketNFT);
        usdt = USDT(_usdt);
        secretsLocation = 255; // Default: no secrets (API key in source code)
    }

    function setSecretsReference(uint8 _location, bytes calldata _reference) external onlyOwner {
        require(_location <= 255, "Invalid secrets location");
        secretsLocation = _location;
        encryptedSecretsReference = _reference;
    }

    function setMatchesSource(string memory source) public onlyOwner {
        matchesSourceCode = source;
    }

    function setResultsSource(string memory source) public onlyOwner {
        resultsSourceCode = source;
    }

    function setRequestInterval(uint256 _interval) public onlyOwner {
        requestInterval = _interval;
    }

    function resetLastRequestTime() public onlyOwner {
        lastMatchRequestTime = 0;
    }

    function requestMatches() public {
        require(bytes(matchesSourceCode).length > 0, "Matches source not set");
        require(block.timestamp >= lastMatchRequestTime + requestInterval, "Too soon");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(matchesSourceCode);

        // 🔧 FIXED: Only add secrets if configured (not 255)
        if (secretsLocation == 0 && encryptedSecretsReference.length > 0) {
            // DON-hosted secrets: decode version from encryptedSecretsReference
            uint64 version = bytesToUint64(encryptedSecretsReference);
            req.addDONHostedSecrets(0, version); // slot 0, actual version
        } else if (secretsLocation == 1 && encryptedSecretsReference.length > 0) {
            // Inline secrets
            req.addSecretsReference(encryptedSecretsReference);
        }
        // If secretsLocation == 255 or reference is empty, no secrets are added

        bytes32 requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
        requestType[requestId] = true;
        lastMatchRequestTime = block.timestamp;
    }

    function requestMatchResult(uint256 matchId) internal {
        require(bytes(resultsSourceCode).length > 0, "Results source not set");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(resultsSourceCode);

        // 🔧 FIXED: Only add secrets if configured
        if (secretsLocation == 0 && encryptedSecretsReference.length > 0) {
            uint64 version = bytesToUint64(encryptedSecretsReference);
            req.addDONHostedSecrets(0, version);
        } else if (secretsLocation == 1 && encryptedSecretsReference.length > 0) {
            req.addSecretsReference(encryptedSecretsReference);
        }

        string[] memory args = new string[](1);
        args[0] = string(abi.encodePacked(matchId));
        req.setArgs(args);

        bytes32 requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
        requestToMatchId[requestId] = matchId;
        requestType[requestId] = false;
    }

    // 🔧 NEW: Helper function to decode version from bytes
    function bytesToUint64(bytes memory b) internal pure returns (uint64) {
        require(b.length >= 8, "Invalid bytes length");
        uint64 result = 0;
        for (uint i = 0; i < 8; i++) {
            result = result | (uint64(uint8(b[i])) << (8 * (7 - i)));
        }
        return result;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (err.length > 0) {
            revert(string(err));
        }

        if (requestType[requestId]) {
            // Handle matches response
            string memory compact = abi.decode(response, (string));

            // If no matches, just emit empty array
            if (bytes(compact).length == 0) {
                emit MatchesFetched(matchIds);
                return;
            }

            string[] memory parts = splitString(compact, "|");

            for (uint i = 0; i < parts.length; i++) {
                if (bytes(parts[i]).length > 0) {
                    (uint256 id, string memory homeTeam, string memory awayTeam, uint256 homeOdds, uint256 drawOdds, uint256 awayOdds) = parseMatch(parts[i]);
                    uint256 matchDate = block.timestamp + (i + 1) * 1 days; // Schedule matches in future
                    matches[id] = Match(id, homeTeam, awayTeam, matchDate, 0, homeOdds, drawOdds, awayOdds);
                    matchIds.push(id);
                }
            }

            emit MatchesFetched(matchIds);
        } else {
            // Handle result response
            uint256 result = abi.decode(response, (uint256));
            uint256 matchId = requestToMatchId[requestId];
            matches[matchId].result = uint8(result);

            emit MatchResultFetched(matchId, uint8(result));
        }
    }

    function splitString(string memory str, string memory delimiter) internal pure returns (string[] memory) {
        bytes memory strBytes = bytes(str);
        bytes memory delimiterBytes = bytes(delimiter);
        uint count = 1;
        for (uint i = 0; i < strBytes.length; i++) {
            if (strBytes[i] == delimiterBytes[0]) {
                count++;
            }
        }
        string[] memory result = new string[](count);
        uint index = 0;
        uint start = 0;
        for (uint i = 0; i < strBytes.length; i++) {
            if (strBytes[i] == delimiterBytes[0]) {
                result[index] = substring(str, start, i);
                start = i + 1;
                index++;
            }
        }
        result[index] = substring(str, start, strBytes.length);
        return result;
    }

    function substring(string memory str, uint start, uint end) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(end - start);
        for (uint i = start; i < end; i++) {
            result[i - start] = strBytes[i];
        }
        return string(result);
    }

    function parseUint(string memory str) internal pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint8 digit = uint8(b[i]) - 48; // '0' is 48 in ASCII
            require(digit <= 9, "Invalid character in number");
            result = result * 10 + digit;
        }
        return result;
    }

    function parseMatch(string memory matchStr)
        internal
        pure
        returns (
            uint256,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256
        )
    {
        // Expected format: "12345:Arsenal(1.50)-Draw(3.00)-Chelsea(2.20)"
        bytes memory b = bytes(matchStr);
        uint256 id;
        string memory homeTeam;
        string memory awayTeam;
        uint256 homeOdds;
        uint256 drawOdds;
        uint256 awayOdds;

        uint256 colonIndex;
        for (uint i = 0; i < b.length; i++) {
            if (b[i] == ":") {
                colonIndex = i;
                break;
            }
        }

        // Extract id
        id = parseUint(substring(matchStr, 0, colonIndex));

        // Extract teams and odds from the rest of the string
        string memory rest = substring(matchStr, colonIndex + 1, b.length);

        // Split by '-' to get home, draw, away parts
        string[] memory parts = splitString(rest, "-");

        if (parts.length >= 3) {
            // Parse home team and odds
            (homeTeam, homeOdds) = parseTeamAndOdds(parts[0]);

            // Parse draw odds
            if (bytes(parts[1]).length > 5) { // "Draw("
                string memory drawPart = substring(parts[1], 5, bytes(parts[1]).length - 1); // Remove "Draw(" and ")"
                drawOdds = parseOdds(drawPart);
            } else {
                drawOdds = 300;
            }

            // Parse away team and odds
            (awayTeam, awayOdds) = parseTeamAndOdds(parts[2]);
        } else {
            // Fallback
            homeTeam = "Home";
            awayTeam = "Away";
            homeOdds = 150;
            drawOdds = 300;
            awayOdds = 220;
        }

        return (id, homeTeam, awayTeam, homeOdds, drawOdds, awayOdds);
    }

    function parseTeamAndOdds(string memory teamOddsStr) internal pure returns (string memory team, uint256 odds) {
        bytes memory b = bytes(teamOddsStr);
        uint256 parenIndex;
        for (uint i = 0; i < b.length; i++) {
            if (b[i] == "(") {
                parenIndex = i;
                break;
            }
        }

        team = substring(teamOddsStr, 0, parenIndex);
        string memory oddsStr = substring(teamOddsStr, parenIndex + 1, b.length - 1);
        odds = parseOdds(oddsStr);
    }

    function parseOdds(string memory oddsStr) internal pure returns (uint256) {
        // Convert decimal odds like "1.50" to integer like 150
        bytes memory b = bytes(oddsStr);
        uint256 dotIndex;
        bool hasDot = false;
        for (uint i = 0; i < b.length; i++) {
            if (b[i] == ".") {
                dotIndex = i;
                hasDot = true;
                break;
            }
        }

        if (hasDot) {
            string memory wholePart = substring(oddsStr, 0, dotIndex);
            string memory decimalPart = substring(oddsStr, dotIndex + 1, b.length);
            uint256 whole = parseUint(wholePart);
            uint256 decimal = parseUint(decimalPart);
            return whole * 100 + decimal;
        } else {
            return parseUint(oddsStr) * 100;
        }
    }

    function placeBet(uint256 matchId, uint8 prediction, uint256 amount) public {
        require(matches[matchId].id != 0, "Match does not exist");
        require(matches[matchId].result == 0, "Match already resolved");
        require(prediction <= 2, "Invalid prediction");

        usdt.transferFrom(msg.sender, address(this), amount);

        uint256 tokenId = betTicketNFT.mintBetTicket(msg.sender, matchId, prediction, amount);

        emit BetPlaced(msg.sender, tokenId, matchId, prediction, amount);
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        // Check for match results to resolve
        for (uint i = 0; i < matchIds.length; i++) {
            uint256 matchId = matchIds[i];
            if (matches[matchId].result == 0 && block.timestamp > matches[matchId].matchDate + 2 hours) {
                upkeepNeeded = true;
                performData = abi.encode(uint8(0), matchId); // 0 for result resolution
                break;
            }
        }

        // If no results to resolve, check if we need to request new matches
        if (!upkeepNeeded) {
            // Always try to request matches if interval passed, even if we have matches
            // This allows updating with latest matches
            if (block.timestamp >= lastMatchRequestTime + requestInterval) {
                upkeepNeeded = true;
                performData = abi.encode(uint8(1)); // 1 for match requesting
            }
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        (uint8 upkeepType, uint256 matchId) = abi.decode(performData, (uint8, uint256));
        if (upkeepType == 0) {
            // Resolve match result
            requestMatchResult(matchId);
        } else if (upkeepType == 1) {
            // Request new matches
            // Clear existing matches first to avoid duplicates
            delete matchIds;
            requestMatches();
        }
    }

    function getMatchIdsLength() public view returns (uint256) {
        return matchIds.length;
    }

    function resolveBets(uint256 matchId) public view {
        require(matches[matchId].result > 0, "Match not resolved yet");

        // This would be called after fulfillRequest updates the result
        // In a real implementation, you'd iterate through all bets for this match
        // For simplicity, assuming bets are resolved individually or in batches
    }

    function claimReward(uint256 tokenId) public {
        require(betTicketNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        (uint256 matchId, uint8 prediction, uint256 amount, bool resolved, bool won) = betTicketNFT.betDetails(tokenId);
        require(resolved, "Bet not resolved");
        require(won, "Bet not won");

        uint256 payout = calculatePayout(matchId, prediction, amount);
        usdt.transfer(msg.sender, payout);

        emit BetResolved(tokenId, true, payout);
    }

    function calculatePayout(uint256 matchId, uint8 prediction, uint256 amount) internal view returns (uint256) {
        Match memory matchData = matches[matchId];
        uint256 odds;

        if (prediction == 0) odds = matchData.homeOdds;
        else if (prediction == 1) odds = matchData.drawOdds;
        else odds = matchData.awayOdds;

        return (amount * odds) / 100; // Assuming odds are in percentage
    }
}