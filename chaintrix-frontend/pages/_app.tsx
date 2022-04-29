import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { Provider } from 'react-redux';
import { store } from '../store/store';

require('@solana/wallet-adapter-react-ui/styles.css');

const MyApp = ({ Component, pageProps }: AppProps) => {
  // const endpoint = useMemo(() => 'https://solana-api.projectserum.com', []);
  const endpoint = useMemo(() => 'http://127.0.0.1:8899', []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // new SolflareWalletAdapter({ })
    ],
    []
  );

  return (
    <Provider store={store}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>

          <WalletModalProvider>
            {typeof window === 'undefined' ? null : <Component {...pageProps} />}
            {/* <Component  {...pageProps} /> */}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </Provider>
  );
}

export default MyApp
