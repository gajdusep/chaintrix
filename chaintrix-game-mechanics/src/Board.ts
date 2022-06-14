import { Card, CardNullable, Coords } from "./CustomTypes";
import { CARDS, INIT_BOARD_HEIGHT, INIT_BOARD_WIDTH } from "./Constants";
import {
    flipParity, mod, getRotatedCard, create2DArray
} from "./methods";
import { BoardFieldType } from "./CustomTypes";
import { Move, MovePhase } from "./Game";

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

export const isCardInBoard = (board: Board, cardID: string): boolean => {
    for (let i = 0; i < getBoardHeight(board); i++) {
        for (let j = 0; j < getBoardWidth(board); j++) {
            if (board.boardCards[i][j] && board.boardCards[i][j].cardID == cardID) return true;
        }
    }
    return false;
}

const neighborsCoords = {
    0: (i: number, j: number, par: number) => { return { x: i - 1, y: j + par } },
    1: (i: number, j: number, par: number) => { return { x: i, y: j + 1 } },
    2: (i: number, j: number, par: number) => { return { x: i + 1, y: j + par } },
    3: (i: number, j: number, par: number) => { return { x: i + 1, y: j - flipParity(par) } },
    4: (i: number, j: number, par: number) => { return { x: i, y: j - 1 } },
    5: (i: number, j: number, par: number) => { return { x: i - 1, y: j - flipParity(par) } },
}

export const getNeighborCoords = (index: number, i: number, j: number, parity: number): Coords => {
    return neighborsCoords[index](i, j, parity)
}

export const getTileNeighborsCoords = (board: Board, i: number, j: number): Array<Coords | null> => {
    const neighbors: Array<Coords | null> = []
    const par = mod(i + board.parity, 2)
    for (let index = 0; index < 6; index++) {
        neighbors.push(getNeighborCoords(index, i, j, par))
    }

    for (let nIndex = 0; nIndex < neighbors.length; nIndex++) {
        const neighbor = neighbors[nIndex];
        if (!neighbor) continue;
        if (neighbor.x < 0 || neighbor.x >= getBoardHeight(board) || neighbor.y < 0 || neighbor.y >= getBoardWidth(board)) {
            neighbors[nIndex] = null
        }
    }

    return neighbors
}

export const getNumberOfTileNeighbors = (board: Board, neighbors: Array<Coords | null>): number => {
    let numberOfCardNeighbors = 0
    for (let coordIndex = 0; coordIndex < neighbors.length; coordIndex++) {
        const coord = neighbors[coordIndex];
        if (coord == null) continue
        const cardOrNull = board.boardCards[coord.x][coord.y]
        if (cardOrNull == null) continue
        numberOfCardNeighbors++;
    }
    return numberOfCardNeighbors
}

export const getColorsOfNeighbors = (board: Board, neighbors: Array<Coords | null>): { [color: string]: number } => {
    const colors: { [color: string]: number } = {}
    for (let nIndex = 0; nIndex < neighbors.length; nIndex++) {
        const neighborCoords = neighbors[nIndex];
        if (!neighborCoords) continue;
        const neighbor = board.boardCards[neighborCoords.x][neighborCoords.y]
        if (!neighbor) continue;

        const currentOffset = mod((2 + nIndex), 6)
        const neighborCardOffset = mod((currentOffset + 3 - neighbor.orientation), 6)

        const neighborColor = CARDS[neighbor.cardID][neighborCardOffset]
        if (neighborColor in colors) {
            colors[neighborColor] += 1;
        }
        else {
            colors[neighborColor] = 1;
        }
    }
    return colors;
}

export const getNumberOfPlayableCards = (cards: Array<CardNullable>): number => {
    return cards.filter(item => item != null).length
}

// TODO: check validity also of the move PHASE
export const checkValidity = (
    board: Board, card: Card, posX: number, posY: number, finalPhase: boolean
) => {
    const tileNeighbors = getTileNeighborsCoords(board, posX, posY)

    // for all neighbors check if the colors fit
    for (let nIndex = 0; nIndex < tileNeighbors.length; nIndex++) {
        const neighborCoords = tileNeighbors[nIndex];
        if (!neighborCoords) continue;
        const neighbor = board.boardCards[neighborCoords.x][neighborCoords.y]
        if (!neighbor) {
            continue
        };

        const currentOffset = mod((2 + nIndex), 6)
        const testedCardOffset = mod((currentOffset - card.orientation), 6)
        const neighborCardOffset = mod((currentOffset + 3 - neighbor.orientation), 6)
        // console.log(`${testedCardOffset} -- ${neighborCardOffset}, ${card.pattern[testedCardOffset]} -- ${neighbor.pattern[neighborCardOffset]}`)
        if (CARDS[card.cardID][testedCardOffset] != CARDS[neighbor.cardID][neighborCardOffset]) {
            return false;
        }
    }

    if (finalPhase) return true;

    // for all neighbors check if there are not 3 paths of the same color
    for (let nIndex = 0; nIndex < tileNeighbors.length; nIndex++) {
        const neighborCoords = tileNeighbors[nIndex];
        if (!neighborCoords) continue;
        const neighbor = board.boardCards[neighborCoords.x][neighborCoords.y]
        if (neighbor) continue;

        const currentOffset = mod((2 + nIndex), 6)
        const testedCardOffset = mod((currentOffset - card.orientation), 6)
        const collorToCheck = CARDS[card.cardID][testedCardOffset]

        const neighborsNeighbors = getTileNeighborsCoords(board, neighborCoords.x, neighborCoords.y)
        const colorsOfNeighbors = getColorsOfNeighbors(board, neighborsNeighbors)
        if (colorsOfNeighbors[collorToCheck] > 1) return false;
    }

    return true;
}

