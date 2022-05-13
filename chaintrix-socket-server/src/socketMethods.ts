import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Server, Socket } from "socket.io";
import { Connection, PublicKey } from '@solana/web3.js';
import {
    Player, SolanaPlayer, NoBlockchainPlayer,
    GameRoom, BlockchainType, SolanaAcceptedBetInfo
} from "./types";
import { IDL, ChaintrixSolana } from './types/chaintrix_solana';
import { randomBytes } from "crypto";
import { LOCALHOST_PROGRAM_ID, LOCALHOST_SOLANA_ENDPOINT } from "./Constants";
import {
    Card, addCardToBoard, getNewGameState, MoveInfo, getRandomUnusedCardAndAlterArray,
    getStateAfterMove, GAME_STARTED, PlayerPlaysPayload, PLAYER_PLAYED, PlayerPlayedPayload,
    GAME_STARTED_PLAYER_ID, GameStartedPlayerIDPayload, PlayerWantsToPlaySolanaPayload,
    GAME_FINISHED_NO_BLOCKCHAIN, GameFinishedNoBlockchainPayload, GameFinishedSolanaPayload, GAME_FINISHED_SOLANA, GameFinishedHederaPayload, GAME_FINISHED_HEDERA,

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

const getNewRoomName = (): string => {
    // const room = uuid(); // TODO: the room id should be strictly unique!
    return (Math.floor(Math.random() * 100000)).toString();
}

// TODO: check if the betPDA was really done by playerAddress...
// load the account and check the data
export const joinOrCreateRoomSolana = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, players: { [socketID: string]: Player },
    payload: PlayerWantsToPlaySolanaPayload
    // betPDA: string, playerAddress: string
) => {
    let roomID = "blbost";
    const roomsList = Array.from(socket.rooms)
    console.log(roomsList);
    console.log(`betPDA: '${payload.betPDA}';`)

    const connection = new Connection(LOCALHOST_SOLANA_ENDPOINT)
    const provider = anchor.AnchorProvider.local(LOCALHOST_SOLANA_ENDPOINT);
    const program = new Program(IDL, LOCALHOST_PROGRAM_ID, provider);
    const localWallet = anchor.Wallet.local();

    const pubKey = new PublicKey(payload.betPDA)
    const balance = await connection.getBalance(pubKey);
    console.log(`balance is: ${balance}`);

    // automatically in a room with socket id and moreover in a game room
    if (socket.rooms.size >= 2) {
        roomID = `already in a room ${getGameRoomID(socket)}`;
    } else if (!freeRooms || !freeRooms.length) {
        roomID = getNewRoomName();
        console.log(`${socket.id} created, roomID: ${roomID}`);
        freeRooms.push(roomID);
        // TODO: check that the betPDA exists and is loaded
        const player0: SolanaPlayer = {
            address: payload.playerAddress,
            betPDA: payload.betPDA,
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
            betPDA: payload.betPDA,
            address: payload.playerAddress
        };
        console.log(`${socket.id} wants to join, roomID: ${roomID}`);
        socket.join(roomID);
        console.log(`accepting bets solana`)
        // TODO: check error
        const acceptedBetsPDA = await acceptBetsSolana(player0.betPDA, player1.betPDA)
        console.log(`bets accepted`)

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

        sio.to(roomID).emit(GAME_STARTED, newGameState)
        const player0Payload: GameStartedPlayerIDPayload = { playerID: 0 }
        const player1Payload: GameStartedPlayerIDPayload = { playerID: 1 }
        sio.to(player0.socketID).emit(GAME_STARTED_PLAYER_ID, player0Payload)
        sio.to(player1.socketID).emit(GAME_STARTED_PLAYER_ID, player1Payload)
        console.log(`NEW GAME STATE: ${JSON.stringify(newGameState)}`)
    }
}

