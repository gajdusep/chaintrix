// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// TODO: public vs external

contract ChaintrixContract {
    struct Bet {
        address opponentAddress;
        bool isSet; // TODO: rename this...
    }

    struct Game {
        address fileID;
    }

    uint256 betAmount;
    uint256 treasuryAmount;
    address payable server;
    address payable treasury;
    mapping(address => Bet) public playerBets;
    Game[] games;

    constructor(
        uint256 _betAmount,
        uint256 _treasuryAmount,
        address _treasury
    ) {
        server = payable(msg.sender);
        betAmount = _betAmount;
        treasuryAmount = _treasuryAmount;
        treasury = payable(_treasury);
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

    function isAddressEmpty(address addressToCheck)
        internal
        pure
        returns (bool)
    {
        return addressToCheck == address(0);
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

    // TODO: close bet without playing

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
    function acceptBets(address player0, address player1) external isServer {
        require(player0 != player1, "players cannot be the same");
        require(!isAddressEmpty(player0));
        require(!isAddressEmpty(player1));
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
        uint256 winnerIndex,
        address gameFileId
    ) external isServer {
        require(player0 != player1, "players cannot be the same");
        require(
            winnerIndex == 0 || winnerIndex == 0 || winnerIndex == 255,
            "winner index incorrect"
        );
        require(!isAddressEmpty(player0));
        require(!isAddressEmpty(player1));
        require(isOpponentCorrect(player0, player1));
        require(isOpponentCorrect(player1, player0));

        playerBets[player0] = Bet(address(0), false);
        playerBets[player1] = Bet(address(0), false);

        uint256 winnerPrice = 2 * betAmount - treasuryAmount;

        if (winnerIndex == 0) {
            // Player 0 won
            player0.transfer(winnerPrice);
            treasury.transfer(treasuryAmount);
        } else if (winnerIndex == 1) {
            // Player 1 won
            player1.transfer(winnerPrice);
            treasury.transfer(treasuryAmount);
        } else {
            // It's a draw
            player0.transfer(betAmount);
            player1.transfer(betAmount);
        }

        games.push(Game(gameFileId));
    }

    function getOneGame() external view returns (address) {
        return (games[0].fileID);
    }

    function getAllGames()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        address[] memory addrs = new address[](games.length);
        uint256[] memory indexes = new uint256[](games.length);

        for (uint256 i = 0; i < games.length; i++) {
            Game storage game = games[i];
            addrs[i] = game.fileID;
            indexes[i] = i;
        }

        return (addrs, indexes);
    }

    // TODO: write a function that will allow server to close bets for single player
    // (this method will be a check that no hbar will be stuck in the contract)

    function getAll() external view returns (address[] memory) {
        address[] memory addrs = new address[](games.length);

        for (uint256 i = 0; i < games.length; i++) {
            Game memory game = games[i];
            addrs[i] = game.fileID;
        }

        return (addrs);
    }
}
