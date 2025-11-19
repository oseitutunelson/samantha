 // SPDX-License-Identifier: MIT

 pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./BettingToken.sol";
import "./BetTicketNFT.sol";
import "./USDT.sol";

contract BettingContract is FunctionsClient, Ownable {
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
        uint8 result;
        uint256 homeOdds;
        uint256 drawOdds;
        uint256 awayOdds;
    }

    mapping(uint256 => Match) public matches;
    uint256[] public matchIds;
    mapping(bytes32 => uint256) public requestToMatchId;
    uint256 public lastMatchRequestTime;
    uint256 public requestInterval = 10 seconds;
    uint8 public secretsLocation;
    bytes public encryptedSecretsReference;
    
    // Store raw Chainlink response for off-chain parsing
    string public lastChainlinkResponse;
    
    event MatchesFetched(uint256[] matchIds);
    event MatchResultFetched(uint256 matchId, uint8 result);
    event BetPlaced(address user, uint256 tokenId, uint256 matchId, uint8 prediction, uint256 amount);
    event BetResolved(uint256 tokenId, bool won, uint256 payout);
    event ChainlinkResponseReceived(string response);

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
        secretsLocation = 255;
    }

    function setSecretsReference(uint8 _location, bytes calldata _reference) external onlyOwner {
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
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(matchesSourceCode);

        if (secretsLocation == 0 && encryptedSecretsReference.length > 0) {
            uint64 version = bytesToUint64(encryptedSecretsReference);
            req.addDONHostedSecrets(0, version);
        } else if (secretsLocation == 1 && encryptedSecretsReference.length > 0) {
            req.addSecretsReference(encryptedSecretsReference);
        }

        _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
        lastMatchRequestTime = block.timestamp;
    }

    function requestMatchResult(uint256 matchId) public {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(resultsSourceCode);

        if (secretsLocation == 0 && encryptedSecretsReference.length > 0) {
            uint64 version = bytesToUint64(encryptedSecretsReference);
            req.addDONHostedSecrets(0, version);
        }

        string[] memory args = new string[](1);
        args[0] = string(abi.encodePacked(matchId));
        req.setArgs(args);

        bytes32 requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
        requestToMatchId[requestId] = matchId;
    }

    function bytesToUint64(bytes memory b) internal pure returns (uint64) {
        require(b.length >= 8, "Invalid bytes length");
        uint64 result = 0;
        for (uint i = 0; i < 8; i++) {
            result = result | (uint64(uint8(b[i])) << (8 * (7 - i)));
        }
        return result;
    }

    // ABSOLUTE MINIMAL CALLBACK - just succeed
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory) internal override {
        uint256 matchId = requestToMatchId[requestId];
        
        if (matchId != 0) {
            // Result request
            uint256 result = abi.decode(response, (uint256));
            matches[matchId].result = uint8(result);
            emit MatchResultFetched(matchId, uint8(result));
        }
        // For matches request, do nothing - just succeed
    }

    // OWNER MANUALLY ADDS MATCHES (split to avoid stack too deep)
    function addMatch(
        uint256 id,
        string calldata homeTeam,
        string calldata awayTeam,
        uint256 matchDate,
        uint256 homeOdd,
        uint256 drawOdd,
        uint256 awayOdd
    ) external onlyOwner {
        matches[id] = Match({
            id: id,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            matchDate: matchDate,
            result: 0,
            homeOdds: homeOdd,
            drawOdds: drawOdd,
            awayOdds: awayOdd
        });
        matchIds.push(id);
    }

    // Clear all matches
    function clearMatches() external onlyOwner {
        delete matchIds;
    }

    // Emit event after adding all matches
    function finalizeMatches() external onlyOwner {
        emit MatchesFetched(matchIds);
    }

    function placeBet(uint256 matchId, uint8 prediction, uint256 amount) public {
        require(matches[matchId].id != 0, "Match does not exist");
        require(matches[matchId].result == 0, "Match already resolved");
        require(prediction <= 2, "Invalid prediction");
        usdt.transferFrom(msg.sender, address(this), amount);
        uint256 tokenId = betTicketNFT.mintBetTicket(msg.sender, matchId, prediction, amount);
        emit BetPlaced(msg.sender, tokenId, matchId, prediction, amount);
    }

    function getMatchIdsLength() public view returns (uint256) {
        return matchIds.length;
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
        return (amount * odds) / 100;
    }
}

 