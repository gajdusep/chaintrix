

import {
    Board, getNewBoard,
    getObligatoryPlayersCards, getNumberOfObligatoryCards, getNumberOfPlayableCards, calculateBoardFieldsTypes, addNewBoardFieldTypesToBoard
} from "./Board";
import { Card, CardNullable, Coords } from "./CustomTypes";
import { COLORS, CARDS, DECK_SIZE } from "./Constants";
import { getRandomCard, mod } from "./methods";

export type PlayerState = {
    color: string,
    cards: Array<CardNullable>
}

export enum MovePhase {
    FIRST_PHASE_OBLIGATORY,
    SECOND_PHASE_FREE_MOVE,
    THIRD_PHASE_OBLIGATORY
}

export interface Move {
    playedCard: Card,
    x: number,
    y: number,
    newCardID: string
}

export const serializeMove = (move: Move): object => {
    return {
        p: {
            id: move.playedCard.cardID,
            or: move.playedCard.orientation
        },
        x: move.x,
        y: move.y,
        n: move.newCardID
    }
}

export const serializeMoves = (moves: Array<Move>): string => {
    return JSON.stringify(moves.map(item => serializeMove(item)));
}

export interface GameState {
    playersStates: Array<PlayerState>
    moves: Array<Move>
    startingPlayer: number
    currentlyMovingPlayer: number,
    currentlyMovingPhase: MovePhase,
    deck: Array<string>
    board: Board
}

export const getInitialCardIds = (): Array<string> => {
    const initialCards = []
    for (let i = 1; i <= DECK_SIZE; i++) {
        initialCards.push(i.toString())
    }
    return initialCards;
}

export const getRandomCardIdFromDeck = (deck: Array<string>): string => {
    const i = (Math.random() * deck.length) | 0
    return deck[i]
}

export const getAndRemoveRandomCardIdFromDeck = (cardIds: Array<string>): string => {
    const i = (Math.random() * cardIds.length) | 0
    return cardIds.splice(i, 1)[0];
}

export const removeCardFromDeck = (deck: Array<string>, cardId: string) => {
    const cardIndex = deck.findIndex((value) => value == cardId)
    deck.splice(cardIndex, 1)[0];
}

export const updateGameStateAfterDeckCardSelected = (
    gameState: GameState, playedCardID: string, newCardID: string | null
): GameState => {
    const pl0Index = gameState.playersStates[0].cards.findIndex((value) => value?.cardID == playedCardID)
    const pl1Index = gameState.playersStates[1].cards.findIndex((value) => value?.cardID == playedCardID)

    console.log(`in updating game state after deck select: ${newCardID}, ${JSON.stringify(gameState.deck)}`)
    let newCard = null
    if (newCardID != null) {
        const deckCardIndex = gameState.deck.findIndex((value) => value == newCardID)
        newCard = { cardID: newCardID, orientation: 0 }
        gameState.deck.splice(deckCardIndex, 1)
    }

    const finalPhase = isFinalPhase(gameState)
    const newBoardFieldTypes = calculateBoardFieldsTypes(gameState.board, finalPhase)
    const boardResult = addNewBoardFieldTypesToBoard(gameState.board, newBoardFieldTypes)
    gameState.board = boardResult

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

export const get6CardsFromDeck = (deck: Array<string>): Array<Card> => {
    const cards: Array<Card> = []
    for (let index = 0; index < 6; index++) {
        const card: Card = {
            cardID: getAndRemoveRandomCardIdFromDeck(deck),
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
    const player0Cards = get6CardsFromDeck(initialCards)
    const player1Cards = get6CardsFromDeck(initialCards)
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
        deck: initialCards,
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

    const secondPlayerCanPlay = getNumberOfPlayableCards(gameState.playersStates[secondPlayerIndex].cards) != 0

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
                if (secondPlayerCanPlay) {
                    nextMovePhase = secondPlayerPotentialPhase;
                    nextPlayer = secondPlayerIndex;
                } else {
                    nextMovePhase = MovePhase.SECOND_PHASE_FREE_MOVE
                }
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

export const isFinalPhase = (gameState: GameState): boolean => {
    return gameState.deck.length == 0;
}

// This method is called after the card was added, it returns a new game state
export const getStateAfterMove = (gameState: GameState): GameState => {
    // TODO: what happens according to the rules, if the player cannot play? (very low probability)

    const finalPhase = isFinalPhase(gameState);

    const currentlyMovingPlayer = gameState.currentlyMovingPlayer;
    const currentPlayerObligatoryCards = getObligatoryPlayersCards(gameState.board, gameState.playersStates[currentlyMovingPlayer].cards, finalPhase)
    const currentPlayerObligatoryCardsCount = getNumberOfObligatoryCards(currentPlayerObligatoryCards);
    // console.log(`currently playing (${currentlyMovingPlayer}): ${JSON.stringify(currentPlayerObligatoryCards)}`)

    const waitingPlayer = mod(currentlyMovingPlayer + 1, 2)
    const waitingPlayerObligatoryCards = getObligatoryPlayersCards(gameState.board, gameState.playersStates[waitingPlayer].cards, finalPhase)
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
