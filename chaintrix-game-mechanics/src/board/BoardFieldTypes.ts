
import { mod, create2DArray } from "../methods";
import { BoardFieldType } from "../CustomTypes";
import { Board, BoardFieldType2DArray, getBoardHeight, getBoardWidth } from "./Board";
import { getNumberOfTileNeighbors, getTileNeighborsCoords } from "./Neighbors";

/**
 * Distinguishes only two Field types: CARD and UNREACHABLE.
 * Useful for visualization of a closed game
 * @param board 
 * @returns 
 */
export const calculateSimplifiedFieldsTypes = (board: Board): BoardFieldType2DArray => {
    const height = getBoardHeight(board)
    const width = getBoardWidth(board)

    const boardFieldsTypes = create2DArray<BoardFieldType>(BoardFieldType.UNREACHABLE, height, width)
    // find all cards
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (board.boardCards[i][j] == null) continue;
            boardFieldsTypes[i][j] = BoardFieldType.CARD
        }
    }
    return boardFieldsTypes;
}

/**
 * 
 * @param board 
 * @param finalPhase 
 * @returns 2D array of Field types necessary during the game
 */
export const calculateBoardFieldsTypes = (board: Board, finalPhase: boolean): BoardFieldType2DArray => {
    const height = getBoardHeight(board)
    const width = getBoardWidth(board)

    const boardFieldsTypes = create2DArray<BoardFieldType>(BoardFieldType.UNREACHABLE, height, width)

    // find all cards
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (board.boardCards[i][j] == null) continue;
            boardFieldsTypes[i][j] = BoardFieldType.CARD
        }
    }

    // find all unreachable and potentialy free
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (board.boardCards[i][j] != null) continue;

            const tileNeighbors = getTileNeighborsCoords(board, i, j);
            const numberOfCardNeighbors = getNumberOfTileNeighbors(board, tileNeighbors)

            if (numberOfCardNeighbors == 0) {
                boardFieldsTypes[i][j] = BoardFieldType.UNREACHABLE;
            }
            else if (tileNeighbors.length > 1) {
                boardFieldsTypes[i][j] = BoardFieldType.FREE;
            }
        }
    }


    const guardedCondition = (iGuard: number, jGuard: number): boolean => {
        return iGuard >= 0 && iGuard < height &&
            jGuard >= 0 && jGuard < width &&
            boardFieldsTypes[iGuard][jGuard] != BoardFieldType.CARD &&
            boardFieldsTypes[iGuard][jGuard] != BoardFieldType.UNREACHABLE
    }
    // find all obligatory and guarded
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (board.boardCards[i][j] != null) continue;

            const tileNeighbors = getTileNeighborsCoords(board, i, j);
            const numberOfCardNeighbors = getNumberOfTileNeighbors(board, tileNeighbors)

            if (numberOfCardNeighbors < 3) continue;

            boardFieldsTypes[i][j] = BoardFieldType.OBLIGATORY;

            if (finalPhase) continue;

            // go all directions and find the guarded fields

            // direction 1
            let iHelp = i
            let jHelp = j
            while (guardedCondition(iHelp, jHelp)) {
                boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                iHelp--;
                jHelp += mod(iHelp + 1 + board.parity, 2)
            }

            // direction 2
            iHelp = i
            jHelp = j
            while (guardedCondition(iHelp, jHelp)) {
                boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                jHelp += 1;
            }

            // direction 3
            iHelp = i
            jHelp = j
            while (guardedCondition(iHelp, jHelp)) {
                boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                iHelp++;
                jHelp += mod(iHelp + 1 + board.parity, 2)
            }

            // direction 4
            iHelp = i
            jHelp = j
            while (guardedCondition(iHelp, jHelp)) {
                boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                iHelp++;
                jHelp -= mod(iHelp + board.parity, 2)
            }

            // direction 5
            iHelp = i
            jHelp = j
            while (guardedCondition(iHelp, jHelp)) {
                boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                jHelp -= 1;
            }

            // direction 6
            iHelp = i
            jHelp = j
            while (guardedCondition(iHelp, jHelp)) {
                boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                iHelp--;
                jHelp -= mod(iHelp + board.parity, 2)
            }

            boardFieldsTypes[i][j] = BoardFieldType.OBLIGATORY;
        }
    }

    return boardFieldsTypes;
}
