import { Server, Socket } from "socket.io";
import { GameRoom, HederaPlayer } from "../types";
import {
    GAME_FINISHED_NO_BLOCKCHAIN, GameFinishedNoBlockchainPayload, GameFinishedSolanaPayload,
    GAME_FINISHED_SOLANA, GameFinishedHederaPayload, GAME_FINISHED_HEDERA,
    BlockchainType, GAME_FINISHED_AND_WAITING_FOR_FINALIZATION,
    GameFinishedGenericPayload, GameClosedReason, mod, calculateLongestPathForColor,
    serializeGame,
    ITS_A_DRAW_CONSTANT
} from 'chaintrix-game-mechanics';
import { solanaCloseGame } from "../blockchainMethods/solanaMethods";
import { getHederaConfig, hederaCloseGame, toSolidity } from "../blockchainMethods/hederaMethods";

const closeGameNoBlockchainSocket = async (
    winnerIndex: number, sio: Server, gameRoomID: string,
    gameClosedReason: GameClosedReason
) => {
    const responsePayload: GameFinishedNoBlockchainPayload = {
        winnerIndex: winnerIndex,
        gameClosedReason: gameClosedReason
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_NO_BLOCKCHAIN, responsePayload)
}


const closeGameSolanaSocket = async (
    winnerIndex: number, sio: Server, gameRoomID: string, room: GameRoom,
    gameClosedReason: GameClosedReason
) => {
    // send an information to a client that the game is closed
    const finishedAndWaitingPayload: GameFinishedGenericPayload = {
        winnerIndex: winnerIndex,
        gameClosedReason: gameClosedReason
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_AND_WAITING_FOR_FINALIZATION, finishedAndWaitingPayload)

    // finalize solana transactions
    const serializedGameState = serializeGame(room.gameState, gameClosedReason)
    await solanaCloseGame(room, winnerIndex, serializedGameState)
    const responsePayload: GameFinishedSolanaPayload = {
        winnerIndex: winnerIndex,
        gameClosedReason: gameClosedReason,
        transactionHash: ''
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_SOLANA, responsePayload)
}

const closeGameHederaSocket = async (
    winnerIndex: number, sio: Server, gameRoomID: string, gameRoom: GameRoom,
    gameClosedReason: GameClosedReason
) => {
    // send an information to a client that the game is closed
    const finishedAndWaitingPayload: GameFinishedGenericPayload = {
        winnerIndex: winnerIndex,
        gameClosedReason: gameClosedReason
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_AND_WAITING_FOR_FINALIZATION, finishedAndWaitingPayload)

    // finalize hedera transactions
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
        winnerIndex: winnerIndex,
        gameClosedReason: gameClosedReason
    }
    sio.to(gameRoomID).emit(GAME_FINISHED_HEDERA, responsePayload)
}

export const closeGameCallback = async (room: GameRoom, sio: Server, gameRoomID: string, gameClosedReason: GameClosedReason) => {
    let winnerIndex = 0
    if (gameClosedReason == GameClosedReason.TIMEOUT) {
        winnerIndex = mod(room.gameState.currentlyMovingPlayer + 1, 2)
    }
    else if (gameClosedReason == GameClosedReason.ALL_CARDS_USED) {
        const player0Length = calculateLongestPathForColor(room.gameState.board, room.gameState.playersStates[0].color)
        const player1Length = calculateLongestPathForColor(room.gameState.board, room.gameState.playersStates[1].color)

        if (player0Length == player1Length) {
            winnerIndex = ITS_A_DRAW_CONSTANT
        } else {
            winnerIndex = player0Length > player1Length ? 0 : 1;
        }
    }

    console.log(`GAME OVER, MOVES: ${serializeGame(room.gameState, gameClosedReason)}`)
    switch (room.blockchainType) {
        case BlockchainType.NO_BLOCKCHAIN:
            await closeGameNoBlockchainSocket(winnerIndex, sio, gameRoomID, gameClosedReason)
            break;
        case BlockchainType.SOLANA:
            await closeGameSolanaSocket(winnerIndex, sio, gameRoomID, room, gameClosedReason)
            break;
        case BlockchainType.HEDERA:
            await closeGameHederaSocket(winnerIndex, sio, gameRoomID, room, gameClosedReason)
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
