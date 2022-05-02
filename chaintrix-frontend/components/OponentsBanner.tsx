import React from 'react'
import { useEffect, useState } from 'react';
import GameTileSpace from './GameTileSpace'
import { useAppSelector, useAppDispatch } from '../store/hooks';

import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    selectGameState, selectSizes
} from '../store/gameStateSlice';

const initialWidth = 100
const initialHeight = 600
const OponentsBanner = () => {
    const gameState = useAppSelector(selectGameState);
    const sizes = useAppSelector(selectSizes);
    const containerRef = React.useRef(null)

    return (
        <div
            id='draggableContainer'
            ref={containerRef}
            style={{
                height: `${initialHeight}px`,
                width: `${initialWidth}px`,
                position: 'absolute',
                backgroundColor: 'white',
                border: `black 3px solid`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'centers'

            }}>
            <p>COLOR: {gameState.playersStates[gameState.currentlyMoving].color}</p>
            {gameState.playersStates[gameState.currentlyMoving].cards.map((element, index) => {
                return (
                    <div style={{
                        zIndex: 10000000,
                        cursor: 'pointer',
                        flex: `1 auto`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <GameTileSpace card={element}
                            // width={sizes.svgWidth} height={sizes.svgHeight}
                            width={100}
                            height={80}
                            highlighted={false} boardFieldType={BoardFieldType.CARD}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export default OponentsBanner;
