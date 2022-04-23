import { Card, CardNullable, Coords } from "./CustomTypes";

export enum BoardFieldType {
    CARD = 'Card',
    UNREACHABLE = 'Unreachable',
    OBLIGATORY = 'Obligatory',
    GUARDED = 'Guarded',
    FREE = 'Free'
}


export const mod = (n: number, m: number): number => {
    return ((n % m) + m) % m;
}

export class Board {
    parity: number = 0
    boardCards: Array<Array<CardNullable>>;
    boardFieldsTypes: Array<Array<BoardFieldType>> = [];

    constructor() {
        const initHeight = 3;
        const initWidth = 3;
        this.boardCards = this.create2DArray<CardNullable>(null, initHeight, initWidth);
        console.log(`New board created: width: ${this.width}, height: ${this.height}`)
        this.calculateBoardFieldsTypes()
        this.boardFieldsTypes[1][1] = BoardFieldType.FREE;
    }

    create2DArray = <T,>(defaultValue: T, height: number, width: number): Array<Array<T>> => {
        const arrayToReturn = []
        for (let i = 0; i < height; i++) {
            const subArray = []
            for (let j = 0; j < width; j++) {
                subArray.push(defaultValue)
            }
            arrayToReturn.push(subArray)
        }
        return arrayToReturn;
    }


    getTileNeighbors = (i: number, j: number): Array<Coords | null> => {
        const turnParity = (n: number): number => {
            return (n + 1) % 2
        }

        const neighbors: Array<Coords | null> = []
        const par = (i + this.parity) % 2
        neighbors.push({ x: i - 1, y: j + par })
        neighbors.push({ x: i, y: j + 1 })
        neighbors.push({ x: i + 1, y: j + par })
        neighbors.push({ x: i + 1, y: j - turnParity(par) })
        neighbors.push({ x: i, y: j - 1 })
        neighbors.push({ x: i - 1, y: j - turnParity(par) })

        for (let nIndex = 0; nIndex < neighbors.length; nIndex++) {
            const neighbor = neighbors[nIndex];
            if (!neighbor) continue;
            if (neighbor.x < 0 || neighbor.x >= this.height || neighbor.y < 0 || neighbor.y >= this.width) {
                neighbors[nIndex] = null
            }
        }

        return neighbors
    }

    calculateCardTileNeighbors = (neighbors: Array<Coords | null>): number => {
        let numberOfCardNeighbors = 0
        for (let coordIndex = 0; coordIndex < neighbors.length; coordIndex++) {
            const coord = neighbors[coordIndex];
            if (coord == null) continue
            const cardOrNull = this.boardCards[coord.x][coord.y]
            if (cardOrNull == null) continue
            numberOfCardNeighbors++;
        }
        return numberOfCardNeighbors
    }

