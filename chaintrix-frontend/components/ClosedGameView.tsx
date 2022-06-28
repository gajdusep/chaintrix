import React, { useEffect, useState } from 'react'
import {
    Board, calculateSizes, cutBorders, deserializeGame, deserializeMoves,
    getBoardFromMoves, getBoardHeight, getBoardWidth, getHexPositionFromIndeces, PlayerState, Sizes
} from 'chaintrix-game-mechanics';
import GameTileSpace from './GameTileSpace';
import styles from '../components/GameBoard.module.css'
import { SolanaClosedGame } from './GamesHistory';

interface ClosedGameProps {
    solanaGame: SolanaClosedGame
}

const WIDTH = 250
const HEIGHT = 200
const ClosedGameView = (props: ClosedGameProps) => {

    const [board, setBoard] = useState<Board | null>(() => null);
    const [reason, setReason] = useState<string>(() => "");
    const [playerStates, setPlayerStates] = useState<Array<PlayerState>>(() => [])
    const [sizes, setSizes] = useState<Sizes | null>(() => null);
    useEffect(() => {
        async function fetchMyAPI() {
            try {
                let response = await fetch(`https://arweave.net/${props.solanaGame.arweave}`)
                response = await response.json()
                // console.log(`fetched ${JSON.stringify(response)}`)

                const { moves, playerStates, gameClosedReason } = deserializeGame(JSON.stringify(response))
                setReason(gameClosedReason)
                setPlayerStates(playerStates)
                let newBoard = getBoardFromMoves(moves)
                newBoard = cutBorders(newBoard)
                const newSizes: Sizes = calculateSizes(
                    getBoardWidth(newBoard), getBoardHeight(newBoard),
                    WIDTH, HEIGHT, 0, false
                )
                setBoard(newBoard)
                setSizes(newSizes)
            } catch (error) {
                // TODO: warn user that this game is invalid...
                console.log(error)
            }
        }

        fetchMyAPI()
    }, [props.solanaGame])

    const getShorterAddress = (address: string) => {
        const beg = 4
        const end = 4
        const fillText = '...'
        if (address.length < beg + end + fillText.length) {
            return address;
        }
        return address.substring(0, beg) + fillText + address.substring(address.length - end);
    }

    const classByColorMapping: { [color: string]: string } = {
        'R': styles.redPlayer,
        'B': styles.bluePlayer,
        'G': styles.greenPlayer,
        'Y': styles.yellowPlayer,
    }

    const isWinnerStyle = (index: number): string => {
        if (props.solanaGame.winnerIndex == index || props.solanaGame.winnerIndex == 255) {
            return " history-winner-div "
        }
        else {
            return ""
        }
    }

    return (
        <div className='history-closed-game-view-wrapper flex-column center-items' key={props.solanaGame.arweave}>
            {/* <a target="_blank" rel="noopener noreferrer" href={`https://arweave.net/${props.arweave}`}>
                Arweave link
            </a> */}
            <p className='consolas'>{getShorterAddress(props.solanaGame.accountId)}</p>
            <p>Reason: {reason}</p>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div className={
                    classByColorMapping[playerStates[0]?.color] +
                    isWinnerStyle(0) + " margin-padding rounded"
                }>
                    <div className='flex-column center-items margin-padding'>
                        Player 0:
                        <p className='consolas'>{getShorterAddress(props.solanaGame.player0)}</p>
                    </div>
                </div>
                <div className={
                    classByColorMapping[playerStates[1]?.color] +
                    isWinnerStyle(1) + " margin-padding rounded"
                }>
                    <div className='flex-column center-items margin-padding'>
                        Player 1:
                        <p className='consolas'>{getShorterAddress(props.solanaGame.player1)}</p>
                    </div>
                </div>
            </div>
            {board && sizes &&
                <div style={{
                    height: `${HEIGHT}px`,
                    width: `${WIDTH}px`,
                    position: 'relative'
                }}>
                    {board.boardCards.map((object, i) => {
                        return object.map((object2, j) => {
                            return <div key={`${i}-${j}`}
                                className={styles.hex}
                                draggable='false'
                                style={{
                                    top: getHexPositionFromIndeces(i, j, board.parity, sizes).x,
                                    left: getHexPositionFromIndeces(i, j, board.parity, sizes).y
                                }}
                            >
                                <GameTileSpace card={object2} width={sizes.svgWidth} height={sizes.svgHeight}
                                    highlighted={false} boardFieldType={board.boardFieldsTypes[i][j]}
                                    showOnlyCards={true}
                                />
                            </div>
                        })
                    })}
                </div>
            }
        </div>
    )
}

export default ClosedGameView;
