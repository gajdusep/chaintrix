import { Coords, HexPosition } from "./CustomTypes";
import { Board, getBoardHeight, getBoardWidth } from "./Board";

export type Sizes = {
    size: number,
    h: number,
    w: number,
    maxDist: number,
    svgWidth: number,
    svgHeight: number,
    boardWidth: number,
    boardHeight: number
}

export const calculateSizes = (tilesWidth: number, tilesHeight: number, boardWidth: number, boardHeight: number): Sizes => {
    const potentialHeightSize = boardHeight / ((1.5 + tilesHeight) * 3 / 2)
    const potentialWidthSize = boardWidth / (1.5 + tilesWidth * Math.sqrt(3))
    console.log(`${potentialWidthSize}, ${potentialHeightSize}`)
    const size = Math.min(potentialHeightSize, potentialWidthSize)
    return {
        size: size,
        h: 2 * size * 3 / 4,
        w: Math.sqrt(3) * size,
        maxDist: 20,
        svgHeight: size * 2,
        svgWidth: size * 2,
        boardWidth: boardWidth,
        boardHeight: boardHeight
    }
}

export const calculatePlayersTilesPositions = (sizes: Sizes): Array<Coords> => {
    const playersPositions = []
    for (let i = 0; i < 6; i++) {
        // playersPositions.push({ x: i * sizes.boardWidth / 6, y: sizes.boardHeight - sizes.size * 2 })
        playersPositions.push({ x: i * (sizes.boardWidth - sizes.w) / 6, y: sizes.boardHeight - sizes.svgHeight })
    }
    return playersPositions;
}

export const getTilePosition = (i: number, j: number, parity: number, sizes: Sizes): Coords => {
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
            const tilePosition = getTilePosition(i, j, board.parity, sizes)
            newHexPositions.push({ xyPosition: tilePosition, ijPosition: { x: i, y: j } })
        }
    }
    return newHexPositions
}
