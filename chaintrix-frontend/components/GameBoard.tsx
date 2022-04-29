import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../components/Hexagons.module.css'

import Draggable, { DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable'; // The default
import { useEffect, useState } from 'react';
import GameTileSpace from './GameTileSpace'
// import { CARDS } from 'chaintrix-game-mechanics';
// import {
//     Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
//     getHexPositions, calculatePlayersTilesPositions, Coords,
//     CardNullable, Card, HexPosition
// } from 'chaintrix-game-mechanics';
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState,
    checkValidity, addCardToBoard,
    getBoardHeight, getBoardWidth, getObligatoryPlayersCards
} from '../../chaintrix-game-mechanics/dist/index.js';
import { selectGameState, addCardToBoardAction, replaceGivenCardWithNewOne } from '../store/gameStateSlice';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import React from 'react'

const getRandomCard = (): Card => {
    const someCardID = (Math.floor(Math.random() * (6 - 1 + 1)) + 1).toString();
    // const someCardID = "4"

    const someCard: Card = {
        cardID: someCardID,
        orientation: 0,
    }
    return someCard;
}

type GameBoardProps = {
    // gameState: GameState
}

const initialWidth = 500
const initialHeight = 600
const GameBoard = (
    props: GameBoardProps
) => {
    const gameState = useAppSelector(selectGameState);
    const dispatch = useAppDispatch();

    const [tileHovered, setTileHovered] = useState<Coords | null>(null);
    // const [board, setBoard] = useState<Board>(() => { return new Board() })
    const [sizes, setSizes] = useState<Sizes>(() => calculateSizes(
        getBoardWidth(gameState.board), getBoardHeight(gameState.board), initialWidth, initialHeight)
    )
    const [hexPositions, setHexPositions] = useState<Array<HexPosition>>(() => getHexPositions(gameState.board, sizes))
    const [playersTiles, setPlayersTiles] = useState<Array<Card>>([]);
    const [playerTilesMoving, setPlayerTilesMoving] = React.useState(Array(6).fill(false));
    const nodeRef = React.useRef(null);
    const blbostRef = React.useRef(null);
    const containerRef = React.useRef(null)

    const [controlledPositions, setControlledPositions] = useState<Array<Coords>>(() => calculatePlayersTilesPositions(sizes));
    const PLAYER_INDEX = 0

    useEffect(() => {
        // const freshBoard = new Board()
        // setBoard(freshBoard)
        // setHexPositions(getHexPositions(board, sizes));

        // const newTiles = []
        // for (let i = 0; i < 6; i++) {
        //     newTiles.push(getRandomCard())
        // }
        setPlayersTiles(gameState.playersStates[PLAYER_INDEX].cards)
        // console.log(newTiles)
    }, [])

    useEffect(() => {
        console.log(`sizes changed?: ${JSON.stringify(sizes)}`)
        // if (!gameState.board) return;
        setHexPositions(getHexPositions(gameState.board, sizes))
        setControlledPositions(calculatePlayersTilesPositions(sizes));
    }, [sizes])

    useEffect(() => {
        console.log(`game state changed?: ${JSON.stringify(sizes)}`)
        setPlayersTiles(gameState.playersStates[PLAYER_INDEX].cards.map(el => Object.assign(el)))
    }, [gameState])

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
                setTileHovered(hexPositions[i].ijPosition)
                return;
            }
        }
    };

    const eventStop = (e: DraggableEvent, data: DraggableData, index: number) => {
        setTileHovered(null)
        console.log('stopped????')
        const translatedData = translateDraggableData(data)
        if (!playerTilesMoving[index]) {
            gameState.playersStates[PLAYER_INDEX].cards[index].orientation = (gameState.playersStates[PLAYER_INDEX].cards[index].orientation + 1) % 6
            console.log(`clicked, ${gameState.playersStates[PLAYER_INDEX].cards[index].orientation}`)
            setPlayersTiles(gameState.playersStates[PLAYER_INDEX].cards.map(el => Object.assign(el)))
            return;
        }

        playerTilesMoving[index] = false;
        for (let i = 0; i < hexPositions.length; i++) {
            const element = hexPositions[i].xyPosition;
            const x = translatedData.x
            const y = translatedData.y
            if (Math.abs(x - element.x) < sizes.maxDist && Math.abs(y - element.y) < sizes.maxDist) {
                // if (!board) return;
                const tileFieldType = gameState.board.boardFieldsTypes[hexPositions[i].ijPosition.x][hexPositions[i].ijPosition.y]
                if (tileFieldType == BoardFieldType.GUARDED ||
                    tileFieldType == BoardFieldType.UNREACHABLE ||
                    tileFieldType == BoardFieldType.CARD) {
                    return;
                }
                const isValid = checkValidity(gameState.board, gameState.playersStates[PLAYER_INDEX].cards[index], hexPositions[i].ijPosition.x, hexPositions[i].ijPosition.y)
                // console.log(`checked validity: ${isValid}`)

                if (!isValid) return;

                // setControlledPosition({ x: element.y - sizes.middle, y: element.x - sizes.middle })
                // setTileHovered(hexPositions[i].ijPosition)
                // const newBoard = addCardToBoard(gameState.board, gameState.playersStates[PLAYER_INDEX].cards[index], hexPositions[i].ijPosition.x, hexPositions[i].ijPosition.y)
                dispatch(addCardToBoardAction({ card: gameState.playersStates[PLAYER_INDEX].cards[index], x: hexPositions[i].ijPosition.x, y: hexPositions[i].ijPosition.y }))
                dispatch(replaceGivenCardWithNewOne({ card: getRandomCard(), playerIndex: PLAYER_INDEX, cardIndex: index }))
                // gameState.playersStates[PLAYER_INDEX].cards[index] = getRandomCard()
                setPlayersTiles(gameState.playersStates[PLAYER_INDEX].cards)
                // playersTiles[index] = getRandomCard()

                const newBoard = gameState.board;
                console.log(`what what what: ${JSON.stringify(getObligatoryPlayersCards(newBoard, gameState.playersStates[PLAYER_INDEX].cards))}`)

                // setPlayersTiles(playersTiles.map(el => Object.assign(el)))

                // TODO: size
                const newHeight = getBoardHeight(newBoard)
                const newWidth = getBoardWidth(newBoard)
                setSizes(calculateSizes(newWidth, newHeight, initialWidth, initialHeight))
                console.log(`board: ${newWidth}, ${newHeight}`)
                // setBoard(board);
                return;
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
                width: `100%`, height: `${sizes.size * 2}px`, display: 'flex',
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
            }}>
            </div>
            {/* {gameState.playersStates[PLAYER_INDEX].cards.map((element, index) => { */}
            {playersTiles.map((element, index) => {
                return <Draggable
                    key={index}
                    bounds="#draggableContainer"
                    onDrag={(e, data) => { eventLogger(e, data, index) }}
                    onStop={(e, data) => { eventStop(e, data, index) }}
                    // nodeRef={nodeRef}
                    position={controlledPositions[index]}
                >
                    <div style={{ zIndex: 10000000, position: 'absolute', cursor: 'pointer' }}>
                        <GameTileSpace card={element} width={sizes.svgWidth} height={sizes.svgHeight}
                            highlighted={false} boardFieldType={BoardFieldType.CARD}
                        />
                    </div>
                </Draggable>
            })}
        </div>
    )
}

export default GameBoard;
