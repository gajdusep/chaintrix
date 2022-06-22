import { CARDS } from "../Constants"
import { Coords } from "../CustomTypes"
import { flipParity, mod } from "../methods"
import { Board, getBoardHeight, getBoardWidth } from "./Board"

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
