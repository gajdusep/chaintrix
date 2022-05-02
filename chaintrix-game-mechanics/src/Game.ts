

import {
    Board, getNewBoard, checkValidity, addCardToBoard,
    getObligatoryPlayersCards, getNumberOfObligatoryCards
} from "./Board";
import { Card, Coords } from "./CustomTypes";
import { COLORS, CARDS } from "./Constants";
import { getRandomCard, mod } from "./methods";

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
    currentlyMovingPlayer: number,
    currentlyMovingPhase: MovePhase,
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
        currentlyMovingPhase: MovePhase.SECOND_PHASE_FREE_MOVE,
        currentlyMovingPlayer: 0,
        moves: [],
        unusedCards: [],
        board: getNewBoard()
    }
}

// This method is called after the card was added, it returns a new game state
export const getStateAfterMove = (gameState: GameState): GameState => {
    // TODO: what happens according to the rules, if the player cannot play? (very low probability)

    const currentlyMovingPlayer = gameState.currentlyMovingPlayer;
    const currentPlayerObligatoryCards = getObligatoryPlayersCards(gameState.board, gameState.playersStates[currentlyMovingPlayer].cards)
    const currentPlayerObligatoryCardsCount = getNumberOfObligatoryCards(currentPlayerObligatoryCards);
    console.log(`currently playing (${currentlyMovingPlayer}): ${JSON.stringify(currentPlayerObligatoryCards)}`)

    const waitingPlayer = mod(currentlyMovingPlayer + 1, 2)
    const waitingPlayerObligatoryCards = getObligatoryPlayersCards(gameState.board, gameState.playersStates[waitingPlayer].cards)
    const waitingPlayerObligatoryCardsCount = getNumberOfObligatoryCards(waitingPlayerObligatoryCards);
    console.log(`waiting playing (${waitingPlayer}): ${JSON.stringify(waitingPlayerObligatoryCards)}`)
    switch (gameState.currentlyMovingPhase) {
        case MovePhase.FIRST_PHASE_OBLIGATORY: {
            // Is there a card the player must play (obligatory)?
            // - yes: stay in the first phase
            // - no: move to the second phase 
            if (currentPlayerObligatoryCardsCount == 0) {
                gameState.currentlyMovingPhase = MovePhase.SECOND_PHASE_FREE_MOVE;
            }
            break;
        }
        case MovePhase.SECOND_PHASE_FREE_MOVE: {
            // Is there any obligatory card the player can play in the third phase?
            // - yes: move to the third phase.
            // - no: change the currently moving player and move to the appropriate phase
            if (currentPlayerObligatoryCardsCount == 0) {
                gameState.currentlyMovingPlayer = mod(gameState.currentlyMovingPlayer + 1, 2)
                if (waitingPlayerObligatoryCardsCount == 0) {
                    gameState.currentlyMovingPhase = MovePhase.SECOND_PHASE_FREE_MOVE;
                }
                else {
                    gameState.currentlyMovingPhase = MovePhase.FIRST_PHASE_OBLIGATORY;
                }
            }
            else {
                gameState.currentlyMovingPhase = MovePhase.THIRD_PHASE_OBLIGATORY;
            }
            break;
        }
        case MovePhase.THIRD_PHASE_OBLIGATORY: {
            // Is there a card the player must play (obligatory)?
            // - yes: stay in the third phase
            // - no: change the player and move to the first phase
            if (currentPlayerObligatoryCardsCount == 0) {
                gameState.currentlyMovingPlayer = mod(gameState.currentlyMovingPlayer + 1, 2)
                if (waitingPlayerObligatoryCardsCount == 0) {
                    gameState.currentlyMovingPhase = MovePhase.SECOND_PHASE_FREE_MOVE;
                }
                else {
                    gameState.currentlyMovingPhase = MovePhase.FIRST_PHASE_OBLIGATORY;
                }
            }
            break;
        }
        default: {
            break;
        }
    }

    return gameState;
}

export const move = (gameState: GameState, playerNumber: number, cardIndex: number, coordsToPlaceTheCard: Coords): boolean => {
    if (playerNumber != gameState.currentlyMovingPlayer) return false;
    const card = gameState.playersStates[playerNumber].cards[cardIndex]
    if (!checkValidity(gameState.board, card, coordsToPlaceTheCard.x, coordsToPlaceTheCard.y)) return false;
    gameState.board = addCardToBoard(gameState.board, card, coordsToPlaceTheCard.x, coordsToPlaceTheCard.y)

    const min = 0
    const max = gameState.unusedCards.length - 1
    const newCardIndex = Math.floor(Math.random() * (max - min + 1)) + min;
    gameState.playersStates[gameState.currentlyMovingPlayer].cards[cardIndex] = {
        cardID: gameState.unusedCards[newCardIndex],
        orientation: 0
    }
    gameState.unusedCards.splice(newCardIndex, 1)
    return true;
}
