import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Server, Socket } from "socket.io";
import { Connection, PublicKey } from '@solana/web3.js';
import { Player, SolanaPlayer, NoBlockchainPlayer, HederaPlayer, GameRoom, BlockchainType, AcceptedBetInfo, SolanaAcceptedBetInfo } from "./types";
import { IDL, ChaintrixSolana } from './types/chaintrix_solana';
import { randomBytes } from "crypto";
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOLANA_ENDPOINT } from "./Constants";
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState,
    checkValidity, addCardToBoard,
    getBoardHeight, getBoardWidth, getObligatoryPlayersCards,
    getNewGameState, MoveInfo, getRandomUnusedCardAndAlterArray,
    getStateAfterMove, GAME_STARTED, PlayerPlaysPayload,
    PLAYER_PLAYED, PlayerPlayedPayload
} from '../../chaintrix-game-mechanics/dist/index.js';
import { acceptBetsSolana, closeGameSolana } from "./SolanaMethods";
// } from 'chaintrix-game-mechanics';

const NUMBER_OF_PLAYERS = 2

// TODO: roomID: should be strictly unique, not from 1 to 10000

type RoomObjects = { [key: string]: GameRoom }

const getGameRoomID = (socket: Socket): string | null => {
    if (socket.rooms.size != 2) return null
    let answer = null
    socket.rooms.forEach(item => {
        if (item != socket.id) { answer = item };
    })
    return answer;
}

// TODO: check if the betPDA was really done by playerAddress...
// load the account and check the data
export const joinRoomOrCreate = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, players: { [socketID: string]: Player },
    betPDA: string, playerAddress: string
) => {
    let roomID = "blbost";
    const roomsList = Array.from(socket.rooms)
    console.log(roomsList);
    console.log(`betPDA: '${betPDA}';`)

    const connection = new Connection(LOCALHOST_SOLANA_ENDPOINT)
    const provider = anchor.AnchorProvider.local(LOCALHOST_SOLANA_ENDPOINT);
    const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);
    const localWallet = anchor.Wallet.local();

    const pubKey = new PublicKey(betPDA)
    const balance = await connection.getBalance(pubKey);
    console.log(`balance is: ${balance}`);

    // automatically in a room with socket id and moreover in a game room
    if (socket.rooms.size >= 2) {
        roomID = `already in a room ${getGameRoomID(socket)}`;
    } else if (!freeRooms || !freeRooms.length) {
        // const room = uuid(); // TODO: the room id should be strictly unique!
        roomID = (Math.floor(Math.random() * 100000)).toString();
        console.log(`${socket.id} created, roomID: ${roomID}`);
        freeRooms.push(roomID);
        const player0: SolanaPlayer = {
            address: playerAddress,
            betPDA: betPDA,
            socketID: socket.id
        }
        players[socket.id] = player0
        socket.join(roomID);
    } else {
        roomID = freeRooms[0];
        let clients = sio.sockets.adapter.rooms.get(roomID);
        const player0: SolanaPlayer = players[Array.from(clients)[0]] as SolanaPlayer;
        delete players[clients[0]];
        const player1: SolanaPlayer = {
            socketID: socket.id,
            betPDA: betPDA,
            address: playerAddress
        };
        console.log(`${socket.id} wants to join, roomID: ${roomID}`);
        socket.join(roomID);

        // TODOOOOOOOOOOOOOOOOOOOOOO 
        const acceptedBetsPDA = await acceptBetsSolana(player0.betPDA, player1.betPDA)

        const playersInRoom = [player0, player1];

        console.log(`clients list: ${JSON.stringify(playersInRoom)}`)
        const acceptedBetInfo: SolanaAcceptedBetInfo = {
            acceptedBetAccount: acceptedBetsPDA.toBase58()
        }
        const newGameState = getNewGameState()
        roomObjects[roomID] = {
            players: playersInRoom,
            gameState: newGameState,
            blockchainType: BlockchainType.SOLANA,
            acceptedBetInfo: acceptedBetInfo
        }
        freeRooms.shift();

        sio.to(roomID).emit("gameStarted", newGameState)

        // TODO: call smart contract: accept bets
    }
    socket.emit("joinedOrCreated", { 'roomID': roomID })
}

