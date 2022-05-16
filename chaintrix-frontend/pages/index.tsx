import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../components/Home.module.css';
import { useState } from 'react';
// import { GameState } from 'chaintrix-game-mechanics';
import { GameState, getNewGameState } from '../../chaintrix-game-mechanics/dist';
import GameWrapper from '../components/GameWrapper';

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Chaintrix</title>
        <meta name="description" content="Tantrix on blockchains" />
        <link rel="icon" href="/tiles/Tantrix_tile_3.svg" />
      </Head>

      <main className={styles.main}>
        {/* <ReduxTesting /> */}
        <GameWrapper />
      </main>
    </div>
  )
}

export default Home
