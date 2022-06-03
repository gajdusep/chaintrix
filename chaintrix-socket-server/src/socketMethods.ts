import { Server, Socket } from "socket.io";
import {
    Player, SolanaPlayer, NoBlockchainPlayer,
    GameRoom, BlockchainType, HederaPlayer, AcceptedBetInfo
} from "./types";
import {
    Card, addCardToBoard, getNewGameState, MoveInfo,
    getStateAfterMove, GAME_STARTED, PlayerPlaysPayload, PLAYER_PLAYED, PlayerWantsToPlaySolanaPayload,
    GAME_FINISHED_NO_BLOCKCHAIN, GameFinishedNoBlockchainPayload, GameFinishedSolanaPayload,
    GAME_FINISHED_SOLANA, GameFinishedHederaPayload, GAME_FINISHED_HEDERA, SOCKET_ERROR,
    ALREADY_IN_ROOM_ERROR_MSG, SOCKET_CREATED_ROOM_AND_WAITING, SOLANA_BET_ACCOUNT_ERROR_MSG, HEDERA_BET_ERROR_MSG,
    PlayerWantsToPlayHederaPayload, DECK_SIZE, updateGameStateAfterDeckCardSelected, getAndRemoveRandomCardIdFromDeck,
    getNumberOfPlayableCards,
    getRandomCardIdFromDeck,
    Move,
    serializeMoves,
    GameStartedPayload
} from '../../chaintrix-game-mechanics/dist/index.js';
import { acceptBetsSolana, checkBetAccount, solanaCloseGame } from "./SolanaMethods";
import { acceptBetsHedera, checkPlayerBet, getHederaConfig, hederaCloseGame, toSolidity } from "./HederaMethods";
import { toSolidityAddress } from "@hashgraph/sdk/lib/EntityIdHelper";
import { json } from "stream/consumers";
// } from 'chaintrix-game-mechanics';

type RoomObjects = { [key: string]: GameRoom }

const getGameRoomID = (socket: Socket): string | null => {
    if (socket.rooms.size != 2) return null
    let answer = null
    socket.rooms.forEach(item => {
        if (item != socket.id) { answer = item };
    })
    return answer;
}

const getNewRoomName = (): string => {
    // const room = uuid(); // TODO: the room id should be strictly unique!
    return (Math.floor(Math.random() * 100000)).toString();
}

const getJoiningPlayerNoBlockchain = (socket: Socket): NoBlockchainPlayer => {
    return {
        socketID: socket.id
    }
}

const getJoiningPlayerSolana = async (
    socket: Socket, solanaPayload: PlayerWantsToPlaySolanaPayload
): Promise<SolanaPlayer | null> => {
    if (!checkBetAccount(solanaPayload)) {
        return null;
    }

    return {
        address: solanaPayload.playerAddress,
        betPDA: solanaPayload.betPDA,
        socketID: socket.id
    }
}

const getJoiningPlayerHedera = async (
    socket: Socket, hederaPayload: PlayerWantsToPlayHederaPayload
): Promise<HederaPlayer | null> => {
    console.log(`checking hedera play bet for player: ${hederaPayload.playerAddress}`)
    if (!checkPlayerBet(hederaPayload)) {
        return null;
    }

    return {
        socketID: socket.id,
        address: hederaPayload.playerAddress
    }
}

const INITIAL_TIME = 30
const SERVER_INITIAL_TIME = INITIAL_TIME + 1
const getNewTimer = (room: GameRoom, callback: any) => {

    const timer = setInterval(() => {
        // remainingTime -= 1;
        room.remainingTime = room.remainingTime - 1
        console.log(`timer tick: ${room.remainingTime}`)
        if (room.remainingTime <= 0) {
            console.log(`timer run out: ${room.remainingTime}`)
            clearInterval(timer)
            callback()
        }
    }, 1000);

    return timer;
}

