import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { LOCALHOST_SOLANA_ENDPOINT, PRODUCTION_SOLANA_ENDPOINT } from '../helpers/Constants';

require('@solana/wallet-adapter-react-ui/styles.css');

const AppWrapper = ({ Component, pageProps }: AppProps) => {
  // const endpoint = useMemo(() => PRODUCTION_SOLANA_ENDPOINT, []);
  const endpoint = useMemo(() => LOCALHOST_SOLANA_ENDPOINT, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({})
    ],
    []
  );

  // to avoid NextJS server/client render error message
  const [isSSR, setIsSSR] = useState(true);
  useEffect(() => {
    setIsSSR(false);
  }, []);

  return (
    <Provider store={store}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            {!isSSR && <Component {...pageProps} />}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </Provider>
  );
}

export default AppWrapper
