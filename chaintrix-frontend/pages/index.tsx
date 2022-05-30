import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../components/Home.module.css';
import GameWrapper from '../components/GameWrapper';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import GamesHistory from '../components/GamesHistory';

const Home: NextPage = () => {
  return (
    <Router>
      <div className={styles.container}>
        <div className={styles.main}>
          <Head>
            <title>Chaintrix</title>
            <meta name="description" content="Tantrix on blockchains" />
            <link rel="icon" href="/tiles/Tantrix_tile_3.svg" />
          </Head>
          <Routes>
            <Route path="/" element={<GameWrapper />} />
            <Route path="/blbost" element={<div />} />
            <Route path="/games/*" element={<GamesHistory />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default Home
