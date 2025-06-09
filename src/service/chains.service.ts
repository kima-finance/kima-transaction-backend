import { CHAINS } from '../data/chains'
import { fetchWrapper } from '../fetch-wrapper'
import {
  Chain,
  ChainCompatibility,
  ChainLocation,
  chainLocationSchema,
  FilterConfig
} from '../types/chain'
import { ChainEnv } from '../types/chain-env'
import { ChainName } from '../types/chain-name'
import { TssPubkeyResponseDto } from '../types/tss-pubkey-response.dto'
import { PoolDto } from '../types/pool.dto'
import { fromHex as toTronAddress } from 'tron-format-address'
import { AvailableChainsResponseDto } from '../types/available-chains-response.dto'
import { AvailableCurrenciesResponseDto } from '../types/available-currencies-response.dto'
import { TssPubkeyDto } from '../types/tss-pubkey.dto'
import { PoolBalanceDto } from '../types/pool-balance.dto'
import { PoolBalanceResponseDto } from '../types/pool-balance-response.dto'
import { TokenDto } from '../types/token.dto'
import { TokenAmount } from '../types/token-amount.dto'
import { parseUnits } from 'viem'
import { ENV } from '../env-validate'
import { ChainFilter } from './chain-fiter'
import { ChainDto } from '../types/chain.dto.'
import { defineCached } from '../utils/cache'

export class ChainsService {
  filters: Record<ChainLocation, ChainFilter>
  allChainsMap: Map<ChainName, Chain>

  constructor(
    private readonly env: ChainEnv,
    chainFilter: FilterConfig | undefined
  ) {
    this.allChainsMap = new Map(
      this.getLocalChainData().map((c) => [c.shortName as ChainName, c])
    )
    this.filters = {
      origin: new ChainFilter(this.allChainsMap, 'origin', chainFilter?.origin),
      target: new ChainFilter(this.allChainsMap, 'target', chainFilter?.target)
    }
    void this.initFilters()
  }

  private initFilters = async () => {
    const chains = await this.getMergedChainData()
    await this.updateFilters(chains)
  }

  private updateFilters = async (chains: Chain[]) => {
    // sync the chain filters with the updated chain data
    // a disabled chain is still supported just not right now, handle this case separately in validation
    this.allChainsMap = new Map(
      chains.map((c) => [c.shortName as ChainName, c])
    )

    this.filters['origin'].allChainsMap = this.allChainsMap
    this.filters['target'].allChainsMap = this.allChainsMap
  }

