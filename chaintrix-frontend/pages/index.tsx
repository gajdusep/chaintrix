import type { NextPage } from 'next'
import Head from 'next/head'
import GameBoard from '../components/GameBoard';
import styles from '../components/Home.module.css';
import SmartContractTesting from '../components/SmartContractTesting';
import SocketTesting from '../components/SocketTesting';
import SolanaAndSocket from '../components/SolanaAndSocket';

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Chaintrix</title>
        <meta name="description" content="Tantrix on blockchains" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {/* <GameBoard /> */}
        {/* <SocketTesting /> */}
        <SolanaAndSocket />
        {/* <SmartContractTesting /> */}

      </main>
    </div>
  )
}

export default Home
