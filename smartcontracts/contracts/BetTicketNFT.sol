// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BetTicketNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct BetDetails {
        uint256 matchId;
        uint8 prediction; // 0: home win, 1: draw, 2: away win
        uint256 amount;
        bool resolved;
        bool won;
    }

    mapping(uint256 => BetDetails) public betDetails;

    constructor() ERC721("BetTicketNFT", "BETNFT") Ownable(msg.sender) {}

    function mintBetTicket(
        address to,
        uint256 matchId,
        uint8 prediction,
        uint256 amount
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        betDetails[tokenId] = BetDetails(matchId, prediction, amount, false, false);
        return tokenId;
    }

    function resolveBet(uint256 tokenId, bool won) public onlyOwner {
        require(!betDetails[tokenId].resolved, "Bet already resolved");
        betDetails[tokenId].resolved = true;
        betDetails[tokenId].won = won;
    }
}
