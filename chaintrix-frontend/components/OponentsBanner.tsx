import React from 'react'
import GameTileSpace from './GameTileSpace'
import { useAppSelector } from '../store/hooks';
import {
    BoardFieldType, mod
} from '../../chaintrix-game-mechanics/dist/index.js';
// } from 'chaintrix-game-mechanics';
import {
    selectGameState, selectSizes,
    selectPlayerID
} from '../store/gameStateSlice';
import styles from '../components/GameBoard.module.css'

const initialWidth = 150
const initialHeight = 600
const OponentsBanner = () => {
    const gameState = useAppSelector(selectGameState);
    const sizes = useAppSelector(selectSizes);
    const playerID = useAppSelector(selectPlayerID)
    const containerRef = React.useRef(null)

    const classByColorMapping: { [color: string]: string } = {
        'R': styles.redPlayer,
        'B': styles.bluePlayer,
        'G': styles.greenPlayer,
        'Y': styles.yellowPlayer,
    }

    return (
        <div
            ref={containerRef}
            style={{
                height: `${initialHeight}px`,
                width: `${initialWidth}px`,
                border: `black 3px solid`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'centers'
            }}
            className={classByColorMapping[gameState.playersStates[mod(playerID + 1, 2)].color]}
        >
            <div className='glass'>Oponent's cards</div>
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
