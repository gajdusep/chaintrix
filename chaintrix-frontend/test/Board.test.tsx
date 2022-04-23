
import { Board } from '../helpers/Board'

test(
    'getNeighborsParityIOddParity0',
    () => {
        const board = new Board();
        board.parity = 0;
        const neighbors = board.getTileNeighbors(1, 1)
        expect(neighbors).toEqual([
            { x: 0, y: 2 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 }
        ])
    }
)

test(
    'getNeighborsParityIEvenParity0',
    () => {
        const board = new Board();
        board.parity = 0;
        const neighbors = board.getTileNeighbors(2, 1)
        expect(neighbors).toEqual([
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 1 },
            { x: 3, y: 0 },
            { x: 2, y: 0 },
            { x: 1, y: 0 }
        ])
    }
)

test(
    'getNeighborsParityIOddParity1',
    () => {
        const board = new Board();
        board.parity = 1;
        const neighbors = board.getTileNeighbors(1, 1)
        expect(neighbors).toEqual([
            { x: 0, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 1 },
            { x: 2, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 0 }
        ])
    }
)

test(
    'getNeighborsParityIEvenParity1',
    () => {
        const board = new Board();
        board.parity = 1;
        const neighbors = board.getTileNeighbors(2, 1)
        expect(neighbors).toEqual([
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 3, y: 2 },
            { x: 3, y: 1 },
            { x: 2, y: 0 },
            { x: 1, y: 1 }
        ])
    }
)

test(
    'getNeighborsNullIOdd',
    () => {
        const board = new Board();
        const neighbors = board.getTileNeighbors(1, 0)
        console.log(neighbors)
        expect(neighbors).toEqual([
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 2, y: 0 },
            null,
            { x: 0, y: 0 }
        ])
    }
)

test(
    'getNeighborsNullIEven',
    () => {
        const board = new Board();
        const neighbors = board.getTileNeighbors(2, 0)
        console.log(neighbors)
        expect(neighbors).toEqual([
            { x: 1, y: 0 },
            { x: 2, y: 1 },
            { x: 3, y: 0 },
            null,
            null,
            null
        ])
    }
)



export { }
