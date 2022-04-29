

import { Board, getNewBoard, checkValidity, addCardToBoard } from "./Board";
import { Card, Coords } from "./CustomTypes";
import { COLORS, CARDS } from "./Constants";
import { getRandomCard } from "./methods";

export type PlayerState = {
    color: string,
    cards: Array<Card>
}

export enum MovePhase {
    FIRST_PHASE_OBLIGATORY,
    SECOND_PHASE_FREE_MOVE,
    THIRD_PHASE_OBLIGATORY
}

export interface GameState {
    playersStates: Array<PlayerState>
    moves: Array<string>
    startingPlayer: number
    currentlyMoving: number
    unusedCards: Array<string>
    board: Board
}

export const getNewGameState = (): GameState => {
    return {
        playersStates: [
            {
                color: "R",
                cards: [getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()]
            },
            {
                color: "B",
                cards: [getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()]
            }
        ],
        startingPlayer: 0,
        currentlyMoving: 0,
        moves: [],
        unusedCards: [],
        board: getNewBoard()
    }
}

export const move = (gameState: GameState, playerNumber: number, cardIndex: number, coordsToPlaceTheCard: Coords): boolean => {
    if (playerNumber != gameState.currentlyMoving) return false;
    const card = gameState.playersStates[playerNumber].cards[cardIndex]
    if (!checkValidity(gameState.board, card, coordsToPlaceTheCard.x, coordsToPlaceTheCard.y)) return false;
    gameState.board = addCardToBoard(gameState.board, card, coordsToPlaceTheCard.x, coordsToPlaceTheCard.y)

    const min = 0
    const max = gameState.unusedCards.length - 1
    const newCardIndex = Math.floor(Math.random() * (max - min + 1)) + min;
    gameState.playersStates[gameState.currentlyMoving].cards[cardIndex] = {
        cardID: gameState.unusedCards[newCardIndex],
        orientation: 0
    }
    gameState.unusedCards.splice(newCardIndex, 1)
    return true;
}
