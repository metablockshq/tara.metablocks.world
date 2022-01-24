// https://nextjs.org/docs/advanced-features/custom-app
import "~/styles/tailwind.css";
import "~/styles/blueprint.css";
import "~/styles/app.css";

import SolanaWalletProvider from "@kyra/solana/provider";
import { SWRConfig } from "swr";
import Nav from "~/components/Nav";
import networkState from "~/domain/network";
import { useAtom } from "@kyra/hooks";

function App({ Component, pageProps }) {
  const { selectedNetworkId: network } = useAtom(networkState);
  return (
    <>
      <SolanaWalletProvider network={network}>
        <SWRConfig
          value={{
            fetcher: (...args) => fetch(...args).then((res) => res.json()),
          }}
        >
          <Nav />
          {/*Add top margin to clear Nav bar*/}
          <div style={{ marginTop: 50 }} className="p-4">
            <Component {...pageProps} />
          </div>
        </SWRConfig>
      </SolanaWalletProvider>
    </>
  );
}

export default App;
