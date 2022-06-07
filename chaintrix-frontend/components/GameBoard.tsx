import styles from '../components/GameBoard.module.css'
import Draggable, { DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable'; // The default
import { useEffect, useState } from 'react';
import GameTileSpace from './GameTileSpace'
import {
    BoardFieldType, getTilePosition, getHexPositions, calculatePlayersTilesPositions,
    Coords, Card, HexPosition, checkValidityWithMovePhase,
    getObligatoryPlayersCards,
    isFinalPhase
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    selectGameState, selectSizes, selectPlayersCardsView,
    rotateCardInCardView, addCardToBoardSocket, selectPlayerID, selectIsCurrentlyPlaying
} from '../store/gameStateSlice';
import { selectSocketClient, setOnEvent } from '../store/socketSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'

interface ValidityChecks {
    [cardID: string]: { [coords: string]: boolean }
}

const GameBoard = () => {
    const gameState = useAppSelector(selectGameState);
    const sizes = useAppSelector(selectSizes);
    const playersCardsView = useAppSelector(selectPlayersCardsView);
    const [playersObligatoryCardsView, setPlayersObligatoryCardsView] = useState<Array<Array<Coords>>>(() => []);
    const socketClient = useAppSelector(selectSocketClient);
    const playerID = useAppSelector(selectPlayerID)
    const isCurrentlyPlaying = useAppSelector(selectIsCurrentlyPlaying);
    const dispatch = useAppDispatch();

    const [tileHovered, setTileHovered] = useState<Coords | null>(null);
    const [hexPositions, setHexPositions] = useState<Array<HexPosition>>(() => getHexPositions(gameState.board, sizes))
    const [playerTilesMoving, setPlayerTilesMoving] = React.useState(Array(6).fill(false));
    const containerRef = React.useRef(null)
    const [controlledPositions, setControlledPositions] = useState<Array<Coords>>(() => calculatePlayersTilesPositions(sizes));
    const [cachedValidityChecks, setCachedValidityChecks] = useState<ValidityChecks>({});

    const getValidityCheck = (card: Card, posX: number, posY: number) => {
        const positionKey = `${posX},${posY},${card.orientation}`
        if (card.cardID in cachedValidityChecks && positionKey in cachedValidityChecks[card.cardID]) {
            return cachedValidityChecks[card.cardID][positionKey];
        }
        cachedValidityChecks[card.cardID] = {}
        const finalPhase = isFinalPhase(gameState)
        const isValid = checkValidityWithMovePhase(
            gameState.board, card,
            posX, posY,
            gameState.currentlyMovingPhase, gameState.playersStates[playerID].cards, finalPhase
        )
        cachedValidityChecks[card.cardID][positionKey] = isValid;
        return isValid;
    }


    useEffect(() => {
        console.log(`calculating obligatory cards, reset validity checks`)
        setCachedValidityChecks({})
        const finalPhase = isFinalPhase(gameState)
        setPlayersObligatoryCardsView(getObligatoryPlayersCards(gameState.board, playersCardsView, finalPhase))
    }, [gameState])

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

    const cannotPlaceFieldType = (tileFieldType: BoardFieldType): boolean => {
        return tileFieldType == BoardFieldType.GUARDED || tileFieldType == BoardFieldType.UNREACHABLE || tileFieldType == BoardFieldType.CARD
    }

    const canPlace = (x: number, xx: number, y: number, yy: number, cardIndex: number, boardIndex: number): boolean => {
        return Math.abs(x - xx) < sizes.maxDist && Math.abs(y - yy) < sizes.maxDist &&
            !cannotPlaceFieldType(gameState.board.boardFieldsTypes[hexPositions[boardIndex].ijPosition.x][hexPositions[boardIndex].ijPosition.y]) &&
            playersCardsView[cardIndex] != null &&
            getValidityCheck(playersCardsView[cardIndex]!, hexPositions[boardIndex].ijPosition.x, hexPositions[boardIndex].ijPosition.y)
    }

    const eventDrag = (e: DraggableEvent, data: DraggableData, cardIndex: number) => {
        playerTilesMoving[cardIndex] = true;
        const translatedData = translateDraggableData(data)
        setTileHovered(null)
        for (let i = 0; i < hexPositions.length; i++) {
            const element = hexPositions[i].xyPosition;
            const x = translatedData.x
            const y = translatedData.y
            if (canPlace(x, element.x, y, element.y, cardIndex, i)) {
                setTileHovered(hexPositions[i].ijPosition)
            }
        }
    };

    const eventStop = (e: DraggableEvent, data: DraggableData, cardIndex: number) => {
        setTileHovered(null)
        const translatedData = translateDraggableData(data)
        if (!playerTilesMoving[cardIndex]) {
            dispatch(rotateCardInCardView({ cardIndex: cardIndex }))
            return;
        }

        playerTilesMoving[cardIndex] = false;
        for (let i = 0; i < hexPositions.length; i++) {
            const element = hexPositions[i].xyPosition;
            const x = translatedData.x
            const y = translatedData.y
            if (canPlace(x, element.x, y, element.y, cardIndex, i)) {
                dispatch(addCardToBoardSocket({
                    socketClient: socketClient,
                    card: playersCardsView[cardIndex]!,
                    x: hexPositions[i].ijPosition.x, y: hexPositions[i].ijPosition.y
                }))
                return;
            }
        }
    };

    const isHighlighted = (i: number, j: number): boolean => {
        if (!tileHovered) return false;
        return i == tileHovered.x && j == tileHovered.y
    }

    const classByColorMapping: { [color: string]: string } = {
        'R': styles.redPlayer,
        'B': styles.bluePlayer,
        'G': styles.greenPlayer,
        'Y': styles.yellowPlayer,
    }

    // TODO: if the game is finished, forbid moving (if someone disables overlay element)

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
                        {/* <img className='dont-drag-image'
                            draggable='false'
                            src={`/emptyTiles/Tile_obligatory_border.svg`} width={sizes.svgWidth} height={sizes.svgHeight}
                            style={{ position: 'absolute' }} /> */}
                        <GameTileSpace card={object2} width={sizes.svgWidth} height={sizes.svgHeight}
                            highlighted={isHighlighted(i, j)}
                            boardFieldType={gameState.board.boardFieldsTypes[i][j]}
                        />
                    </div>
                })
            })}
            <div className={styles.currentPlayersCardsWrapper + " " + classByColorMapping[gameState.playersStates[playerID].color]}
                style={{ height: `${sizes.size * 2}px` }}
            />
            <div className={styles.currentPlayerCardsOverdiv}
                style={{ visibility: isCurrentlyPlaying ? 'hidden' : 'visible', height: `${sizes.size * 2}px` }} />
            {playersCardsView.map((element, index) => {
                return element != null && <Draggable
                    key={index}
                    bounds="#draggableContainer"
                    onDrag={(e, data) => { eventDrag(e, data, index) }}
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
            })}
            {playersObligatoryCardsView.map((element, index) => {
                if (element.length > 0) {
                    return (
                        <div className={styles.hex}
                            draggable='false'
                            style={{ top: calculatePlayersTilesPositions(sizes)[index].y, left: calculatePlayersTilesPositions(sizes)[index].x }}>
                            <div>
                                <img className='dont-drag-image'
                                    draggable='false'
                                    src={`/emptyTiles/Tile_obligatory_border.svg`} width={sizes.svgWidth} height={sizes.svgHeight}
                                    style={{ position: 'absolute' }}
                                />
                            </div>
                        </div>
                    )
                }
            })}
        </div>
    )
}

export default GameBoard;
