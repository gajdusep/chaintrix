import type { NextPage } from 'next'
import Head from 'next/head'
import GameBoard from '../components/GameBoard';
import styles from '../components/Home.module.css';
import OponentsBanner from '../components/OponentsBanner';
import SmartContractTesting from '../components/SmartContractTesting';
import SocketTesting from '../components/SocketTesting';
import SolanaAndSocket from '../components/SolanaAndSocket';
import { useState } from 'react';
// import { GameState } from 'chaintrix-game-mechanics';
import { GameState } from '../../chaintrix-game-mechanics/dist';

const Home: NextPage = () => {
  const [gameState, setGameState] = useState<GameState>(new GameState());
  const newGameState = new GameState();
  console.log(JSON.stringify(newGameState.playersStates))

  return (
    <div className={styles.container}>
      <Head>
        <title>Chaintrix</title>
        <meta name="description" content="Tantrix on blockchains" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div style={{ display: 'flex', width: `100%`, justifyContent: 'center' }}>
          <div>
            <GameBoard />
          </div>
          <div>
            <OponentsBanner game={gameState} />
          </div>
        </div>
        {/* <SocketTesting /> */}
        {/* <SolanaAndSocket /> */}
        {/* <SmartContractTesting /> */}

      </main>
    </div>
  )
}

export default Home
