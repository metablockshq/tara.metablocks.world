import {
  AnchorButton,
  InputGroup,
  NavbarDivider,
  Alignment,
  Button,
  Classes,
  Intent,
  Menu,
  MenuItem,
  Navbar,
  Position,
} from "@blueprintjs/core";
import { useMemo } from "react";
import { Popover2 } from "@blueprintjs/popover2";
import { Select, ItemRenderer } from "@blueprintjs/select";
import Link from "next/link";
import { useRouter } from "next/router";

import { networks } from "~/config";
import { retractMiddle } from "@kyra/utils/string";
import { useAtom } from "@kyra/hooks";
import { useWallet, useWalletModal } from "@kyra/solana/src/hooks";
import networkState, { switchNetwork } from "~/domain/network";

function SolanaConnectButton() {
  const { wallet, publicKey, connect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  return (
    <Button
      loading={connecting}
      intent={Intent.PRIMARY}
      onClick={() => !connected && setVisible(true)}
      icon="user"
      text="Connect wallet"
    />
  );
}

function ConnectedButton({}) {
  const { disconnect, publicKey } = useWallet();

  return (
    <Popover2
      content={
        <Menu>
          <MenuItem icon="log-out" onClick={disconnect} text="Disconnect" />
        </Menu>
      }
      position={Position.BOTTOM_RIGHT}
    >
      <Button
        icon="user"
        minimal={true}
        intent={Intent.PRIMARY}
        rightIcon="caret-down"
        text={publicKey && retractMiddle(publicKey.toString(), 6)}
      />
    </Popover2>
  );
}

function NetworkSelectPopover() {
  const { selectedNetwork } = useAtom(networkState);
  return (
    <Popover2
      content={
        <Menu>
          {networks.map((n) => (
            <MenuItem
              key={n.id}
              text={n.label}
              onClick={() => switchNetwork(n.id)}
            />
          ))}
        </Menu>
      }
      position={Position.BOTTOM_RIGHT}
    >
      <Button
        icon="globe-network"
        minimal={true}
        className="mr-2"
        rightIcon="caret-down"
        text={selectedNetwork.label}
      />
    </Popover2>
  );
}

function ViewNftsButton() {
  const text = "View NFTs";
  const icon = "settings";
  const href = "/view-nfts";
  const router = useRouter();
  const minimal = true;
  const onClick = (e) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <AnchorButton
      text={text}
      minimal={minimal}
      icon={icon}
      href="/view-nfts"
      disabled={router.pathname === href}
      onClick={onClick}
    />
  );
}

function Heading() {
  return (
    <Navbar.Heading className="font-bold">
      <Link href="/">
        <a className="hover:no-underline text-slate-800">Tara by Meta Blocks</a>
      </Link>
    </Navbar.Heading>
  );
}

function Nav() {
  const { wallet } = useWallet();

  return (
    <div className="">
      <Navbar fixedToTop>
        <Navbar.Group align={Alignment.LEFT}>
          <Heading />
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT} className="">
          <NetworkSelectPopover />
          {!wallet && <SolanaConnectButton />}
          {wallet && <ConnectedButton />}
        </Navbar.Group>
      </Navbar>
    </div>
  );
}

export default Nav;
