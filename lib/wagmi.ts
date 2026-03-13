// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet],
  connectors: [injected(), coinbaseWallet({ appName: 'My App' })],
  transports: { [mainnet.id]: http() },
})