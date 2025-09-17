import { CHAINS } from '../data/chains'
import fetchWrapper from '@shared/http/fetch'

import ChainFilter from './chain-filter'
import { ChainDto } from '../types/chain.dto'
import {
  Chain,
  ChainCompatibility,
  ChainLocation,
  chainLocationSchema,
  FilterConfig
} from '../types/chain'
import { ChainName } from '../types/chain-name'
import { ChainEnv } from 'core/types/chain-env'
import ENV from 'core/env'
import { AvailableChainsResponseDto } from '../types/available-chains-response.dto'
import { AvailableCurrenciesResponseDto } from '../types/available-currencies-response.dto'
import { PoolDto } from '../types/pool.dto'
import { TssPubkeyDto } from '../types/tss-pubkey.dto'
import { PoolBalanceDto } from '../types/pool-balance.dto'
import { PoolBalanceResponseDto } from '../types/pool-balance-response.dto'
import { TokenDto } from '../types/token.dto'
import { TssPubkeyResponseDto } from '../types/tss-pubkey-response.dto'
import { TokenAmount } from '../types/token-amount.dto'
import { parseUnits } from 'viem'
import toTronAddress from '@shared/crypto/tron'
import defineCached from '@shared/utils/cache'

class ChainsService {
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

  getLocalChainData = (): Chain[] => {
    const chains = CHAINS.filter((chain) =>
      this.env == ChainEnv.MAINNET ? !chain.testnet : chain.testnet === true
    )
    return chains
  }

  mergeChainData = async (): Promise<Chain[]> => {
    const remoteData = await this.fetchChains()
    const localData = this.getLocalChainData()

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
    300
  )

  getChain = async (symbol: ChainName): Promise<Chain | undefined> => {
    const chains = await this.getMergedChainData()
    return chains.find((c) => c.shortName === symbol)
  }

  getChainNames = async () => {
    const result = await fetchWrapper.get<AvailableChainsResponseDto>(
      `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_chains`
    )
    return typeof result === 'string' ? [] : result.Chains
  }

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

  private getPoolAddress = (args: { data: TssPubkeyDto; chain: Chain }) => {
    const { chain, data } = args

    if (chain.shortName === ChainName.TRON) return toTronAddress(data.ecdsa)
    if (chain.compatibility === ChainCompatibility.EVM) return data.ecdsa
    if (chain.shortName === ChainName.SOLANA) return data.eddsa

    return ''
  }

  getPoolBalances = async (): Promise<PoolBalanceDto[]> => {
    try {
      const result = await fetchWrapper.get<PoolBalanceResponseDto>(
        `${ENV.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/pool_balance`
      )
      return typeof result === 'string' ? [] : result.poolBalance
    } catch {
      throw new Error('Error getting pool balances...')
    }
  }

  getToken = async (
    chainName: string,
    tokenSymbol: string
  ): Promise<TokenDto | undefined> => {
    const chain = await this.getChain(chainName as ChainName)
    if (!chain) throw new Error(`Chain ${chainName} not found`)
    const token = chain.supportedTokens.find((t) => t.symbol === tokenSymbol)
    return token
  }

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
    const chainLocations = chainLocationSchema.options
    const chains = await this.getMergedChainData()
    return chains
      .map((chain) => ({
        ...chain,
        supportedLocations: chainLocations.filter((location) =>
          this.isSupportedChain(chain.shortName, location)
        )
      }))
      .filter((chain) => chain.supportedLocations.length > 0)
  }

  toTokenDecimals = async (
    chainName: string,
    tokenSymbol: string,
    amount: number | string
  ): Promise<TokenAmount> => {
    const token = await this.getToken(chainName, tokenSymbol)
    if (!token) throw new Error(`Token ${tokenSymbol} not found`)
    return {
      amount: parseUnits(amount.toString(), Number(token.decimals)),
      decimals: Number(token.decimals)
    }
  }
}

export default ChainsService
