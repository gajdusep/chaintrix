import React from 'react'
import { useEffect, useState } from 'react';
import GameTileSpace from './GameTileSpace'
import { useAppSelector, useAppDispatch } from '../store/hooks';

import {
    Board, BoardFieldType, Sizes, calculateSizes, getTilePosition,
    getHexPositions, calculatePlayersTilesPositions, Coords,
    CardNullable, Card, HexPosition, GameState, mod
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    selectGameState, selectSizes,
    selectPlayerID
} from '../store/gameStateSlice';

const initialWidth = 100
const initialHeight = 600
const OponentsBanner = () => {
    const gameState = useAppSelector(selectGameState);
    const sizes = useAppSelector(selectSizes);
    const playerID = useAppSelector(selectPlayerID)
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
            <p>Player color: {gameState.playersStates[playerID].color}</p>
            <p>Game state: pl {gameState.currentlyMovingPlayer}: phase {gameState.currentlyMovingPhase}</p>
            {gameState.playersStates[mod(playerID + 1, 2)].cards.map((element, index) => {
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
