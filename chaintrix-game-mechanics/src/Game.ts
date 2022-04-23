

import { Board } from "./Board";
import { Card } from "./CustomTypes";
import { COLORS, CARDS } from "./Constants";

export type PlayerState = {
    color: string,
    cards: Array<Card>
}

// TODO: array of players?
export class GameState {
    playersStates: Array<PlayerState>
    startingPlayer: number
    moves: Array<string>
    currentlyMoving: number
    unusedCards: Array<string>
    board: Board

    constructor() {
        this.playersStates = [
            {
                color: "R",
                cards: []
            },
            {
                color: "B",
                cards: []
            }
        ]
        this.startingPlayer = 0
        this.currentlyMoving = this.startingPlayer
        this.moves = []
        this.unusedCards = []
        this.board = new Board()
    }

    move = (cardIndex: number) => {



        const min = 0
        const max = this.unusedCards.length - 1
        const newCardIndex = Math.floor(Math.random() * (max - min + 1)) + min;
        this.playersStates[this.currentlyMoving].cards[cardIndex] = {
            cardID: this.unusedCards[newCardIndex],
            pattern: CARDS[this.unusedCards[newCardIndex]],
            orientation: 0
        }
        this.unusedCards.splice(newCardIndex, 1)
    }

}