export const joinOrCreateRoomNoBlockchain = async (sio: Server, socket: Socket,
    freeRooms: Array<string>, roomObjects: RoomObjects, players: { [socketID: string]: Player }
) => {
    let roomID = "";
    const roomsList = Array.from(socket.rooms)
    console.log(roomsList);

    // automatically in a room with socket id and moreover in a game room
    if (socket.rooms.size >= 2) {
        roomID = `already in a room ${getGameRoomID(socket)}`;
        // TODO: inform player that something is wrong (is already in room)
        // socket.emit("joinedOrCreated", { 'roomID': roomID })
        // return;
    } else if (!freeRooms || !freeRooms.length) {
        // const room = uuid(); // TODO: the room id should be strictly unique!
        roomID = getNewRoomName();
        console.log(`no blockchain: ${socket.id} created, roomID: ${roomID}`);
        freeRooms.push(roomID);
        const player0: NoBlockchainPlayer = {
            socketID: socket.id
        }
        players[socket.id] = player0
        socket.join(roomID);
        // TODO: inform player that he's in the line
        // socket.emit("joinedOrCreated", { 'roomID': roomID })
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
        const player0Payload: GameStartedPlayerIDPayload = { playerID: 0 }
        const player1Payload: GameStartedPlayerIDPayload = { playerID: 1 }
        sio.to(player0.socketID).emit(GAME_STARTED_PLAYER_ID, player0Payload)
        sio.to(player1.socketID).emit(GAME_STARTED_PLAYER_ID, player1Payload)
        console.log(`NEW GAME STATE: ${JSON.stringify(newGameState)}`)
    }
}

export const playerPlaysNoBlockchain = async (
    sio: Server, socket: Socket, roomObjects: RoomObjects,
    payload: PlayerPlaysPayload
) => {
    console.log(`NO_BC: payload: ${JSON.stringify(payload)}`)
    const gameRoomID = getGameRoomID(socket);
    const room = roomObjects[gameRoomID]

    const playerMoveResult = playerMove(room, payload)
    if (playerMoveResult.card) {
        const responsePayload: PlayerPlayedPayload = {
            newCardID: playerMoveResult.card.cardID,
            playedCard: payload.card,
            x: payload.x,
            y: payload.y
        }
        sio.to(gameRoomID).emit(PLAYER_PLAYED, responsePayload)
        return;
    }

    if (playerMoveResult.movedType == MovedType.MovedAndNoCardsLeft) {
        const winnerIndex = 0

        if (room.blockchainType == BlockchainType.NO_BLOCKCHAIN) {
            const responsePayload: GameFinishedNoBlockchainPayload = {
                // TODO: who won
                winningPlayerIndex: winnerIndex
            }
            sio.to(gameRoomID).emit(GAME_FINISHED_NO_BLOCKCHAIN, responsePayload)
            return;
        }

        if (room.blockchainType == BlockchainType.SOLANA) {
            const responsePayload: GameFinishedSolanaPayload = {
                // TODO: who won
                winningPlayerIndex: winnerIndex,
                transactionHash: ''

            }
            sio.to(gameRoomID).emit(GAME_FINISHED_SOLANA, responsePayload)
            return;
        }

        if (room.blockchainType == BlockchainType.HEDERA) {
            const responsePayload: GameFinishedHederaPayload = {
                // TODO: who won
                winningPlayerIndex: winnerIndex
            }
            sio.to(gameRoomID).emit(GAME_FINISHED_HEDERA, responsePayload)
            return;
        }
    }
}

enum MovedType {
    Moved,
    MovedAndNoCardsLeft,
    IllegalMove
}

export const playerMove = (room: GameRoom, moveInfo: PlayerPlaysPayload): {
    card: Card | null,
    movedType: MovedType
} => {
    // TODO: check:
    // - is the card in currently playing players cards
    // - is the card valid in the position
    // - is the game phase correct
    // - if the number of cards is 0 (or what exact rule applies), return false/null etc
    const currentlyMoving = room.gameState.currentlyMovingPlayer
    const cardIndex = room.gameState.playersStates[currentlyMoving].cards.findIndex((value) => value.cardID == moveInfo.card.cardID)
    if (cardIndex == -1) {
        // TODO: return error
        throw Error()
    }

    const newBoard = addCardToBoard(room.gameState.board, moveInfo.card, moveInfo.x, moveInfo.y)
    room.gameState.board = newBoard

    // TODO: here?
    if (room.gameState.unusedCards.length < 40) {
        return {
            card: null,
            movedType: MovedType.MovedAndNoCardsLeft
        }
    }

    const newCard = getRandomUnusedCardAndAlterArray(room.gameState.unusedCards)
    room.gameState.playersStates[currentlyMoving].cards[cardIndex] = newCard
    room.gameState = getStateAfterMove(room.gameState)

    return {
        card: newCard,
        movedType: MovedType.Moved
    }
}


