import { CHAINS } from '../data/chains'
import { fetchWrapper } from '../fetch-wrapper'
import { Chain, ChainCompatibility } from '../types/chain'
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

export class ChainsService {
  /**
   * Get the static list of chain data for testnet or mainnet
   *
   * @param {ChainEnv} env
   * @param {?ChainName} [symbol]
   * @returns {Chain[]}
   */
  getChains = (env: ChainEnv, symbol?: ChainName): Chain[] => {
    // get only testnet or mainnet chains
    // the chain will have the isTestnet property only if it is a testnet chain
    const isTestnet = env === ChainEnv.TESTNET
    const upperCaseSymbol = symbol?.toUpperCase()
    return CHAINS.filter(
      (chain) =>
        (chain.testnet === isTestnet || !isTestnet) &&
        (!upperCaseSymbol || chain.shortName === upperCaseSymbol)
    )
  }

  /**
   * Get the static chain data for the given chain short name
   *
   * @param {ChainEnv} env
   * @param {ChainName} symbol
   * @returns {(Chain | undefined)}
   */
  getChain = (env: ChainEnv, symbol: ChainName): Chain | undefined => {
    const [chain] = this.getChains(env, symbol)
    return chain
  }

  /**
   * Get a list of supported chain short names
   *
   * @async
   * @returns {string[]}
   */
  getChainNames = async () => {
    const result = await fetchWrapper.get<AvailableChainsResponseDto>(
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_chains`
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
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_currencies/${originChain}/${targetChain}`
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
      this.getChains(process.env.KIMA_ENVIRONMENT as ChainEnv),
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
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/pool_balance`
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
  getToken = (chainName: string, tokenSymbol: string): TokenDto | undefined => {
    const chain = this.getChain(
      process.env.KIMA_ENVIRONMENT as ChainEnv,
      chainName as ChainName
    )
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
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/kima/tss_pubkey`
    )
    return result
  }

  /**
   * Convert a numeric amount to a token amount with decimals
   * @param {string} chainName
   * @param {string} tokenSymbol
   * @param {number | string} amount
   * @returns {TokenAmount}
   */
  toTokenDecimals = (
    chainName: string,
    tokenSymbol: string,
    amount: number | string
  ): TokenAmount => {
    const token = this.getToken(chainName, tokenSymbol)
    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found`)
    }
    return {
      amount: parseUnits(amount.toString(), token.decimals),
      decimals: token.decimals
    }
  }
}

const chainsService = new ChainsService()
export default chainsService
