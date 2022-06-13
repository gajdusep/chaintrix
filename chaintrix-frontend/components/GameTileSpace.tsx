import { BoardFieldType, CardNullable } from '../../chaintrix-game-mechanics/dist/index';

type GameTileSpaceProps = {
    width: number,
    height: number,
    highlighted: boolean,
    card: CardNullable,
    boardFieldType: BoardFieldType
}

const GameTileSpace = (
    props: GameTileSpaceProps
) => {
    let emptyFieldImg = ''
    switch (props.boardFieldType) {
        case BoardFieldType.FREE:
            emptyFieldImg = '/Tile_free.svg'
            break;
        case BoardFieldType.GUARDED:
            emptyFieldImg = '/Tile_guarded.svg'
            break;
        case BoardFieldType.OBLIGATORY:
            emptyFieldImg = '/Tile_obligatory.svg'
            break;
        case BoardFieldType.UNREACHABLE:
            emptyFieldImg = '/Tile_unreachable.svg'
            break;
        default:
            emptyFieldImg = '/Nothing.svg'
            break;
    }
    if (props.highlighted) {
        return <img className='dont-drag-image'
            draggable='false'
            src={`/emptyTiles/Tile_highlighted.svg`} width={props.width} height={props.height} />
    }

    if (!props.card) {
        return <img
            className='dont-drag-image'
            draggable='false'
            src={`/emptyTiles${emptyFieldImg}`} width={props.width} height={props.height} />
    }

    return <div>
        <img
            src={`/tiles/Tantrix_tile_${props.card.cardID}.svg`} width={props.width} height={props.height}
            className='dont-drag-image'
            draggable='false'
            style={{ transform: `rotate(${(props.card.orientation % 6) * 60}deg)` }}
        />
        {/* <p style={{
            position: 'absolute', color: 'black',
            padding: 0, margin: 0,
            marginTop: -props.height / 2 - 20,
            marginLeft: props.width / 2 - 20,
            backgroundColor: 'pink'
        }}>
            {props.card.cardID}, {props.card.orientation}
        </p> */}
    </div>
}

export default GameTileSpace;
