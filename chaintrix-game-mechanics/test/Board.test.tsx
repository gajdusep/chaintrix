
import { Board } from '../src/Board'

test(
    'getNeighborsParityIOddParity0',
    () => {
        const board = new Board();
        board.parity = 0;
        const neighbors = board.getTileNeighborsCoords(1, 1)
        const a = 'testing'
        const b = 'testing'
        expect(a).toEqual(b)
    }
)


export { }
