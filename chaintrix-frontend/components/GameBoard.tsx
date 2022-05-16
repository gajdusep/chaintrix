import styles from '../components/Hexagons.module.css'
import Draggable, { DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable'; // The default
import { useEffect, useState } from 'react';
import GameTileSpace from './GameTileSpace'
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState,
    addCardToBoard, checkValidityWithMovePhase,
    getBoardHeight, getBoardWidth, getObligatoryPlayersCards,
    PLAYER_PLAYED, GAME_STARTED, PlayerPlayedPayload,
    GameStartedPayload, PLAYER_WANTS_TO_PLAY_NO_BLOCKCHAIN,
    GAME_STARTED_PLAYER_ID, GameStartedPlayerIDPayload
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    selectGameState, selectSizes, selectPlayersCardsView,
    rotateCardInCardView, addCardToBoardSocket, selectPlayerID
} from '../store/gameStateSlice';
import { selectSocketClient, setOnEvent } from '../store/socketSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'

const GameBoard = () => {
    const gameState = useAppSelector(selectGameState);
    const sizes = useAppSelector(selectSizes);
    const playersCardsView = useAppSelector(selectPlayersCardsView);
    const socketClient = useAppSelector(selectSocketClient);
    const playerID = useAppSelector(selectPlayerID)
    const dispatch = useAppDispatch();

    const [tileHovered, setTileHovered] = useState<Coords | null>(null);
    const [hexPositions, setHexPositions] = useState<Array<HexPosition>>(() => getHexPositions(gameState.board, sizes))
    const [playerTilesMoving, setPlayerTilesMoving] = React.useState(Array(6).fill(false));
    const containerRef = React.useRef(null)
    const [controlledPositions, setControlledPositions] = useState<Array<Coords>>(() => calculatePlayersTilesPositions(sizes));

    useEffect(() => {
        setHexPositions(getHexPositions(gameState.board, sizes))
        setControlledPositions(calculatePlayersTilesPositions(sizes));
    }, [sizes])

    const translateDraggableData = (data: DraggableData): Coords => {
        return {
            x: data.y,
            y: data.x
        }
    }

    const eventLogger = (e: DraggableEvent, data: DraggableData, index: number) => {
        // if (!board) return;
        playerTilesMoving[index] = true;
        // setControlledPosition({ x: data.x, y: data.y })
        const translatedData = translateDraggableData(data)
        setTileHovered(null)
        for (let i = 0; i < hexPositions.length; i++) {
            const element = hexPositions[i].xyPosition;
            const x = translatedData.x
            const y = translatedData.y
            if (Math.abs(x - element.x) < sizes.maxDist && Math.abs(y - element.y) < sizes.maxDist) {
                const tileFieldType = gameState.board.boardFieldsTypes[hexPositions[i].ijPosition.x][hexPositions[i].ijPosition.y]
                if (tileFieldType == BoardFieldType.GUARDED ||
                    tileFieldType == BoardFieldType.UNREACHABLE ||
                    tileFieldType == BoardFieldType.CARD) {
                    return;
                }

                // TODO: here should be the validity check as well!
                setTileHovered(hexPositions[i].ijPosition)
                return;
            }
        }
    };

    const eventStop = (e: DraggableEvent, data: DraggableData, index: number) => {
        setTileHovered(null)
        const translatedData = translateDraggableData(data)
        if (!playerTilesMoving[index]) {
            dispatch(rotateCardInCardView({ cardIndex: index }))
            return;
        }

        playerTilesMoving[index] = false;
        for (let i = 0; i < hexPositions.length; i++) {
            const element = hexPositions[i].xyPosition;
            const x = translatedData.x
            const y = translatedData.y
            if (Math.abs(x - element.x) < sizes.maxDist && Math.abs(y - element.y) < sizes.maxDist) {
                const tileFieldType = gameState.board.boardFieldsTypes[hexPositions[i].ijPosition.x][hexPositions[i].ijPosition.y]
                if (tileFieldType == BoardFieldType.GUARDED ||
                    tileFieldType == BoardFieldType.UNREACHABLE ||
                    tileFieldType == BoardFieldType.CARD) {
                    return;
                }
                const cardToAdd = playersCardsView[index]
                const isValid = checkValidityWithMovePhase(
                    gameState.board, cardToAdd,
                    hexPositions[i].ijPosition.x, hexPositions[i].ijPosition.y,
                    gameState.currentlyMovingPhase, gameState.playersStates[playerID].cards
                )
                if (!isValid) return;

                dispatch(addCardToBoardSocket({ socketClient: socketClient, card: cardToAdd, x: hexPositions[i].ijPosition.x, y: hexPositions[i].ijPosition.y }))
            }
        }
    };

    const isHighlighted = (i: number, j: number): boolean => {
        if (!tileHovered) return false;
        return i == tileHovered.x && j == tileHovered.y
    }

    return (
        <div
            id='draggableContainer'
            ref={containerRef}
            style={{
                height: `${sizes.boardHeight}px`,
                width: `${sizes.boardWidth}px`,
                position: 'relative',
                backgroundColor: 'white'
            }}>
            {gameState.board && gameState.board.boardCards.map((object, i) => {
                return object.map((object2, j) => {
                    return <div key={`${i}-${j}`} className={styles.hex}
                        draggable='false'
                        style={{ top: getTilePosition(i, j, gameState.board.parity, sizes).x, left: getTilePosition(i, j, gameState.board.parity, sizes).y }}>
                        <img className='dont-drag-image'
                            draggable='false'
                            src={`/emptyTiles/Tile_obligatory_border.svg`} width={sizes.svgWidth} height={sizes.svgHeight}
                            style={{ position: 'absolute' }} />
                        <GameTileSpace card={object2} width={sizes.svgWidth} height={sizes.svgHeight}
                            highlighted={isHighlighted(i, j)}
                            boardFieldType={gameState.board.boardFieldsTypes[i][j]}
                        />
                        {/* <p style={{ zIndex: 1000, position: 'absolute', left: `10px`, color: 'white' }}>Another div - obligatory svg</p> */}
                    </div>
                })
            })}
            <div style={{
                position: 'absolute',
                bottom: 0, backgroundColor: '#ffaaaa',
                width: `100%`, height: `${sizes.size * 2}px`
            }}></div>
            <div style={{
                visibility: playerID === gameState.currentlyMovingPlayer ? 'hidden' : 'visible',
                position: 'absolute',
                bottom: 0, backgroundColor: '#ffaabb22', zIndex: 1000000,
                width: `100%`, height: `${sizes.size * 2}px`
            }}></div>
            {/* {gameState.playersStates[PLAYER_INDEX].cards.map((element, index) => { */}
            {
                playersCardsView.map((element, index) => {
                    return <Draggable
                        key={index}
                        bounds="#draggableContainer"
                        onDrag={(e, data) => { eventLogger(e, data, index) }}
                        onStop={(e, data) => { eventStop(e, data, index) }}
                        // nodeRef={nodeRef}
                        position={controlledPositions[index]}
                    >
                        <div style={{ zIndex: 100000, position: 'absolute', cursor: 'pointer' }}>
                            <GameTileSpace card={element} width={sizes.svgWidth} height={sizes.svgHeight}
                                highlighted={false} boardFieldType={BoardFieldType.CARD}
                            />
                        </div>
                    </Draggable>
                })
            }
        </div >
    )
}

export default GameBoard;
