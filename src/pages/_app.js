// https://nextjs.org/docs/advanced-features/custom-app
import "~/styles/tailwind.css";
import "~/styles/blueprint.css";

import SolanaWalletProvider from "@kyra/solana/lib/provider";
import Nav from "~/components/Nav";

function App({ Component, pageProps }) {
  return (
    <>
      <SolanaWalletProvider>
        <Nav />
        <Component {...pageProps} />
      </SolanaWalletProvider>
    </>
  );
}

export default App;
