// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract ChaintrixContract {
    struct Bet {
        address opponentAddress;
        bool isSet; // TODO: rename this...
    }

    uint256 betAmount;
    address payable server;
    mapping(address => Bet) public playerBets;

    constructor(uint256 _betAmount) {
        server = payable(msg.sender);
        betAmount = _betAmount;
    }

    modifier isServer() {
        require(msg.sender == server, "Access denied.");
        _;
    }

    function bet(address payable sender) public payable {
        require(sender == msg.sender, "sender is not the same as payer");
        require(msg.value == betAmount, "did not send enough tiny hbar");
        require(
            playerBets[msg.sender].isSet == false,
            "already bet, or is playing"
        );

        playerBets[sender].isSet = true;
    }

    function hasPlayerPlacedBet(address playerAddress)
        public
        view
        returns (bool)
    {
        return
            playerBets[playerAddress].isSet == true &&
            playerBets[playerAddress].opponentAddress == address(0);
    }

    function isAddressNotEmpty(address addressToCheck)
        internal
        pure
        returns (bool)
    {
        return addressToCheck != address(0);
    }

    function isOpponentCorrect(address player, address opponent)
        internal
        view
        returns (bool)
    {
        return
            playerBets[player].isSet == true &&
            playerBets[player].opponentAddress == opponent;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getServerAddress() public view isServer returns (address) {
        return address(server);
    }

    function getOpponentAddress(address player) public view returns (address) {
        return playerBets[player].opponentAddress;
    }

    // write to acceptedBets
    function acceptBets(address player0, address player1) public isServer {
        require(player0 != player1, "players cannot be the same");
        require(isAddressNotEmpty(player0));
        require(isAddressNotEmpty(player1));
        require(playerBets[player0].isSet == true, "player0 has not bet");
        require(playerBets[player1].isSet == true, "player1 has not bet");
        require(
            playerBets[player0].opponentAddress == address(0),
            "player0 already playing"
        );
        require(
            playerBets[player1].opponentAddress == address(0),
            "player1 already playing"
        );
        require(this.hasPlayerPlacedBet(player0));
        require(this.hasPlayerPlacedBet(player1));

        playerBets[player0] = Bet(player1, true);
        playerBets[player1] = Bet(player0, true);
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
        require(isAddressNotEmpty(player0));
        require(isAddressNotEmpty(player1));
        require(isOpponentCorrect(player0, player1));
        require(isOpponentCorrect(player1, player0));

        playerBets[player0] = Bet(address(0), false);
        playerBets[player1] = Bet(address(0), false);

        // TODO: check the order of actions
        winner.transfer(2 * betAmount);
    }

    // TODO: write a function that will allow server to close bets for single player
    // (this method will be a check that no hbar will be stuck in the contract)
}
