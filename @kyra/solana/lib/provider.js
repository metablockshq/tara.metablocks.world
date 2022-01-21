import React, { FC, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, TorusWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
// Default styles that can be overridden by your app
// require("@solana/wallet-adapter-react-ui/styles.css");
var Provider = function(param) {
    var children = param.children;
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    var network = WalletAdapterNetwork.Devnet;
    // You can also provide a custom RPC endpoint.
    var endpoint = useMemo(function() {
        return clusterApiUrl(network);
    }, [
        network
    ]);
    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    var wallets = useMemo(function() {
        return [
            new PhantomWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new SolletWalletAdapter({
                network: network
            }),
            new SolletExtensionWalletAdapter({
                network: network
            }), 
        ];
    }, [
        network
    ]);
    return(/*#__PURE__*/ React.createElement(ConnectionProvider, {
        endpoint: endpoint
    }, /*#__PURE__*/ React.createElement(WalletProvider, {
        wallets: wallets,
        autoConnect: true
    }, /*#__PURE__*/ React.createElement(WalletModalProvider, null, /*#__PURE__*/ React.createElement(WalletMultiButton, null), /*#__PURE__*/ React.createElement(WalletDisconnectButton, null), children))));
};
export default Provider;