export const joinOrCreateRoom = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, waitingPlayers: { [socketID: string]: Player },
    blockchainType: BlockchainType,
    solanaPayload?: PlayerWantsToPlaySolanaPayload,
    hederaPayload?: PlayerWantsToPlayHederaPayload
) => {
    if (socket.rooms.size >= 2) {
        socket.emit(SOCKET_ERROR, ALREADY_IN_ROOM_ERROR_MSG);
        console.log(`Player ${socket.id} tried to connect again`)
        return;
    }

    // Check Hedera and Solana account, if everything is fine, continue
    let joiningPlayer = null
    switch (blockchainType) {
        case BlockchainType.NO_BLOCKCHAIN:
            joiningPlayer = getJoiningPlayerNoBlockchain(socket);
            break;
        case BlockchainType.SOLANA:
            joiningPlayer = await getJoiningPlayerSolana(socket, solanaPayload)
            if (joiningPlayer == null) {
                socket.emit(SOCKET_ERROR, SOLANA_BET_ACCOUNT_ERROR_MSG)
                return;
            }
            break;
        case BlockchainType.HEDERA:
            joiningPlayer = await getJoiningPlayerHedera(socket, hederaPayload)
            if (joiningPlayer == null) {
                socket.emit(SOCKET_ERROR, HEDERA_BET_ERROR_MSG)
                return;
            }
            break;
    }

    // there is not already created room, so joining player creates one and joins it
    if (!freeRooms || !freeRooms.length) {
        const gameRoomID = getNewRoomName();
        freeRooms.push(gameRoomID);
        waitingPlayers[socket.id] = joiningPlayer
        socket.join(gameRoomID);
        socket.emit(SOCKET_CREATED_ROOM_AND_WAITING);

        console.log(`${blockchainType} Room created: created, roomID: ${gameRoomID}, player0: ${JSON.stringify(joiningPlayer)}`);
        return;
    }

    // get free room, remove it from the free rooms, and join it
    const gameRoomID = freeRooms[0];
    freeRooms.shift();
    socket.join(gameRoomID);

    // get the already present player and 
    let clients = Array.from(sio.sockets.adapter.rooms.get(gameRoomID));
    const waitingPlayerSocketID = clients[0]
    const waitingPlayer = waitingPlayers[waitingPlayerSocketID];
    delete waitingPlayers[waitingPlayerSocketID];

    // TODO: based on blockchain, accept bets and create a new room object
    let acceptedBetInfo: AcceptedBetInfo = null
    switch (blockchainType) {
        case BlockchainType.NO_BLOCKCHAIN:
            break;
        case BlockchainType.SOLANA:
            // TODO: if accept bets fail, what will happen?
            const acceptedBetsPDA = await acceptBetsSolana(
                (waitingPlayer as SolanaPlayer).betPDA,
                (joiningPlayer as SolanaPlayer).betPDA
            )
            // TODO: if acceptedbetsPDA is null, emit error and return
            acceptedBetInfo = {
                acceptedBetAccount: acceptedBetsPDA.toBase58()
            }
            break;
        case BlockchainType.HEDERA:
            const result = await acceptBetsHedera(
                getHederaConfig(),
                toSolidity((waitingPlayer as HederaPlayer).address),
                toSolidity((joiningPlayer as HederaPlayer).address)
            )
            acceptedBetInfo = {}
            break;
    }

    // save a new Room object with all information
    const playersInRoom = [joiningPlayer, waitingPlayer];
    const newGameState = getNewGameState()
    roomObjects[gameRoomID] = {
        players: playersInRoom,
        gameState: newGameState,
        blockchainType: blockchainType,
        acceptedBetInfo: acceptedBetInfo
    }
    const room = roomObjects[gameRoomID]
    room.remainingTime = SERVER_INITIAL_TIME;
    room.timer = getNewTimer(room, () => closeGameCallback(room, sio, gameRoomID))

    console.log(`${blockchainType} new gameroom created with players: ${JSON.stringify(playersInRoom)}`)

    const player0Payload: GameStartedPayload = { playerID: 0, gameState: newGameState, seconds: INITIAL_TIME }
    const player1Payload: GameStartedPayload = { playerID: 1, gameState: newGameState, seconds: INITIAL_TIME }
    sio.to(waitingPlayer.socketID).emit(GAME_STARTED, player0Payload)
    sio.to(joiningPlayer.socketID).emit(GAME_STARTED, player1Payload)
    // sio.to(gameRoomID).emit(GAME_STARTED, newGameState)
}

const closeGameNoBlockchainSocket = async (winnerIndex: number, sio: Server, gameRoomID: string) => {
    const responsePayload: GameFinishedNoBlockchainPayload = {
        winningPlayerIndex: winnerIndex
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_NO_BLOCKCHAIN, responsePayload)
}

const closeGameSolanaSocket = async (winnerIndex: number, sio: Server, gameRoomID: string, room: GameRoom) => {
    // TODO: calculate who won and send in the finalization message

    // TODO: game finished and waiting for finalization
    // sio.to(gameRoomID).emit(..., responsePayload)

    await solanaCloseGame(room)
    const responsePayload: GameFinishedSolanaPayload = {
        winningPlayerIndex: winnerIndex,
        transactionHash: ''
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_NO_BLOCKCHAIN, responsePayload)
    // TODO!!!
    // sio.to(gameRoomID).emit(GAME_FINISHED_SOLANA, responsePayload)
}