export const checkValidityWithMovePhase = (
    board: Board, card: Card, posX: number, posY: number,
    movePhase: MovePhase, cards: Array<CardNullable>, finalPhase: boolean
) => {
    const validity = checkValidity(board, card, posX, posY, finalPhase)
    if (!validity) return validity;
    if (movePhase == MovePhase.SECOND_PHASE_FREE_MOVE) return validity;

    // in the first and third phase, check that player played one of his obligatory cards
    const obligatoryCards = getObligatoryPlayersCards(board, cards, finalPhase)
    const obligatoryCardsCount = getNumberOfObligatoryCards(obligatoryCards);
    if (obligatoryCardsCount == 0) return true;

    for (let cardIndex = 0; cardIndex < obligatoryCards.length; cardIndex++) {
        const coordsList = obligatoryCards[cardIndex];
        for (let coordsIndex = 0; coordsIndex < coordsList.length; coordsIndex++) {
            const coords = coordsList[coordsIndex]
            if (coords.x == posX && coords.y == posY) {
                return true;
            }
        }
    }
    return false;
}

export const addCardToBoard = (
    board: Board, card: CardNullable, posX: number, posY: number
): Board => {
    // TODO: check if out of bounds
    // const newBoard: Board = { ...board };
    // TODO: CHECK IF THE PLAYER CAN REALLY PLAY THAT CARD (is in his cards)

    let addTop: boolean = false;
    let addLeft: boolean = false;
    let addBottom: boolean = false;
    let addRight: boolean = false;

    // const height = getBoardHeight(newBoard)
    // const width = getBoardWidth(newBoard)
    const height = getBoardHeight(board)
    const width = getBoardWidth(board)

    if (posX == 0) addTop = true;
    if (posX == height - 1) addBottom = true;
    if (posY == 0) addLeft = true;
    if (posY == width - 1) addRight = true;

    // console.log(`pose: ${JSON.stringify(card)}`)
    // console.log(`pose2: ${JSON.stringify(board.boardCards[posX][posY])}`)
    // console.log(`pose3: ${JSON.stringify(board.boardCards)}`)
    board.boardCards[posX][posY] = card


    // return;
    if (addTop) {
        board.parity = mod(board.parity + 1, 2);
        const newArray = new Array(width).fill(null);
        board.boardCards.unshift(newArray)
    }

    if (addBottom) {
        const newArray = new Array(width).fill(null);
        board.boardCards.push(newArray)
    }

    if (addLeft) {
        for (let i = 0; i < board.boardCards.length; i++) {
            const arrayToUnshift = board.boardCards[i]
            arrayToUnshift.unshift(null)
        }
    }

    if (addRight) {
        for (let i = 0; i < board.boardCards.length; i++) {
            const arrayToUnshift = board.boardCards[i]
            arrayToUnshift.push(null)
        }
    }

    // TODO: this must be called after the deck is updated
    const newBoardFieldTypes = calculateBoardFieldsTypes(board, false)
    const boardResult = addNewBoardFieldTypesToBoard(board, newBoardFieldTypes)
    return boardResult;
    // return boardResult
}

export const getAllObligatoryPositionsCoords = (board: Board): Array<Coords> => {
    const coords = []
    const height = getBoardHeight(board)
    const width = getBoardWidth(board)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            if (board.boardFieldsTypes[i][j] == BoardFieldType.OBLIGATORY) {
                coords.push({ x: i, y: j })
            }
        }
    }
    return coords;
}

export const getObligatoryPlayersCards = (board: Board, playerCards: Array<CardNullable>, finalPhase: boolean): Array<Array<Coords>> => {
    const result: Array<Array<Coords>> = Array.from(Array(6), () => new Array())
    const obligatoryPositions = getAllObligatoryPositionsCoords(board);
    for (let i = 0; i < playerCards.length; i++) {
        const playerCard = playerCards[i];
        if (playerCard == null) continue;
        for (let j = 0; j < obligatoryPositions.length; j++) {
            const obligatoryPositionCoord = obligatoryPositions[j];
            for (let rotIndex = 0; rotIndex < 6; rotIndex++) {
                const rotatedCard = getRotatedCard(playerCard, rotIndex);
                if (checkValidity(board, rotatedCard, obligatoryPositionCoord.x, obligatoryPositionCoord.y, finalPhase)) {
                    result[i].push(obligatoryPositionCoord)
                    break;
                }
            }
        }
    }
    // console.log(JSON.stringify(result))
    return result;
}

export const getNumberOfObligatoryCards = (obligatoryCards: Array<Array<Coords>>): number => {
    let obligatoryCardsNo = 0
    for (let i = 0; i < obligatoryCards.length; i++) {
        if (obligatoryCards[i].length > 0) obligatoryCardsNo += 1;
    }
    return obligatoryCardsNo;
}
