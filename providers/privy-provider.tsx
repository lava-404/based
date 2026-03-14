"use client";

import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

if (!PRIVY_APP_ID && typeof window !== "undefined") {
  console.warn(
    "Missing NEXT_PUBLIC_PRIVY_APP_ID. Get one at https://dashboard.privy.io"
  );
}

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      appId={PRIVY_APP_ID ?? ""}
      config={{
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "light",
          showWalletLoginFirst: true,
          landingHeader: "Log in with wallet or email",
          loginMessage:
            "Connect your Ethereum wallet (e.g. MetaMask, WalletConnect) or use email. ENS names are supported.",
          walletList: [
            "metamask",
            "rainbow",
            "coinbase_wallet",
            "wallet_connect",
            "detected_ethereum_wallets",
          ],
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </Privy>
  );
}
