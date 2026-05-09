import React, { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import NotFound from './pages/NotFound';
import SignalForm from './pages/SignalForm';
import GapMap from './pages/GapMap';
import { Navigate } from 'react-router-dom';

import '@solana/wallet-adapter-react-ui/styles.css';

const App = () => {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <Routes>
                        <Route path="/" element={<Navigate to="/signals" replace />} />
                        <Route path="/signals" element={<SignalForm />} />
                        <Route path="/gaps" element={<GapMap />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;