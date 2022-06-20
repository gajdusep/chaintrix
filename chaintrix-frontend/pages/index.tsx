import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../components/Home.module.css';
import GameWrapper from '../components/GameWrapper';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import GamesHistory from '../components/GamesHistory';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { initHederaAsync, selectHederaConnectService, selectHederaStatus } from '../store/hederaSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home: NextPage = () => {
  const dispatch = useAppDispatch();

  // HEDERA VARS
  const hashConnectService = useAppSelector(selectHederaConnectService)
  const hederaStatus = useAppSelector(selectHederaStatus)

  useEffect((): any => {
    const runHederaConnectEffect = async () => {
      dispatch(initHederaAsync())
    }
    runHederaConnectEffect()
  }, []);

  return (
    <Router>
      <div className={styles.container}>
        <div className={styles.main}>
          <Head>
            <title>Chaintrix</title>
            <meta name="description" content="Tantrix on blockchains" />
            <link rel="icon" href="/tiles/Tantrix_tile_3.svg" />
          </Head>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<GameWrapper />} />
            <Route path="/games/*" element={<GamesHistory />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default Home
