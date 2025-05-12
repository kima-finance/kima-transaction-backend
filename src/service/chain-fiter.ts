import { ChainFilterConfig, ChainFilterMode } from '../types/chain'
import { ChainEnv } from '../types/chain-env'
import { ChainName } from '../types/chain-name'

export class ChainFilter {
  private readonly filterSet: Set<ChainName>
  readonly mode: ChainFilterMode

  constructor(
    private readonly env: ChainEnv,
    private readonly allChainsSet: Set<ChainName>,
    chainFilter: ChainFilterConfig
  ) {
    this.filterSet = new Set(chainFilter.chains)
    this.mode = chainFilter.mode
  }

  isSupportedChain = (chainShortName: string): boolean => {
    const isAvailable = this.allChainsSet.has(chainShortName as ChainName)
    if (!isAvailable) return false

    return this.mode === 'whitelist'
      ? this.filterSet.has(chainShortName as ChainName)
      : !this.filterSet.has(chainShortName as ChainName)
  }
}
