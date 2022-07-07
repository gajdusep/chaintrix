import React from 'react'
import { useAppSelector } from '../store/hooks';
import { selectGameState, selectSeconds, selectLengths } from '../store/gameStateSlice';
import styles from '../components/GameBoard.module.css'
import { selectBCState } from '../store/blockchainStateSlice';
import { COLORS_LIST } from '../helpers/Constants';

const initialWidth = 150
const initialHeight = 600
const GameInfoBanner = () => {
    const gameState = useAppSelector(selectGameState);
    const pathLengths = useAppSelector(selectLengths)
    const blockchainState = useAppSelector(selectBCState);
    const containerRef = React.useRef(null)

    const classByColorMapping: { [color: string]: string } = {
        'R': styles.redPlayer,
        'B': styles.bluePlayer,
        'G': styles.greenPlayer,
        'Y': styles.yellowPlayer,
    }
    const uxLength = (length: any): number => {
        if (length == null || !isFinite(length)) return 0;
        return length
    }
    const playersColors = COLORS_LIST.filter(item => gameState.playersStates.map(item => item.color).includes(item))
    const separationDivHeight = 30
    const seconds = useAppSelector(selectSeconds)
    return (
        <div ref={containerRef}
            style={{ height: `${initialHeight}px`, width: `${initialWidth}px` }}
            className='opponent-wrapper'
        >
            <div className='center-items flex-column'>
                <div>Longest paths</div>
                {playersColors.map((color) =>
                    <div
                        key={color}
                        className={`rounded font-x-large ${classByColorMapping[color]}`}
                        style={{ width: `95%`, margin: 5, padding: 5 }}
                    >
                        {color}: {uxLength(pathLengths[color])}
                    </div>
                )}
            </div>
            <div style={{ height: separationDivHeight }}></div>
            <div className='center-items flex-column'>
                <div>Cards in the deck</div>
                <div className='font-x-large'>{gameState.deck.length}</div>
            </div>
            <div style={{ height: separationDivHeight }}></div>
            <div className='center-items flex-column'>
                <div>Remaining time</div>
                <div className='font-x-large'>{seconds}s</div>
            </div>
            <div style={{ height: separationDivHeight }}></div>
            <div className='center-items flex-column'>
                <div>Blockchain type</div>
                <div className='font-large'>{blockchainState.blockchainType}</div>
            </div>
        </div>
    )
}

export default GameInfoBanner;
