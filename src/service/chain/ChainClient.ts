import { Chain } from '../../types/chain'
import { ChainEnv } from '../../types/chain-env'
import { ChainName } from '../../types/chain-name'
import { ChainsService } from '../chains.service'

export interface ITransferFromInput {
  amount: number
  originAddress: string
  originSymbol: string
}

/**
 * Chain agnostic client
 */
export interface ChainClient {
  chain: Chain
  getPoolAddress(): Promise<string>
  simulateTransferFrom(inputs: ITransferFromInput): Promise<SimulationResult>
}

export interface SimulationResult {
    success: boolean
    message: string
}

export abstract class ChainClientBase implements ChainClient {
  chain: Chain
  chainEnv: ChainEnv
  protected _poolAddress = ''
  protected _chainService: ChainsService

  constructor(
    chainService: ChainsService,
    chainName: ChainName,
    chainEnv = process.env.KIMA_ENVIRONMENT as ChainEnv
  ) {
    this._chainService = chainService
    this.chainEnv = chainEnv
    const chain = this._chainService.getChain(chainEnv, chainName)
    if (!chain) {
      throw new Error(`Chain ${chainName} not found`)
    }
    this.chain = chain
  }

  async getPoolAddress(): Promise<string> {
    // assumption: pool address is the same for all tokens on the same chain
    if (this._poolAddress) {
      return this._poolAddress
    }

    const tssPubkyes = await this._chainService.getTssPubkeys()
    if (typeof tssPubkyes === 'string') {
      throw new Error('Failed to get TSS public keys')
    }
    const [pubKeys] = tssPubkyes.tssPubkey
    this._poolAddress = this._chainService.getPoolAddress({
      data: pubKeys,
      chain: this.chain
    })

    return this._poolAddress
  }

  abstract simulateTransferFrom(inputs: ITransferFromInput): Promise<SimulationResult>
}
