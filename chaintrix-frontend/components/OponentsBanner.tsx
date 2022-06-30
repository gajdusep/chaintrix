import React from 'react'
import GameTileSpace from './GameTileSpace'
import { useAppSelector } from '../store/hooks';
import {
    BoardFieldType, mod
} from 'chaintrix-game-mechanics';
import {
    selectGameState, selectSizes,
    selectPlayerID
} from '../store/gameStateSlice';
import styles from '../components/GameBoard.module.css'

const initialWidth = 150
const initialHeight = 600
const cardWidth = 100
const cardHeight = 80
const OponentsBanner = () => {
    const gameState = useAppSelector(selectGameState);
    const playerID = useAppSelector(selectPlayerID)
    const containerRef = React.useRef(null)

    const classByColorMapping: { [color: string]: string } = {
        'R': styles.redPlayer,
        'B': styles.bluePlayer,
        'G': styles.greenPlayer,
        'Y': styles.yellowPlayer,
    }

    return (
        <div ref={containerRef}
            style={{ height: `${initialHeight}px`, width: `${initialWidth}px` }}
            className={'opponent-wrapper ' + classByColorMapping[gameState.playersStates[mod(playerID + 1, 2)].color]}
        >
            <div className='glass'>Oponent&apos;s cards</div>
            {gameState.playersStates[mod(playerID + 1, 2)].cards.map((element, index) => {
                return (
                    <div key={index} className='opponent-card-div'>
                        <GameTileSpace card={element}
                            width={cardWidth} height={cardHeight}
                            highlighted={false} boardFieldType={BoardFieldType.CARD}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export default OponentsBanner;
