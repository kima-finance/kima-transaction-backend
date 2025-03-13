import { isTestnet } from '../../constants'
import { ChainName } from '../../types/chain-name'
import chainsService from '../chains.service'
import { ChainClient } from './ChainClient'
import { EvmChainClient } from './EvmChainClient'
import { SolanaChainClient } from './SolanaClient'
import { TronChainClient } from './TronClient'

export const chainClients: Record<ChainName, ChainClient | null> = {
  [ChainName.ARBITRUM]: new EvmChainClient(chainsService, ChainName.ARBITRUM),
  [ChainName.AVALANCHE]: new EvmChainClient(chainsService, ChainName.AVALANCHE),
  [ChainName.BASE]: isTestnet
    ? new EvmChainClient(chainsService, ChainName.BASE)
    : null,
  [ChainName.BERA]: new EvmChainClient(chainsService, ChainName.BERA),
  [ChainName.BSC]: new EvmChainClient(chainsService, ChainName.BSC),
  [ChainName.ETHEREUM]: new EvmChainClient(chainsService, ChainName.ETHEREUM),
  [ChainName.OPTIMISM]: new EvmChainClient(chainsService, ChainName.OPTIMISM),
  [ChainName.POLYGON]: new EvmChainClient(chainsService, ChainName.POLYGON),
  [ChainName.SOLANA]: new SolanaChainClient(chainsService),
  [ChainName.TRON]: new TronChainClient(chainsService)
}

export const getChainClient = (chainName: ChainName): ChainClient => {
  const client = chainClients[chainName]
  if (!client) {
    throw new Error(`Chain with shortName ${chainName} not supported`)
  }
  return client
}