    calculateBoardFieldsTypes = () => {
        // TODO: if the shape is already the same, don't create the arrays again
        // TODO: save the positions of OBLIGATORY etc in some data structure

        this.boardFieldsTypes = this.create2DArray<BoardFieldType>(BoardFieldType.UNREACHABLE, this.height, this.width)

        // find all cards
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.boardCards[i][j] == null) continue;
                this.boardFieldsTypes[i][j] = BoardFieldType.CARD
            }
        }

        // find all unreachable and potentialy free
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.boardCards[i][j] != null) continue;

                const tileNeighbors = this.getTileNeighbors(i, j);
                const numberOfCardNeighbors = this.calculateCardTileNeighbors(tileNeighbors)

                if (numberOfCardNeighbors == 0) {
                    this.boardFieldsTypes[i][j] = BoardFieldType.UNREACHABLE;
                }
                else if (tileNeighbors.length > 1) {
                    this.boardFieldsTypes[i][j] = BoardFieldType.FREE;
                }
            }
        }


        const guardedCondition = (iGuard: number, jGuard: number): boolean => {
            return iGuard >= 0 && iGuard < this.height &&
                jGuard >= 0 && jGuard < this.width &&
                this.boardFieldsTypes[iGuard][jGuard] != BoardFieldType.CARD &&
                this.boardFieldsTypes[iGuard][jGuard] != BoardFieldType.UNREACHABLE
        }
        // find all obligatory and guarded
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.boardCards[i][j] != null) continue;

                const tileNeighbors = this.getTileNeighbors(i, j);
                const numberOfCardNeighbors = this.calculateCardTileNeighbors(tileNeighbors)

                if (numberOfCardNeighbors < 3) continue;

                this.boardFieldsTypes[i][j] = BoardFieldType.OBLIGATORY;

                // go all directions and find the guarded fields

                // direction 1
                let iHelp = i
                let jHelp = j
                while (guardedCondition(iHelp, jHelp)) {
                    this.boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                    iHelp--;
                    jHelp += (iHelp + 1 + this.parity) % 2;
                }

                // direction 2
                iHelp = i
                jHelp = j
                while (guardedCondition(iHelp, jHelp)) {
                    this.boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                    jHelp += 1;
                }

                // direction 3
                iHelp = i
                jHelp = j
                while (guardedCondition(iHelp, jHelp)) {
                    this.boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                    iHelp++;
                    jHelp += (iHelp + 1 + this.parity) % 2;
                }

                // direction 4
                iHelp = i
                jHelp = j
                while (guardedCondition(iHelp, jHelp)) {
                    this.boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                    iHelp++;
                    jHelp -= (iHelp + this.parity) % 2;
                }

                // direction 5
                iHelp = i
                jHelp = j
                while (guardedCondition(iHelp, jHelp)) {
                    this.boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                    jHelp -= 1;
                }

                // direction 6
                iHelp = i
                jHelp = j
                while (guardedCondition(iHelp, jHelp)) {
                    this.boardFieldsTypes[iHelp][jHelp] = BoardFieldType.GUARDED
                    iHelp--;
                    jHelp -= (iHelp + this.parity) % 2;
                }

                this.boardFieldsTypes[i][j] = BoardFieldType.OBLIGATORY;
            }
        }
    }

    get width(): number {
        // TODO: check if array initialized and full

        return this.boardCards[0].length;
    }

    get height(): number {
        // TODO: check if array initialized and full

        return this.boardCards.length;
    }

    getColorsOfNeighbors = (neighbors: Array<Coords | null>): { [color: string]: number } => {
        const colors: { [color: string]: number } = {}
        for (let nIndex = 0; nIndex < neighbors.length; nIndex++) {
            const neighborCoords = neighbors[nIndex];
            if (!neighborCoords) continue;
            const neighbor = this.boardCards[neighborCoords.x][neighborCoords.y]
            if (!neighbor) continue;

            const currentOffset = mod((2 + nIndex), 6)
            const neighborCardOffset = mod((currentOffset + 3 - neighbor.orientation), 6)

            const neighborColor = neighbor.pattern[neighborCardOffset]
            if (neighborColor in colors) {
                colors[neighborColor] += 1;
            }
            else {
                colors[neighborColor] = 1;
            }
        }
        return colors;
    }

    checkValidity = (card: Card, posX: number, posY: number, shouldCheckThreeOfColor: boolean = true) => {
        const tileNeighbors = this.getTileNeighbors(posX, posY)

        // for all neighbors check if the colors fit
        for (let nIndex = 0; nIndex < tileNeighbors.length; nIndex++) {
            const neighborCoords = tileNeighbors[nIndex];
            if (!neighborCoords) continue;
            const neighbor = this.boardCards[neighborCoords.x][neighborCoords.y]
            if (!neighbor) {
                continue
            };

            const currentOffset = mod((2 + nIndex), 6)
            const testedCardOffset = mod((currentOffset - card.orientation), 6)
            const neighborCardOffset = mod((currentOffset + 3 - neighbor.orientation), 6)
            // console.log(`${testedCardOffset} -- ${neighborCardOffset}, ${card.pattern[testedCardOffset]} -- ${neighbor.pattern[neighborCardOffset]}`)
            if (card.pattern[testedCardOffset] != neighbor.pattern[neighborCardOffset]) {
                return false;
            }
        }

        if (!shouldCheckThreeOfColor) return true;

        // for all neighbors check if there are not 3 paths of the same color
        for (let nIndex = 0; nIndex < tileNeighbors.length; nIndex++) {
            const neighborCoords = tileNeighbors[nIndex];
            if (!neighborCoords) continue;
            const neighbor = this.boardCards[neighborCoords.x][neighborCoords.y]
            if (neighbor) continue;

            const currentOffset = mod((2 + nIndex), 6)
            const testedCardOffset = mod((currentOffset - card.orientation), 6)
            const collorToCheck = card.pattern[testedCardOffset]

            const neighborsNeighbors = this.getTileNeighbors(neighborCoords.x, neighborCoords.y)
            const colorsOfNeighbors = this.getColorsOfNeighbors(neighborsNeighbors)
            if (colorsOfNeighbors[collorToCheck] > 1) return false;
        }


        return true;
    }

    addCardToBoard = (card: CardNullable, posX: number, posY: number) => {
        // TODO: check if out of bounds

        let addTop: boolean = false;
        let addLeft: boolean = false;
        let addBottom: boolean = false;
        let addRight: boolean = false;

        if (posX == 0) addTop = true;
        if (posX == this.height - 1) addBottom = true;
        if (posY == 0) addLeft = true;
        if (posY == this.width - 1) addRight = true;

        this.boardCards[posX][posY] = card

        // return;
        if (addTop) {
            this.parity = mod(this.parity + 1, 2);
            const newArray = new Array(this.width).fill(null);
            this.boardCards.unshift(newArray)
        }

        if (addBottom) {
            const newArray = new Array(this.width).fill(null);
            this.boardCards.push(newArray)
        }

        if (addLeft) {
            for (let i = 0; i < this.boardCards.length; i++) {
                const arrayToUnshift = this.boardCards[i]
                arrayToUnshift.unshift(null)
            }
        }

        if (addRight) {
            for (let i = 0; i < this.boardCards.length; i++) {
                const arrayToUnshift = this.boardCards[i]
                arrayToUnshift.push(null)
            }
        }

        this.calculateBoardFieldsTypes();
    }

    choseObligatoryPlayersCards = (playersCards: Array<Card>): Array<number> => {
        // TODO: for every obligatory position and for card:
        // check if the card can be placed into the obligatory position 
        // and return indeces (?)

        return []
    }
}
