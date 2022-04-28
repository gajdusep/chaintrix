

import { Board } from "./Board";
import { Card, Coords } from "./CustomTypes";
import { COLORS, CARDS } from "./Constants";

export type PlayerState = {
    color: string,
    cards: Array<Card>
}

export enum MovePhase {
    FIRST_PHASE_OBLIGATORY,
    SECOND_PHASE_FREE_MOVE,
    THIRD_PHASE_OBLIGATORY
}

const getRandomCard = (): Card => {
    const someCardID = (Math.floor(Math.random() * (6 - 1 + 1)) + 1).toString();
    // const someCardID = "4"

    const someCard: Card = {
        cardID: someCardID,
        orientation: 0,
    }
    console.log(`wait what: ${JSON.stringify(someCard)}`)
    return someCard;
}

// TODO: array of players?
export class GameState {
    playersStates: Array<PlayerState>
    moves: Array<string>
    startingPlayer: number
    currentlyMoving: number
    unusedCards: Array<string>
    board: Board

    constructor() {
        this.playersStates = [
            {
                color: "R",
                cards: [getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()]
            },
            {
                color: "B",
                cards: [getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()]
            }
        ]
        this.startingPlayer = 0
        this.currentlyMoving = this.startingPlayer
        this.moves = []
        this.unusedCards = []
        this.board = new Board()
    }

    move = (playerNumber: number, cardIndex: number, coordsToPlaceTheCard: Coords): boolean => {
        if (playerNumber != this.currentlyMoving) return false;
        const card = this.playersStates[playerNumber].cards[cardIndex]
        if (!this.board.checkValidity(card, coordsToPlaceTheCard.x, coordsToPlaceTheCard.y)) return false;
        this.board.addCardToBoard(card, coordsToPlaceTheCard.x, coordsToPlaceTheCard.y)

        const min = 0
        const max = this.unusedCards.length - 1
        const newCardIndex = Math.floor(Math.random() * (max - min + 1)) + min;
        this.playersStates[this.currentlyMoving].cards[cardIndex] = {
            cardID: this.unusedCards[newCardIndex],
            orientation: 0
        }
        this.unusedCards.splice(newCardIndex, 1)

    }

}