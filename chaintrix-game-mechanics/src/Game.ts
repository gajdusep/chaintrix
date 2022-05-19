

import {
    Board, getNewBoard, checkValidity, addCardToBoard,
    getObligatoryPlayersCards, getNumberOfObligatoryCards, getNumberOfPlayableCards
} from "./Board";
import { Card, CardNullable, Coords } from "./CustomTypes";
import { COLORS, CARDS } from "./Constants";
import { getRandomCard, mod } from "./methods";

export const DECK_SIZE = 13

export type PlayerState = {
    color: string,
    cards: Array<CardNullable>
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
    for (let i = 1; i <= DECK_SIZE; i++) {
        initialCards.push(i.toString())
    }
    return initialCards;
}

export const getRandomUnusedCardIDAndAlterArray = (cardIds: Array<string>): string => {
    const i = (Math.random() * cardIds.length) | 0
    return cardIds.splice(i, 1)[0];

}

export const updateGameStateAfterUnusedCardSelected = (
    gameState: GameState, playedCardID: string, newCardID: string | null
): GameState => {
    const pl0Index = gameState.playersStates[0].cards.findIndex((value) => value?.cardID == playedCardID)
    const pl1Index = gameState.playersStates[1].cards.findIndex((value) => value?.cardID == playedCardID)

    let newCard = null
    if (newCardID != null) {
        const unusedCardsIndex = gameState.unusedCards.findIndex((value) => value == newCardID)
        newCard = { cardID: newCardID, orientation: 0 }
        gameState.unusedCards.splice(unusedCardsIndex, 1)
    }

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
    return gameState;
}

export const get6Cards = (unusedCards: Array<string>): Array<Card> => {
    const cards: Array<Card> = []
    for (let index = 0; index < 6; index++) {
        const card: Card = {
            cardID: getRandomUnusedCardIDAndAlterArray(unusedCards),
            orientation: 0
        }
        cards.push(card)
    }
    return cards;
}

const getRandom = (arr: Array<string>, n: number): Array<string> => {
    const result = new Array<string>(n);
    let len = arr.length;
    const taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

const getTwoRandomColors = (): { color0: string, color1: string } => {
    const randoms = getRandom(['R', 'B', 'G', 'Y'], 2)
    return {
        color0: randoms[0],
        color1: randoms[1]
    }
}

export const getNewGameState = (): GameState => {
    const initialCards = getInitialCardIds()
    const player0Cards = get6Cards(initialCards)
    const player1Cards = get6Cards(initialCards)
    const twoRandomColors = getTwoRandomColors()
    console.log(`after initialization: ${initialCards.length}, pl0: ${JSON.stringify(player0Cards)}`)
    return {
        playersStates: [
            {
                color: twoRandomColors.color0,
                cards: player0Cards
            },
            {
                color: twoRandomColors.color1,
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

const getSecondPlayer = (
    waitingObligatoryCount: number
): MovePhase => {
    if (waitingObligatoryCount == 0) {
        return MovePhase.SECOND_PHASE_FREE_MOVE
    }
    return MovePhase.FIRST_PHASE_OBLIGATORY;
}

const getNextPlayerAndNextPhase = (
    gameState: GameState,
    currentMovePhase: MovePhase,
    playing: number,
    playingObligatoryCount: number,
    waitingObligatoryCount: number,
): { nextPlayer: number, nextPhase: MovePhase } => {
    const secondPlayerPotentialPhase = getSecondPlayer(waitingObligatoryCount)
    const secondPlayerIndex = mod(playing + 1, 2)

    // has anything to play?
    if (getNumberOfPlayableCards(gameState.playersStates[playing].cards) == 0) {
        return {
            nextPlayer: secondPlayerIndex,
            nextPhase: secondPlayerPotentialPhase
        }
    }

    // has any obligatory
    let nextMovePhase = currentMovePhase;
    let nextPlayer = playing;
    if (playingObligatoryCount == 0) {
        switch (currentMovePhase) {
            case MovePhase.FIRST_PHASE_OBLIGATORY:
                nextMovePhase = MovePhase.SECOND_PHASE_FREE_MOVE
                break;
            case MovePhase.SECOND_PHASE_FREE_MOVE:
            case MovePhase.THIRD_PHASE_OBLIGATORY:
                nextMovePhase = secondPlayerPotentialPhase;
                nextPlayer = secondPlayerIndex;
                break;
            default:
                break;
        }
    } else {
        switch (currentMovePhase) {
            case MovePhase.SECOND_PHASE_FREE_MOVE:
                nextMovePhase = MovePhase.THIRD_PHASE_OBLIGATORY;
                break;
            default:
                // in other cases, the state remains the same
                break;
        }
    }

    return {
        nextPlayer: nextPlayer,
        nextPhase: nextMovePhase
    }
}

// This method is called after the card was added, it returns a new game state
export const getStateAfterMove = (gameState: GameState): GameState => {
    // TODO: what happens according to the rules, if the player cannot play? (very low probability)

    const currentlyMovingPlayer = gameState.currentlyMovingPlayer;
    const currentPlayerObligatoryCards = getObligatoryPlayersCards(gameState.board, gameState.playersStates[currentlyMovingPlayer].cards)
    const currentPlayerObligatoryCardsCount = getNumberOfObligatoryCards(currentPlayerObligatoryCards);
    // console.log(`currently playing (${currentlyMovingPlayer}): ${JSON.stringify(currentPlayerObligatoryCards)}`)

    const waitingPlayer = mod(currentlyMovingPlayer + 1, 2)
    const waitingPlayerObligatoryCards = getObligatoryPlayersCards(gameState.board, gameState.playersStates[waitingPlayer].cards)
    const waitingPlayerObligatoryCardsCount = getNumberOfObligatoryCards(waitingPlayerObligatoryCards);
    // console.log(`waiting playing (${waitingPlayer}): ${JSON.stringify(waitingPlayerObligatoryCards)}`)

    const nextPlayerAndPhase = getNextPlayerAndNextPhase(
        gameState, gameState.currentlyMovingPhase, gameState.currentlyMovingPlayer,
        currentPlayerObligatoryCardsCount, waitingPlayerObligatoryCardsCount
    )
    gameState.currentlyMovingPhase = nextPlayerAndPhase.nextPhase
    gameState.currentlyMovingPlayer = nextPlayerAndPhase.nextPlayer

    return gameState;
}
