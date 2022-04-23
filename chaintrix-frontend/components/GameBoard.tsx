import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../components/Hexagons.module.css'

import Draggable, { DraggableData, DraggableEvent, DraggableEventHandler } from 'react-draggable'; // The default
import { useEffect, useState } from 'react';
import GameTileSpace from './GameTileSpace'
import { CARDS } from 'chaintrix-game-mechanics';
import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition
} from 'chaintrix-game-mechanics';
import React from 'react'

const getRandomCard = (): Card => {
    const someCardID = (Math.floor(Math.random() * (6 - 1 + 1)) + 1).toString();
    // const someCardID = "4"

    const someCard: Card = {
        cardID: someCardID,
        pattern: CARDS[someCardID],
        orientation: 0,
    }
    return someCard;
}

type GameBoardProps = {
}

const initialWidth = 500
const initialHeight = 600
const GameBoard = (
    props: GameBoardProps
) => {
    const [tileHovered, setTileHovered] = useState<Coords | null>(null);
    const [board, setBoard] = useState<Board>(() => { return new Board() })
    const [sizes, setSizes] = useState<Sizes>(() => calculateSizes(board.width, board.height, initialWidth, initialHeight))
    const [hexPositions, setHexPositions] = useState<Array<HexPosition>>(() => getHexPositions(board, sizes))
    const [playersTiles, setPlayersTiles] = useState<Array<Card>>([]);
    const [playerTilesMoving, setPlayerTilesMoving] = React.useState(Array(6).fill(false));
    const nodeRef = React.useRef(null);
    const blbostRef = React.useRef(null);
    const containerRef = React.useRef(null)

    const [controlledPositions, setControlledPositions] = useState<Array<Coords>>(() => calculatePlayersTilesPositions(sizes));

    useEffect(() => {
        // const freshBoard = new Board()
        // setBoard(freshBoard)
        // setHexPositions(getHexPositions(board, sizes));

        const newTiles = []
        for (let i = 0; i < 6; i++) {
            newTiles.push(getRandomCard())
        }
        setPlayersTiles(newTiles)
        console.log(newTiles)
    }, [])

    useEffect(() => {
        console.log(`sizes changed?: ${JSON.stringify(sizes)}`)
        if (!board) return;
        setHexPositions(getHexPositions(board, sizes))
        setControlledPositions(calculatePlayersTilesPositions(sizes));
    }, [sizes])

    const translateDraggableData = (data: DraggableData): Coords => {
        return {
            x: data.y,
            y: data.x
        }
    }

    const eventLogger = (e: DraggableEvent, data: DraggableData, index: number) => {
        if (!board) return;
        playerTilesMoving[index] = true;
        // setControlledPosition({ x: data.x, y: data.y })
        const translatedData = translateDraggableData(data)
        setTileHovered(null)
        for (let i = 0; i < hexPositions.length; i++) {
            const element = hexPositions[i].xyPosition;
            const x = translatedData.x
            const y = translatedData.y
            if (Math.abs(x - element.x) < sizes.maxDist && Math.abs(y - element.y) < sizes.maxDist) {
                const tileFieldType = board.boardFieldsTypes[hexPositions[i].ijPosition.x][hexPositions[i].ijPosition.y]
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
            playersTiles[index].orientation = (playersTiles[index].orientation + 1) % 6
            console.log(`clicked, ${playersTiles[index].orientation}`)
            setPlayersTiles(playersTiles.map(el => Object.assign(el)))
            return;
        }

        playerTilesMoving[index] = false;
        for (let i = 0; i < hexPositions.length; i++) {
            const element = hexPositions[i].xyPosition;
            const x = translatedData.x
            const y = translatedData.y
            if (Math.abs(x - element.x) < sizes.maxDist && Math.abs(y - element.y) < sizes.maxDist) {
                if (!board) return;
                const tileFieldType = board.boardFieldsTypes[hexPositions[i].ijPosition.x][hexPositions[i].ijPosition.y]
                if (tileFieldType == BoardFieldType.GUARDED ||
                    tileFieldType == BoardFieldType.UNREACHABLE ||
                    tileFieldType == BoardFieldType.CARD) {
                    return;
                }
                const isValid = board.checkValidity(playersTiles[index], hexPositions[i].ijPosition.x, hexPositions[i].ijPosition.y)
                console.log(`checked validity: ${isValid}`)

                if (!isValid) return;

                // setControlledPosition({ x: element.y - sizes.middle, y: element.x - sizes.middle })
                // setTileHovered(hexPositions[i].ijPosition)
                board.addCardToBoard(playersTiles[index], hexPositions[i].ijPosition.x, hexPositions[i].ijPosition.y)
                playersTiles[index] = getRandomCard()
                setPlayersTiles(playersTiles.map(el => Object.assign(el)))

                // TODO: size
                setSizes(calculateSizes(board.width, board.height, initialWidth, initialHeight))
                console.log(`board: ${board.width}, ${board.height}`)
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
            style={{ height: `${sizes.boardHeight}px`, width: `${sizes.boardWidth}px`, position: 'absolute', backgroundColor: 'white' }}>
            {board && board.boardCards.map((object, i) => {
                return object.map((object2, j) => {
                    return <div key={`${i}-${j}`} className={styles.hex}
                        draggable='false'
                        style={{ top: getTilePosition(i, j, board.parity, sizes).x, left: getTilePosition(i, j, board.parity, sizes).y }}>
                        <GameTileSpace card={object2} width={sizes.svgWidth} height={sizes.svgHeight}
                            highlighted={isHighlighted(i, j)}
                            boardFieldType={board.boardFieldsTypes[i][j]}
                        />
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
