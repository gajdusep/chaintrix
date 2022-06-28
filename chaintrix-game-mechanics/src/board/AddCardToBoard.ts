import { Card, CardNullable, Coords } from "../CustomTypes";
import { CARDS } from "../Constants";
import { mod, getRotatedCard } from "../methods";
import { BoardFieldType } from "../CustomTypes";
import { MovePhase } from "../Game";
import { addNewBoardFieldTypesToBoard, areCoordsOutOfBounds, Board, getBoardHeight, getBoardWidth } from "./Board";
import { getColorsOfNeighbors, getTileNeighborsCoords } from "./Neighbors";
import { calculateBoardFieldsTypes } from "./BoardFieldTypes";

export const isCardInBoard = (board: Board, cardID: string): boolean => {
    for (let i = 0; i < getBoardHeight(board); i++) {
        for (let j = 0; j < getBoardWidth(board); j++) {
            if (board.boardCards[i][j] && board.boardCards[i][j].cardID == cardID) return true;
        }
    }
    return false;
}

export const getNumberOfPlayableCards = (cards: Array<CardNullable>): number => {
    return cards.filter(item => item != null).length
}

export const isMoveValid = (
    board: Board, card: Card, posX: number, posY: number, finalPhase: boolean
) => {
    if (areCoordsOutOfBounds(board, { x: posX, y: posY })) {
        return false;
    }

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

/**
 * Check if the card can be played
 * @param board board object
 * @param card card with orientation
 * @param posX x
 * @param posY y
 * @param movePhase move phase
 * @param cards players' cards
 * @param finalPhase is it final phase (all cards from deck used)
 * @returns true if the card can be played
 */
export const isMoveValidWithMovePhase = (
    board: Board, card: Card, posX: number, posY: number,
    movePhase: MovePhase, cards: Array<CardNullable>, finalPhase: boolean
) => {
    const validity = isMoveValid(board, card, posX, posY, finalPhase)
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
    let addTop: boolean = false;
    let addLeft: boolean = false;
    let addBottom: boolean = false;
    let addRight: boolean = false;

    const height = getBoardHeight(board)
    const width = getBoardWidth(board)

    if (posX == 0) addTop = true;
    if (posX == height - 1) addBottom = true;
    if (posY == 0) addLeft = true;
    if (posY == width - 1) addRight = true;

    board.boardCards[posX][posY] = card
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

/**
 * 
 * @param board
 * @param playerCards array of player's cards
 * @param finalPhase 
 * @returns for every player's card, array of positions to which that card is obligatory
 */
export const getObligatoryPlayersCards = (
    board: Board, playerCards: Array<CardNullable>, finalPhase: boolean
): Array<Array<Coords>> => {
    const result: Array<Array<Coords>> = Array.from(Array(6), () => new Array())
    const obligatoryPositions = getAllObligatoryPositionsCoords(board);
    for (let i = 0; i < playerCards.length; i++) {
        const playerCard = playerCards[i];
        if (playerCard == null) continue;
        for (let j = 0; j < obligatoryPositions.length; j++) {
            const obligatoryPositionCoord = obligatoryPositions[j];
            for (let rotIndex = 0; rotIndex < 6; rotIndex++) {
                const rotatedCard = getRotatedCard(playerCard, rotIndex);
                if (isMoveValid(board, rotatedCard, obligatoryPositionCoord.x, obligatoryPositionCoord.y, finalPhase)) {
                    result[i].push(obligatoryPositionCoord)
                    break;
                }
            }
        }
    }
    return result;
}

/**
 * 
 * @param obligatoryCards result of getObligatoryPlayersCards
 * @returns number of obligatory cards
 */
export const getNumberOfObligatoryCards = (obligatoryCards: Array<Array<Coords>>): number => {
    let obligatoryCardsNo = 0
    for (let i = 0; i < obligatoryCards.length; i++) {
        if (obligatoryCards[i].length > 0) obligatoryCardsNo += 1;
    }
    return obligatoryCardsNo;
}
