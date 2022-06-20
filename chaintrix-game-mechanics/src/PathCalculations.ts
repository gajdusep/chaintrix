import { CARDS } from "./Constants";
import { Board, getBoardHeight, getBoardWidth, getNeighborCoords } from "./Board";
import { create2DArray, create2DArrayOfObjects, mod } from "./methods";
import { Coords } from "./CustomTypes";

enum VisitState {
    NOTVISITED,
    NOTCARD,
    DONE
}

interface PathState {
    visitState: VisitState;
    coords: Coords,
    left: PathState | null;
    right: PathState | null;
}

const getDefaultPathState = (): PathState => {
    return {
        visitState: VisitState.NOTVISITED,
        coords: { x: -1, y: -1 },
        left: null,
        right: null
    }
}

export const getIndicesOfColorInCardPattern = (cardPattern: string, color: string, orientation: number): Array<number> => {
    var searchStrLen = color.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    while ((index = cardPattern.indexOf(color, startIndex)) > -1) {
        indices.push(mod(index + orientation + 4, 6));
        startIndex = index + searchStrLen;
    }
    return indices;
}

const cameFromIndexCalc = (index: number): number => {
    return mod(index + 3, 6)
}

const logFromLeftEnd = (leftEnd: PathState): string => {
    let currentLeftEnd = leftEnd;
    let s = ''
    while (currentLeftEnd != null) {
        s = `${s}, (${currentLeftEnd.coords.x},${currentLeftEnd.coords.y})`
        currentLeftEnd = currentLeftEnd.right
    }
    return s
}

const getLengthFromLeftEnd = (leftEnd: PathState): number => {
    let currentLeftEnd = leftEnd;
    let l = 0
    while (currentLeftEnd != null) {
        l++;
        currentLeftEnd = currentLeftEnd.right
    }
    return l
}

const getLoopLengthFromLeftEnd = (leftEnd: PathState): number => {
    console.log(`calculating loop length`)
    const beginning = leftEnd
    let currentLeftEnd = leftEnd.right;
    let l = 1
    while (currentLeftEnd.coords != beginning.coords) {
        l++;
        currentLeftEnd = currentLeftEnd.right
    }
    return l
}

export const calculateLongestPathForColor = (board: Board, color: string): number => {
    // get all coords of cards    
    // console.log(`Calculating: ${color}`)

    const height = getBoardHeight(board)
    const width = getBoardWidth(board)
    const pathStates: Array<Array<PathState>> = create2DArrayOfObjects<PathState>(getDefaultPathState(), height, width)

    const leftEnds: Array<Coords> = []
    const loops: Array<Coords> = []

    const continuePath = (
        previousCoords: Coords, currentCoords: Coords, fromLeft: boolean, cameFromIndex: number
    ): { nextCoords: Coords, nextCameFrom: number } | null => {
        // if the neighbor is not a card, return null
        const currentCard = board.boardCards[currentCoords.x][currentCoords.y]
        if (!currentCard) return null;

        const previousPathState = pathStates[previousCoords.x][previousCoords.y]
        const currentPathState = pathStates[currentCoords.x][currentCoords.y]

        currentPathState.coords = currentCoords
        currentPathState.visitState = VisitState.DONE
        if (fromLeft) {
            currentPathState.left = previousPathState
            previousPathState.right = currentPathState
        }
        else {
            currentPathState.right = previousPathState
            previousPathState.left = currentPathState
        }

        const cardPattern = CARDS[currentCard.cardID]
        if (!cardPattern.includes(color)) throw new Error("Color not found");

        const indices = getIndicesOfColorInCardPattern(cardPattern, color, currentCard.orientation)

        for (let i = 0; i < indices.length; i++) {
            // we must chose the second index
            if (indices[i] == cameFromIndex) continue;

            const par = mod(currentCoords.x + board.parity, 2)
            const nextCoords = getNeighborCoords(indices[i], currentCoords.x, currentCoords.y, par)
            const nextCameFrom = cameFromIndexCalc(indices[i])
            return {
                nextCoords: nextCoords,
                nextCameFrom: nextCameFrom
            }
        }

        throw new Error("Color not found");
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const card = board.boardCards[i][j]
            if (!card) continue;
            if (pathStates[i][j].visitState == VisitState.DONE) continue;

            pathStates[i][j].coords = { x: i, y: j }
            pathStates[i][j].visitState == VisitState.DONE

            const cardPatter = CARDS[card.cardID]
            if (!cardPatter.includes(color)) continue;
            const indices = getIndicesOfColorInCardPattern(cardPatter, color, card.orientation)
            if (indices.length != 2) throw Error("Something wrong, there must be always two ends of a path")

            // where the while cycle will begin
            const par = mod(i + board.parity, 2)
            const leftCoords = getNeighborCoords(indices[0], i, j, par)
            let leftEndCoords = { x: i, y: j }
            let nextMove = continuePath(leftEndCoords, leftCoords, false, cameFromIndexCalc(indices[0]))
            if (nextMove != null) {
                leftEndCoords = leftCoords
            }
            // if nextMove is null, it means we are at the end of the path            
            let loopFound = false;
            while (nextMove != null) {
                // LOOP DETECTION
                if (pathStates[nextMove.nextCoords.x][nextMove.nextCoords.y].visitState == VisitState.DONE) {
                    loopFound = true;
                    break;
                }

                const newNextMove = continuePath(leftEndCoords, nextMove.nextCoords, false, nextMove.nextCameFrom)
                if (newNextMove != null) {
                    leftEndCoords = nextMove.nextCoords
                }
                nextMove = newNextMove
            }
            if (loopFound) {
                loops.push(leftEndCoords)
                continue;
            }
            leftEnds.push(leftEndCoords)
            const leftEndPath = pathStates[leftEndCoords.x][leftEndCoords.y]

            // right neighbor
            const rightCoords = getNeighborCoords(indices[1], i, j, par)
            let rightEndCoords = { x: i, y: j }
            nextMove = continuePath(rightEndCoords, rightCoords, true, cameFromIndexCalc(indices[1]))
            if (nextMove != null) {
                rightEndCoords = rightCoords
            }
            // if nextMove is null, it means we are at the end of the path
            while (nextMove != null) {
                // console.log(`right end before: ${JSON.stringify(rightEndCoords)}, right: ${JSON.stringify(rightCoords)}, next ${JSON.stringify(nextMove?.nextCoords)}`)
                const newNextMove = continuePath(rightEndCoords, nextMove.nextCoords, true, nextMove.nextCameFrom)
                if (newNextMove != null) {
                    rightEndCoords = nextMove.nextCoords
                }
                nextMove = newNextMove
                // console.log(`right end after: ${JSON.stringify(rightEndCoords)}, right: ${JSON.stringify(rightCoords)}, next ${JSON.stringify(nextMove?.nextCoords)}`)
            }
        }
    }

    const maxLeftEnds = Math.max(...leftEnds.map((leToCheck) => getLengthFromLeftEnd(pathStates[leToCheck.x][leToCheck.y])))
    const maxLoopLength = Math.max(...loops.map((leToCheck) => getLoopLengthFromLeftEnd(pathStates[leToCheck.x][leToCheck.y])))
    return Math.max(maxLeftEnds, maxLoopLength * 2)
}
