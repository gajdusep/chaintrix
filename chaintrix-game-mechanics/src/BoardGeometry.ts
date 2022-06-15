import { Coords, HexPosition } from "./CustomTypes";
import { Board, getBoardHeight, getBoardWidth } from "./Board";

export type Sizes = {
    /** distance from the center to any vertex */
    size: number,
    /** vertical distance between two adjacent hexagons' centers */
    h: number,
    /** horizontal distance between two adjacent hexagons' centers */
    w: number,
    /** maximal distance to take into account in drag and drop feature */
    maxDist: number,
    svgWidth: number,
    svgHeight: number,
    boardWidth: number,
    boardHeight: number,
    cardViewHeight: number,
    cardViewTileHeight: number,
    cardViewTileWidth: number
}

export const calculateSizes = (
    tilesPerWidth: number, tilesPerHeight: number,
    boardWidth: number, boardHeight: number,
    cardViewHeight: number, includeCardView: boolean = true
): Sizes => {
    const cardViewSize = boardWidth / 6
    const maxDist = 20

    // potential height calculations
    let boardHeightToCalculateSize = includeCardView ? boardHeight - cardViewSize : boardHeight;
    boardHeightToCalculateSize -= maxDist
    const sizeMaybeByHeight = 2 * boardHeightToCalculateSize / (3 * (tilesPerHeight - 1) + 4)

    // potential width calculations
    const boardWidthToCalculateSize = boardWidth - maxDist
    const tileWidthMaybe = boardWidthToCalculateSize / (tilesPerWidth + 0.5)
    const sizeMaybeByWidth = tileWidthMaybe / Math.sqrt(3)

    console.log(`by height: ${sizeMaybeByHeight}, by width ${sizeMaybeByWidth}`)
    const size = Math.min(sizeMaybeByHeight, sizeMaybeByWidth)

    const sizes: Sizes = {
        size: size,
        h: 2 * size * 3 / 4,
        w: Math.sqrt(3) * size,
        maxDist: 20,
        svgHeight: size * 2,
        svgWidth: size * 2,
        boardWidth: boardWidth,
        boardHeight: boardHeight,
        cardViewHeight: cardViewSize,
        cardViewTileHeight: cardViewSize,
        cardViewTileWidth: cardViewSize
    }
    return sizes
}

export const getCardViewPositions = (sizes: Sizes): Array<Coords> => {
    const playersPositions = []
    for (let i = 0; i < 6; i++) {
        playersPositions.push({
            x: i * (sizes.boardWidth - sizes.svgWidth / 2) / 6,
            y: sizes.boardHeight - sizes.cardViewHeight
        })
    }
    return playersPositions;
}

export const getHexPositionFromIndeces = (i: number, j: number, parity: number, sizes: Sizes): Coords => {
    if (i % 2 == parity) {
        return {
            x: i * sizes.h,
            y: sizes.w * j
        }
    }

    return {
        x: i * sizes.h,
        y: sizes.w * (j + 0.5)
    }
}

export const getHexPositions = (board: Board, sizes: Sizes): Array<HexPosition> => {
    const newHexPositions: Array<HexPosition> = []
    const height = getBoardHeight(board)
    const width = getBoardWidth(board)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const tilePosition = getHexPositionFromIndeces(i, j, board.parity, sizes)
            newHexPositions.push({ xyPosition: tilePosition, ijPosition: { x: i, y: j } })
        }
    }
    return newHexPositions
}
