import React, { useEffect, useState } from 'react'
import { Board, calculateSizes, deserializeMoves, getBoardFromMoves, getBoardHeight, getBoardWidth, getHexPositionFromIndeces, Sizes } from '../../chaintrix-game-mechanics/dist';
import GameTileSpace from './GameTileSpace';
import styles from '../components/GameBoard.module.css'

interface ClosedGameProps {
    arweave: string,
    winnerIndex: any,
    player0: string,
    player1: string
}

const WIDTH = 300
const HEIGHT = 200
const ClosedGameView = (props: ClosedGameProps) => {

    const [board, setBoard] = useState<Board | null>(null);
    const [sizes, setSizes] = useState<Sizes | null>(null);
    useEffect(() => {
        async function fetchMyAPI() {
            try {
                let response = await fetch(`https://arweave.net/${props.arweave}`)
                response = await response.json()
                console.log(`fetched ${JSON.stringify(response)}`)

                const newBoard = getBoardFromMoves(deserializeMoves(JSON.stringify(response)))
                console.log(newBoard.boardCards)
                const newSizes: Sizes = calculateSizes(
                    getBoardWidth(newBoard), getBoardHeight(newBoard),
                    WIDTH, HEIGHT, 0
                )
                setBoard(newBoard)
                setSizes(newSizes)
            } catch (error) {
            }
        }

        fetchMyAPI()
    }, [props.arweave])


    return (
        <div style={{
            backgroundColor: 'beige',
            margin: 10, padding: 10,
            display: 'flex',
            flexDirection: 'column'
        }} key={props.arweave}>
            <a target="_blank" rel="noopener noreferrer" href={`https://arweave.net/${props.arweave}`}>
                Arweave link
            </a>
            <p>Winner: player {props.winnerIndex}</p>
            <p>Player 0: {JSON.stringify(props.player0)}</p>
            <p>Player 1: {JSON.stringify(props.player1)}</p>
            {board && sizes &&
                <div style={{
                    height: `${HEIGHT}px`,
                    width: `${WIDTH}px`,
                    position: 'relative',
                    // backgroundColor: 'white'
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
