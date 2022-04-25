// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract ChaintrixContract {
    struct Bet {
        address oponentAddress;
        bool isSet; // TODO: rename this...
    }

    address payable server;
    mapping(address => Bet) public playerBets;

    constructor() public {
        server = payable(msg.sender);
    }

    modifier isServer() {
        require(msg.sender == server, "Access denied.");
        _;
    }

    function bet(address payable sender) public payable {
        require(sender == msg.sender, "sender is not the same as payer");
        require(msg.value == 777, "did not send enough tiny hbar");
        require(
            playerBets[msg.sender].isSet == false,
            "already bet, or is playing"
        );

        playerBets[sender].isSet = true;

        // payable(address(this)).transfer(msg.value);
        // sender.transfer(7777);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getOponentAddress(address player) public view returns (address) {
        return playerBets[player].oponentAddress;
    }

    // write to acceptedBets
    function acceptBets(address player0, address player1) public isServer {
        require(player0 != player1, "players cannot be the same");
        // TODO: more checks here, cannot accept bets if oponent is already chosen

        playerBets[player0].isSet = true;
        playerBets[player0].oponentAddress = player1;
        playerBets[player1].isSet = true;
        playerBets[player1].oponentAddress = player0;
    }

    function closeGame(
        address payable player0,
        address payable player1,
        address payable winner
    ) public isServer {
        require(player0 != player1, "players cannot be the same");
        // TODO: check that in playerBets, the keys of player0 and player1 fit well
        require(
            winner == player0 || winner == player1,
            "winner is not one of the players"
        );

        winner.transfer(2 * 777);

        playerBets[player0].isSet = false;
        playerBets[player0].oponentAddress = address(0x0);
        playerBets[player1].isSet = false;
        playerBets[player1].oponentAddress = address(0x0);
    }

    // TODO: write a function that will allow server to close bets for single player
    // (this method will be a check that no hbar will be stuck in the contract)
}
