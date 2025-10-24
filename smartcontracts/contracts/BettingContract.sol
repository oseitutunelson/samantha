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
    ) FunctionsClient(router) Ownable(msg.sender) {
        subscriptionId = _subscriptionId;
        donId = _donId;
        bettingToken = BettingToken(_bettingToken);
        betTicketNFT = BetTicketNFT(_betTicketNFT);
        usdt = USDT(_usdt);
    }

    function setMatchesSource(string memory source) public onlyOwner {
        matchesSourceCode = source;
    }

    function setResultsSource(string memory source) public onlyOwner {
        resultsSourceCode = source;
    }

    function requestMatches() public onlyOwner {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(matchesSourceCode);
        req.addDONHostedSecrets(0, 0);

        bytes32 requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
        requestType[requestId] = true;
    }

    function requestMatchResult(uint256 matchId) internal {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(resultsSourceCode);
        req.addDONHostedSecrets(0, 0);
        string[] memory args = new string[](1);
        args[0] = string(abi.encodePacked(matchId));
        req.setArgs(args);

        bytes32 requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
        requestToMatchId[requestId] = matchId;
        requestType[requestId] = false;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (err.length > 0) {
            revert(string(err));
        }

        if (requestType[requestId]) {
            // Handle matches response
            (uint256[] memory ids, string[] memory homeTeams, string[] memory awayTeams, uint256[] memory dates, uint256[] memory homeOdds, uint256[] memory drawOdds, uint256[] memory awayOdds) = abi.decode(response, (uint256[], string[], string[], uint256[], uint256[], uint256[], uint256[]));

            for (uint i = 0; i < ids.length; i++) {
                matches[ids[i]] = Match(ids[i], homeTeams[i], awayTeams[i], dates[i], 0, homeOdds[i], drawOdds[i], awayOdds[i]);
                matchIds.push(ids[i]);
            }

            emit MatchesFetched(ids);
        } else {
            // Handle result response
            (uint256 matchId, uint8 result) = abi.decode(response, (uint256, uint8));
            matches[matchId].result = result;

            emit MatchResultFetched(matchId, result);
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
        for (uint i = 0; i < matchIds.length; i++) {
            uint256 matchId = matchIds[i];
            if (matches[matchId].result == 0 && block.timestamp > matches[matchId].matchDate + 2 hours) {
                upkeepNeeded = true;
                performData = abi.encode(matchId);
                break;
            }
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256 matchId = abi.decode(performData, (uint256));
        requestMatchResult(matchId);
    }

    function resolveBets(uint256 matchId) public view{
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