export const joinOrCreateRoomNoBlockchain = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, players: { [socketID: string]: Player }
) => {
    let roomID = "blbost";
    const roomsList = Array.from(socket.rooms)
    console.log(roomsList);

    // automatically in a room with socket id and moreover in a game room
    if (socket.rooms.size >= 2) {
        roomID = `already in a room ${getGameRoomID(socket)}`;
    } else if (!freeRooms || !freeRooms.length) {
        // const room = uuid(); // TODO: the room id should be strictly unique!
        roomID = (Math.floor(Math.random() * 100000)).toString();
        console.log(`no blockchain: ${socket.id} created, roomID: ${roomID}`);
        freeRooms.push(roomID);
        const player0: NoBlockchainPlayer = {
            socketID: socket.id
        }
        players[socket.id] = player0
        socket.join(roomID);
    } else {
        roomID = freeRooms[0];
        let clients = sio.sockets.adapter.rooms.get(roomID);
        const player0: NoBlockchainPlayer = players[Array.from(clients)[0]] as NoBlockchainPlayer;
        delete players[clients[0]];
        const player1: NoBlockchainPlayer = {
            socketID: socket.id
        };
        console.log(`no blockchain:  ${socket.id} wants to join, roomID: ${roomID}`);
        socket.join(roomID);

        const playersInRoom = [player0, player1];

        console.log(`clients list: ${JSON.stringify(playersInRoom)}`)
        const newGameState = getNewGameState()
        roomObjects[roomID] = {
            players: playersInRoom,
            gameState: newGameState,
            blockchainType: BlockchainType.NO_BLOCKCHAIN
        }
        freeRooms.shift();

        sio.to(roomID).emit(GAME_STARTED, newGameState)
        console.log(`NEW GAME STATE: ${JSON.stringify(newGameState)}`)
    }
    // socket.emit("joinedOrCreated", { 'roomID': roomID })
}

export const playerPlaysNoBlockchain = async (
    sio: Server, socket: Socket, roomObjects: RoomObjects,
    payload: PlayerPlaysPayload
) => {
    console.log(`NO_BC: payload: ${JSON.stringify(payload)}`)
    const gameRoomID = getGameRoomID(socket);
    const room = roomObjects[gameRoomID]

    const newCard = playerMove(room, payload)
    const responsePayload: PlayerPlayedPayload = {
        newCardID: newCard.cardID,
        playedCard: payload.card,
        x: payload.x,
        y: payload.y
    }
    sio.to(gameRoomID).emit(PLAYER_PLAYED, responsePayload)

}

export const playerMove = (room: GameRoom, moveInfo: PlayerPlaysPayload): Card => {
    // TODO: check:
    // - is the card in currently playing players cards
    // - is the card valid in the position
    // - is the game phase correct
    const currentlyMoving = room.gameState.currentlyMovingPlayer
    const cardIndex = room.gameState.playersStates[currentlyMoving].cards.findIndex((value) => value.cardID == moveInfo.card.cardID)
    if (cardIndex == -1) {
        // TODO: return error
        throw Error()
    }

    const newBoard = addCardToBoard(room.gameState.board, moveInfo.card, moveInfo.x, moveInfo.y)
    room.gameState.board = newBoard
    const newCard = getRandomUnusedCardAndAlterArray(room.gameState.unusedCards)
    room.gameState.playersStates[currentlyMoving].cards[cardIndex] = newCard
    room.gameState = getStateAfterMove(room.gameState)

    return newCard
}


// TODO: if these methods are async, will it make any problems? 
// TODO: keep some variables that will be changed (e.g. game closed etc, if the game is already closed, don't do anything)
export const playersTurn = async (sio: Server, socket: Socket, roomObjects: RoomObjects, moveInfo: MoveInfo) => {
    const roomGameID = getGameRoomID(socket);
    const room = roomObjects[roomGameID]

    console.log(`the socket ${socket.id} called playersTurn. RoomID: ${roomGameID}`)
    // TODO: better error handling here
    if (!room) return;

    // playerMove(room, moveInfo)

    // the finishing condition (artificial rn)
    if (room.gameState.unusedCards.length < 50) {
        // TODO: chose who won in method that will be common to all 
        // TODO call a smart contract finish game
        await closeGameSolana(room)
        console.log(`gameSuccesfullyFinished`)
        sio.to(roomGameID).emit("gameSuccesfullyFinished")
        return
    }

    // TODO all logic here with afterCardAdded 

    sio.to(roomGameID).emit('playerPlayed', `(playerPlaying: ${room.gameState.currentlyMovingPlayer})`);
    // socket.leave(roomGameID)
}
