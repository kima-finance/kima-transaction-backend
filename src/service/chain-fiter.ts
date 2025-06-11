import {
  Chain,
  ChainFilterConfig,
  ChainFilterMode,
  ChainLocation
} from '../types/chain'
import { ChainName } from '../types/chain-name'

export class ChainFilter {
  private filterSet: Set<ChainName>
  readonly mode: ChainFilterMode

  constructor(
    public allChainsMap: Map<ChainName, Chain>,
    private readonly location: ChainLocation,
    chainFilter?: ChainFilterConfig
  ) {
    this.filterSet = chainFilter ? new Set(chainFilter.chains) : new Set()
    this.mode = chainFilter?.mode ?? 'blacklist'
  }

  isSupportedChain = (chainShortName: string): boolean => {
    const chain = this.allChainsMap.get(chainShortName as ChainName)
    if (!chain) return false

    const supportedLocation = chain.supportedLocations.includes(
      this.location as ChainLocation
    )
    if (!supportedLocation) return false

    return this.mode === 'whitelist'
      ? this.filterSet.has(chainShortName as ChainName)
      : !this.filterSet.has(chainShortName as ChainName)
  }
}
