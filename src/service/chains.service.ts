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

export class ChainsService {
  getChains = (env: ChainEnv): Chain[] => {
    if (env === ChainEnv.TESTNET) {
      return CHAINS.filter((chain) => chain.testnet)
    }

    return CHAINS.filter((chain) => !chain.testnet)
  }

  getChainNames = async () => {
    const result = await fetchWrapper.get<AvailableChainsResponseDto>(
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_chains`
    )
    return typeof result === 'string' ? [] : result.Chains
  }

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

  private getPoolAddress = (args: { data: TssPubkeyDto; chain: Chain }) => {
    const { chain, data } = args

    let poolAddress = ''
    if (chain.shortName === ChainName.TRON) {
      poolAddress = toTronAddress(data.ecdsa)
    } else if (chain.compatibility === ChainCompatibility.EVM) {
      poolAddress = data.ecdsa
    } else if (chain.compatibility === ChainCompatibility.SOL) {
      poolAddress = data.eddsa
    } else {
      // unknown address type
    }

    return poolAddress
  }

  getPoolBalances = async (): Promise<PoolBalanceDto[]> => {
    const result = await fetchWrapper.get<PoolBalanceResponseDto>(
      `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/pool_balance`
    )
    return typeof result === 'string' ? [] : result.poolBalance
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
}

const chainsService = new ChainsService()
export default chainsService