  fetchChains = async (): Promise<ChainDto[]> => {
    const response = await fetchWrapper.get<{ Chain: ChainDto[] }>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/chain`
    )
    return typeof response === 'string' ? [] : response.Chain
  }

  /**
   * Get the static list of chain data for testnet or mainnet
   *
   * @returns {Chain[]}
   */
  getLocalChainData = (): Chain[] => {
    // get only testnet or mainnet chains
    // the chain will have the isTestnet property only if it is a testnet chain
    return CHAINS.filter((chain) =>
      this.env == ChainEnv.MAINNET ? !chain.testnet : chain.testnet === true
    )
  }

  mergeChainData = async (): Promise<Chain[]> => {
    // merge the local chain data with the remote chain data to as chains can be dynamically enabled/disabled
    const remoteData = await this.fetchChains()
    const localData = this.getLocalChainData()

    // TODO: it should look for chains in the remote data that are not in the local data
    // but in order to add the Viem chain data the remote data needs to be updated
    // to include the chainId or, even better, the remote data should include the Viem chain data

    const mergedChains = localData.map((chain) => {
      const remoteChain = remoteData.find((c) => c.symbol === chain.shortName)
      if (!remoteChain) return chain

      return {
        ...chain,
        disabled: remoteChain.disabled,
        derivationAlgorithm: remoteChain.derivationAlgorithm,
        isEvm: remoteChain.isEvm,
        supportedTokens: remoteChain.tokens.map((t) => ({
          ...t,
          decimals: parseInt(t.decimals)
        }))
      }
    })

    this.updateFilters(mergedChains)

    return mergedChains
  }

  getMergedChainData = defineCached(
    'getMergedChainData',
    this.mergeChainData,
    300 // cache for 5 minutes
  )

  /**
   * Get the static chain data for the given chain short name
   *
   * @param {ChainEnv} env
   * @param {ChainName} symbol
   * @returns {(Chain | undefined)}
   */
  getChain = async (symbol: ChainName): Promise<Chain | undefined> => {
    const chains = await this.getMergedChainData()
    return chains.find((c) => c.shortName === symbol)
  }

  /**
   * Get a list of supported chain short names
   *
   * @async
   * @returns {string[]}
   */
  getChainNames = async () => {
    const result = await fetchWrapper.get<AvailableChainsResponseDto>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_chains`
    )
    return typeof result === 'string' ? [] : result.Chains
  }

  /**
   * Get the available tokens when a transaction between the given orgin and target chains
   *
   * @async
   * @param {{
   *     originChain: string
   *     targetChain: string
   *   }} args
   * @returns {string[]}
   */
  getAvailableCurrencies = async (args: {
    originChain: string
    targetChain: string
  }) => {
    const { originChain, targetChain } = args
    const result = await fetchWrapper.get<AvailableCurrenciesResponseDto>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_currencies/${originChain}/${targetChain}`
    )
    return typeof result === 'string' ? [] : result.Currencies
  }

  /**
   * Get a list of Kima pool addresses
   * TODO: replace with the Kima API endpoint when implemented
   *
   * @async
   * @returns {Promise<PoolDto[]>}
   */
  getPools = async (): Promise<PoolDto[]> => {
    const pubKeyResult = await this.getTssPubkeys()
    if (typeof pubKeyResult === 'string') {
      throw new Error('Failed to get TSS public keys')
    }
    const [pubKeys] = pubKeyResult.tssPubkey

    const [chains, poolBalances] = await Promise.all([
      this.getLocalChainData(),
      this.getPoolBalances()
    ])

    const pools = chains.map((chain) => {
      const poolAddress = this.getPoolAddress({ data: pubKeys, chain })
      const poolInfo = poolBalances.find((b) => b.chainName === chain.shortName)

      return {
        chainName: chain.shortName,
        poolAddress,
        balance: poolInfo?.balance ?? [],
        nativeGasAmount: poolInfo?.nativeGasAmount ?? ''
      } satisfies PoolDto
    })

    return pools
  }

  /**
   * Extract the pool address for a chain from the TSS public keys
   */
  private getPoolAddress = (args: { data: TssPubkeyDto; chain: Chain }) => {
    const { chain, data } = args

    let poolAddress = ''
    if (chain.shortName === ChainName.TRON) {
      poolAddress = toTronAddress(data.ecdsa)
    } else if (chain.compatibility === ChainCompatibility.EVM) {
      poolAddress = data.ecdsa
    } else if (chain.shortName === ChainName.SOLANA) {
      poolAddress = data.eddsa
    } else {
      // unknown address type
    }

    return poolAddress
  }

  /**
   * Get the pool balance for all chains
   *
   * @async
   * @returns {Promise<PoolBalanceDto[]>}
   */
  getPoolBalances = async (): Promise<PoolBalanceDto[]> => {
    const result = await fetchWrapper.get<PoolBalanceResponseDto>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/pool_balance`
    )
    return typeof result === 'string' ? [] : result.poolBalance
  }

  /**
   * Get the token data for the given chain and token symbol
   *
   * @param {string} chainName
   * @param {string} tokenSymbol
   * @returns {(TokenDto | undefined)}
   */
  getToken = async (
    chainName: string,
    tokenSymbol: string
  ): Promise<TokenDto | undefined> => {
    const chain = await this.getChain(chainName as ChainName)
    if (!chain) {
      throw new Error(`Chain ${chainName} not found`)
    }
    return chain.supportedTokens.find((t) => t.symbol === tokenSymbol)
  }

  /**
   * Get the Kima TSS public keys.
   *
   * @async
   * @returns {TssPubkeyResponseDto}
   */
  getTssPubkeys = async (): Promise<TssPubkeyResponseDto | string> => {
    const result = await fetchWrapper.get<TssPubkeyResponseDto>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/kima/tss_pubkey`
    )
    return result
  }

  isDisabledChain = async (chainShortName: ChainName): Promise<boolean> => {
    const chain = await this.getChain(chainShortName)
    return chain?.disabled ?? false
  }

  isSupportedChain = (
    chainShortName: string,
    location: ChainLocation
  ): boolean => {
    return this.filters[location].isSupportedChain(chainShortName)
  }

  supportedChains = async (): Promise<Chain[]> => {
    // supported chains are a combination of the chains supported by Kima
    // and the local chain filters
    // chains temporarily disabled by Kima are still supported
    // and should be shown in the UI as greyed out
    const chainLocations = chainLocationSchema.options
    const chains = await this.getMergedChainData()
    return chains
      .map((chain) => {
        return {
          ...chain,
          supportedLocations: chainLocations.filter((location) =>
            this.isSupportedChain(chain.shortName, location)
          )
        }
      })
      .filter((chain) => chain.supportedLocations.length > 0)
  }

  /**
   * Convert a numeric amount to a token amount with decimals
   * @param {string} chainName
   * @param {string} tokenSymbol
   * @param {number | string} amount
   * @returns {TokenAmount}
   */
  toTokenDecimals = async (
    chainName: string,
    tokenSymbol: string,
    amount: number | string
  ): Promise<TokenAmount> => {
    const token = await this.getToken(
      chainName === 'FIAT' ? 'CC' : chainName,
      tokenSymbol
    )
    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found`)
    }
    return {
      amount: parseUnits(amount.toString(), Number(token.decimals)),
      decimals: Number(token.decimals)
    }
  }
}

const chainsService = new ChainsService(
  ENV.KIMA_ENVIRONMENT,
  ENV.KIMA_CHAIN_FILTER
)
export default chainsService