const closeGameHederaSocket = async (
    winnerIndex: number, sio: Server, gameRoomID: string, gameRoom: GameRoom
) => {
    // TODO: calculate who won and send in the finalization message

    // TODO: game finished and waiting for finalization
    // sio.to(gameRoomID).emit(..., responsePayload)

    let winnerAddress = (gameRoom.players[0] as HederaPlayer).address
    if (winnerIndex == 1) {
        winnerAddress = (gameRoom.players[1] as HederaPlayer).address
    }
    await hederaCloseGame(
        gameRoom,
        getHederaConfig(),
        toSolidity((gameRoom.players[0] as HederaPlayer).address),
        toSolidity((gameRoom.players[1] as HederaPlayer).address),
        winnerAddress
    )
    const responsePayload: GameFinishedHederaPayload = {
        winningPlayerIndex: winnerIndex
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_NO_BLOCKCHAIN, responsePayload)
    // TODO: !!!
    // sio.to(gameRoomID).emit(GAME_FINISHED_HEDERA, responsePayload)
}

const closeGameCallback = async (room: GameRoom, sio: Server, gameRoomID: string) => {
    // TODO: winner index calculated from the game room data
    const winnerIndex = 0

    console.log(`GAME OVER, MOVES: ${serializeMoves(room.gameState.moves)}`)
    // TODO: !!! emit to the room, that the game is over and it's closing the game also on the blockchains

    switch (room.blockchainType) {
        case BlockchainType.NO_BLOCKCHAIN:
            await closeGameNoBlockchainSocket(winnerIndex, sio, gameRoomID)
            break;
        case BlockchainType.SOLANA:
            await closeGameSolanaSocket(winnerIndex, sio, gameRoomID, room)
            break;
        case BlockchainType.HEDERA:
            await closeGameHederaSocket(winnerIndex, sio, gameRoomID, room)
            break;
        default:
            break;
    }

    const clients = await sio.in(gameRoomID).fetchSockets();
    for (const client of clients) {
        client.leave(gameRoomID)
        console.log(`client: ${client.id} left ${gameRoomID}`)
    }
}

export const playerPlays = async (
    sio: Server, socket: Socket, roomObjects: RoomObjects,
    payload: PlayerPlaysPayload
) => {
    const gameRoomID = getGameRoomID(socket);
    const room = roomObjects[gameRoomID]
    console.log(`${room.blockchainType}: payload: ${JSON.stringify(payload)}`)

    const playerMoveResult = playerMove(room, payload)
    // add this move to moves
    const move: Move = {
        newCardID: playerMoveResult.newCardId,
        playedCard: payload.card,
        x: payload.x,
        y: payload.y
    }
    room.gameState.moves.push(move)

    // game is not over yet
    if (playerMoveResult.newCardId || playerMoveResult.movedType == MovedType.MOVED_AND_DECK_EMPTY) {
        room.remainingTime = SERVER_INITIAL_TIME
        clearInterval(room.timer)
        room.timer = getNewTimer(room, () => closeGameCallback(room, sio, gameRoomID))

        sio.to(gameRoomID).emit(PLAYER_PLAYED, move)
        return;
    }

    if (playerMoveResult.movedType == MovedType.MOVED_AND_PLAYERS_NO_CARDS) {
        clearInterval(room.timer)
        closeGameCallback(room, sio, gameRoomID)
    }
}

enum MovedType {
    MOVED,
    MOVED_AND_DECK_EMPTY,
    MOVED_AND_PLAYERS_NO_CARDS,
    ILLEGAL_MOVE
}

export const playerMove = (room: GameRoom, moveInfo: PlayerPlaysPayload): {
    newCardId: string | null,
    movedType: MovedType
} => {
    // TODO: check:
    // - is the card in currently playing players cards
    // - is the card valid in the position
    // - is the game phase correct
    // - if the number of cards is 0 (or what exact rule applies), return false/null etc
    const currentlyMoving = room.gameState.currentlyMovingPlayer
    const cardIndex = room.gameState.playersStates[currentlyMoving].cards.findIndex((value) => value?.cardID == moveInfo.card.cardID)
    if (cardIndex == -1) {
        console.log(`what cardIndex: ${cardIndex}, ${JSON.stringify(room.gameState.playersStates[currentlyMoving].cards)}`)
        // TODO: return error
        throw Error()
    }

    const newBoard = addCardToBoard(room.gameState.board, moveInfo.card, moveInfo.x, moveInfo.y)
    room.gameState.board = newBoard

    let newCardID: string | null = null
    let movedType = MovedType.MOVED_AND_DECK_EMPTY
    if (room.gameState.deck.length != 0) {
        newCardID = getRandomCardIdFromDeck(room.gameState.deck)
        movedType = MovedType.MOVED
    }
    room.gameState = updateGameStateAfterDeckCardSelected(room.gameState, moveInfo.card.cardID, newCardID)

    if (
        room.gameState.deck.length == 0 &&
        getNumberOfPlayableCards(room.gameState.playersStates[0].cards) == 0 &&
        getNumberOfPlayableCards(room.gameState.playersStates[1].cards) == 0
    ) {
        return {
            newCardId: null,
            movedType: MovedType.MOVED_AND_PLAYERS_NO_CARDS
        }
    }
    room.gameState = getStateAfterMove(room.gameState)

    return {
        newCardId: newCardID,
        movedType: movedType
    }
}


