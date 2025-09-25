import {
  Chain,
  ChainFilterConfig,
  ChainFilterMode,
  Location
} from '../types/chain'
import { ChainName } from '../types/chain-name'

class ChainFilter {
  private filterSet: Set<ChainName>
  readonly mode: ChainFilterMode

  constructor(
    public allChainsMap: Map<ChainName, Chain>,
    private readonly location: Location,
    chainFilter?: ChainFilterConfig
  ) {
    this.filterSet = chainFilter ? new Set(chainFilter.chains) : new Set()
    this.mode = chainFilter?.mode ?? 'blacklist'
  }

  isSupportedChain = (chainShortName: string): boolean => {
    const chain = this.allChainsMap.get(chainShortName as ChainName)
    if (!chain) return false

    const supportedLocation = chain.supportedLocations.includes(
      this.location as Location
    )
    if (!supportedLocation) return false

    return this.mode === 'whitelist'
      ? this.filterSet.has(chainShortName as ChainName)
      : !this.filterSet.has(chainShortName as ChainName)
  }
}

export default ChainFilter
