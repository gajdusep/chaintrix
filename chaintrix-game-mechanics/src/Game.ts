

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

export const getInitialCardIds = (): Array<string> => {
    const initialCards = []
    for (let i = 1; i <= 56; i++) {
        initialCards.push(i.toString())
    }
    return initialCards;
}

export const getRandomUnusedCardAndAlterArray = (cardIds: Array<string>): Card => {
    const i = (Math.random() * cardIds.length) | 0
    return {
        cardID: cardIds.splice(i, 1)[0],
        orientation: 0
    }
}

export const updateGameStateAfterUnusedCardSelected = (
    gameState: GameState, playedCardID: string, newCardID: string
): GameState => {
    const pl0Index = gameState.playersStates[0].cards.findIndex((value) => value.cardID == playedCardID)
    const pl1Index = gameState.playersStates[1].cards.findIndex((value) => value.cardID == playedCardID)
    const unusedCardsIndex = gameState.unusedCards.findIndex((value) => value == newCardID)
    const newCard: Card = { cardID: newCardID, orientation: 0 }

    if (pl0Index == -1 && pl1Index == -1) {
        // TODO: throw errror
        return gameState;
    }

    if (pl0Index != -1) {
        gameState.playersStates[0].cards[pl0Index] = newCard
    }
    else {
        gameState.playersStates[1].cards[pl1Index] = newCard
    }
    gameState.unusedCards.splice(unusedCardsIndex, 1)
    return gameState;
}

export const get6Cards = (unusedCards: Array<string>): Array<Card> => {
    const cards: Array<Card> = []
    for (let index = 0; index < 6; index++) {
        const card = getRandomUnusedCardAndAlterArray(unusedCards)
        cards.push(card)
    }
    return cards;
}

export const getNewGameState = (): GameState => {
    const initialCards = getInitialCardIds()
    const player0Cards = get6Cards(initialCards)
    const player1Cards = get6Cards(initialCards)
    console.log(`after initialization: ${initialCards.length}, pl0: ${JSON.stringify(player0Cards)}`)
    return {
        playersStates: [
            {
                color: "R",
                cards: player0Cards
            },
            {
                color: "B",
                cards: player1Cards
            }
        ],
        startingPlayer: 0,
        currentlyMovingPhase: MovePhase.SECOND_PHASE_FREE_MOVE,
        currentlyMovingPlayer: 0,
        moves: [],
        unusedCards: initialCards,
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
