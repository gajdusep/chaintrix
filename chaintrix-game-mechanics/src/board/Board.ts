import { Card, CardNullable, Coords } from "../CustomTypes";
import { CARDS, INIT_BOARD_HEIGHT, INIT_BOARD_WIDTH } from "../Constants";
import {
    flipParity, mod, getRotatedCard, create2DArray
} from "../methods";
import { BoardFieldType } from "../CustomTypes";
import { Move, MovePhase } from "../Game";
import { calculateBoardFieldsTypes, calculateSimplifiedFieldsTypes } from "./BoardFieldTypes";
import { addCardToBoard } from "./AddCardToBoard";


export type BoardFieldType2DArray = Array<Array<BoardFieldType>>;
export type BoardCards2DArray = Array<Array<CardNullable>>;

export interface Board {
    parity: number,
    boardCards: BoardCards2DArray,
    boardFieldsTypes: BoardFieldType2DArray
}

export const getNewBoard = (): Board => {
    const board = {
        parity: 0,
        boardCards: create2DArray<CardNullable>(null, INIT_BOARD_HEIGHT, INIT_BOARD_WIDTH),
        boardFieldsTypes: []
    }
    const newBoardFieldTypes = calculateBoardFieldsTypes(board, false)
    newBoardFieldTypes[1][1] = BoardFieldType.FREE
    return addNewBoardFieldTypesToBoard(board, newBoardFieldTypes)
}

export const getBoardFromMoves = (moves: Array<Move>): Board => {
    let board = getNewBoard()
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        board = addCardToBoard(board, move.playedCard, move.x, move.y)
    }
    return board
}

export const addNewBoardFieldTypesToBoard = (board: Board, newBoardFieldTypes: BoardFieldType2DArray): Board => {
    return {
        parity: board.parity,
        boardCards: board.boardCards,
        boardFieldsTypes: newBoardFieldTypes
    }
}

export const getBoardHeight = (board: Board): number => {
    // TODO: out of range checks
    return board.boardCards.length;
}

export const getBoardWidth = (board: Board): number => {
    // TODO: out of range checks
    return board.boardCards[0].length;
}

export const areCoordsOutOfBounds = (board: Board, coords: Coords): boolean => {
    const height = getBoardHeight(board)
    const width = getBoardWidth(board)
    return coords.x < 0 || coords.x >= height || coords.y < 0 || coords.y >= width
}

/**
 * Useful for closed game visualization. 
 * Cuts left/right columns and top/bottom row that were used during the game.
 * @param board 
 * @returns 
 */
export const cutBorders = (board: Board): Board => {
    board.boardCards.splice(0, 1)
    board.boardCards.splice(board.boardCards.length - 1, 1)
    for (let i = 0; i < board.boardCards.length; i++) {
        const row = board.boardCards[i];
        row.splice(0, 1)
        row.splice(row.length - 1, 1)
    }
    board.parity = mod(board.parity + 1, 2)
    const newBoardFieldTypes = calculateSimplifiedFieldsTypes(board)
    const boardResult = addNewBoardFieldTypesToBoard(board, newBoardFieldTypes)
    return boardResult;
}
