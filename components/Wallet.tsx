import { useEnsName, useEnsAvatar } from 'wagmi'

function WalletButton () {
  const address = '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'

  const { data: ensName } = useEnsName({ address, chainId: 1 })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName!, chainId: 1 })

  return <img src={ensAvatar || ''} alt={ensName || address} />
}