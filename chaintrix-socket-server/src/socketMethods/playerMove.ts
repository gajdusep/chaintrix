import { Server, Socket } from "socket.io";
import { GameRoom, MovedType } from "../types";
import {
    addCardToBoard, getStateAfterMove,
    PlayerPlaysPayload, PLAYER_PLAYED, updateGameStateAfterDeckCardSelected,
    getNumberOfPlayableCards, getRandomCardIdFromDeck, Move,
    GameClosedReason, BoardFieldType, isFinalPhase, isMoveValidWithMovePhase,
    SOCKET_ERROR, WRONG_PLAYER_ERROR_MSG, WRONG_MOVE_ERROR_MSG, mod
} from 'chaintrix-game-mechanics';
// } from '../../../chaintrix-game-mechanics';
import { SERVER_INITIAL_TIME } from "../constants";
import { getGameRoomID, getNewTimer, RoomObjects } from "../gameRoom";
import { closeGameCallback } from "./closeGame";

export const playerPlays = async (
    sio: Server, socket: Socket, roomObjects: RoomObjects,
    payload: PlayerPlaysPayload
) => {
    const gameRoomID = getGameRoomID(socket);
    const room = roomObjects[gameRoomID]
    console.log(`${room.blockchainType}: payload: ${JSON.stringify(payload)}`)

    if (isPlayerCheating(socket, room, payload)) {
        return;
    }

    const playerMoveResult = playerMove(room, payload)
    // add this move to moves
    const move: Move = {
        newCardID: playerMoveResult.newCardId,
        playedCard: payload.card,
        x: payload.x,
        y: payload.y
    }
    room.gameState.moves.push(move)

    sio.to(gameRoomID).emit(PLAYER_PLAYED, move)

    // game is not over yet
    if (playerMoveResult.newCardId || playerMoveResult.movedType == MovedType.MOVED_AND_DECK_EMPTY) {
        room.remainingTime = SERVER_INITIAL_TIME
        clearInterval(room.timer)
        room.timer = getNewTimer(room, () => closeGameCallback(room, sio, gameRoomID, GameClosedReason.TIMEOUT))
        return;
    }

    if (playerMoveResult.movedType == MovedType.MOVED_AND_PLAYERS_NO_CARDS) {
        clearInterval(room.timer)
        closeGameCallback(room, sio, gameRoomID, GameClosedReason.ALL_CARDS_USED)
    }
}

const isPlayerCheating = (socket: Socket, room: GameRoom, moveInfo: PlayerPlaysPayload): boolean => {
    const currentlyMoving = room.gameState.currentlyMovingPlayer

    // someone is trying to play for the currently playing player
    if (room.players[currentlyMoving].socketID != socket.id) {
        socket.emit(SOCKET_ERROR, WRONG_PLAYER_ERROR_MSG);
        return true;
    }

    // if player tries to play a card that 
    const cardIndex = room.gameState.playersStates[currentlyMoving].cards.findIndex((value) => value?.cardID == moveInfo.card.cardID)
    if (cardIndex == -1) {
        socket.emit(SOCKET_ERROR, WRONG_PLAYER_ERROR_MSG);
        return true;
    }

    // wrong position of the card
    const gameState = room.gameState;
    if (!isMoveValidWithMovePhase(
        gameState.board, moveInfo.card, moveInfo.x, moveInfo.y,
        gameState.currentlyMovingPhase, gameState.playersStates[currentlyMoving].cards,
        isFinalPhase(gameState)
    )) {
        socket.emit(SOCKET_ERROR, WRONG_MOVE_ERROR_MSG);
        return true;
    }

    return false;
}

export const playerMove = (room: GameRoom, moveInfo: PlayerPlaysPayload): {
    newCardId: string | null,
    movedType: MovedType
} => {
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
