import { CHAINS } from '../data/chains'
import { fetchWrapper } from '../fetch-wrapper'
import { Chain, ChainCompatibility } from '../types/chain'
import { ChainEnv } from '../types/chain-env'
import { ChainName } from '../types/chain-name'
import { TssPubkeyResponseDto } from '../types/tss-pubkey-response.dto'
import { PoolDto } from '../types/pool.dto'
import { fromHex as toTronAddress } from 'tron-format-address'

export class ChainsService {
  getChains = (env: ChainEnv): Chain[] => {
    if (env === ChainEnv.TESTNET) {
      return CHAINS.filter((chain) => chain.testnet)
    }

    return CHAINS.filter((chain) => !chain.testnet)
  }

  /**
   * Get a list of Kima pool addresses
   * TODO: replace with the Kima API endpoint when implemented
   *
   * @async
   * @param {?ChainName} [chain] filter by chain name
   * @returns {Promise<PoolDto[]>}
   */
  getPools = async (chain?: ChainName): Promise<PoolDto[]> => {
    const pubKeyResult = await this.getTssPubkeys()
    if (typeof pubKeyResult === 'string') {
      throw new Error('Failed to get TSS public keys')
    }
    const [pubKeys] = pubKeyResult.tssPubkey

    let chains = this.getChains(process.env.KIMA_ENVIRONMENT as ChainEnv)
    if (chain) {
      chains = chains.filter((c) => c.shortName === chain)
    }

    const pools = chains.map((chain) => {
      let poolAddress = ''
      if (chain.shortName === ChainName.TRON) {
        poolAddress = toTronAddress(pubKeys.ecdsa)
      } else if (chain.compatibility === ChainCompatibility.EVM) {
        poolAddress = pubKeys.ecdsa
      } else if (chain.compatibility === ChainCompatibility.SOL) {
        poolAddress = pubKeys.eddsa
      } else {
        // unknown address type
      }
      return {
        chainName: chain.shortName,
        poolAddress
      }
    })

    return pools
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
