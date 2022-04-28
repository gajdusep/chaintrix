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
    CardNullable, Card, HexPosition, GameState
} from '../../chaintrix-game-mechanics/dist/index.js';

import React from 'react'

type OponentsBannerProps = {
    game: GameState
}

const initialWidth = 200
const initialHeight = 600
const OponentsBanner = (
    props: OponentsBannerProps
) => {
    console.log(props.game.playersStates[0].cards)

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
    }, [])

    return (
        <div
            id='draggableContainer'
            ref={containerRef}
            style={{
                height: `${sizes.boardHeight}px`,
                width: `${sizes.boardWidth}px`,
                position: 'absolute',
                backgroundColor: 'white',
                border: `black 3px solid`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'centers'

            }}>
            <p>COLOR: {props.game.playersStates[props.game.currentlyMoving].color}</p>
            {props.game.playersStates[props.game.currentlyMoving].cards.map((element, index) => {
                return (
                    <div style={{ zIndex: 10000000, cursor: 'pointer', flex: `1 auto`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GameTileSpace card={element}
                            // width={sizes.svgWidth} height={sizes.svgHeight}
                            width={sizes.svgWidth} height={sizes.svgHeight}
                            highlighted={false} boardFieldType={BoardFieldType.CARD}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export default OponentsBanner;
