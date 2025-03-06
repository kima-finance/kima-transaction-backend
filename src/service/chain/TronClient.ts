import { TronWeb } from 'tronweb'
import {
  ChainClientBase,
  ITransferFromInput,
  SimulationResult
} from './ChainClient'
import { ChainsService } from '../chains.service'
import { ChainName } from '../../types/chain-name'

export class TronChainClient extends ChainClientBase {
  private tronWeb: TronWeb

  constructor(chainService: ChainsService) {
    super(chainService, ChainName.TRON)
    this.tronWeb = new TronWeb({
      fullHost: this.chain.rpcUrls.default.http[0],
      // fullHost: chainEnv === ChainEnv.MAINNET ? 'https://api.trongrid.io' : 'https://api.nileex.io',
      privateKey: process.env.POOL_PRIVATE_KEY?.slice(2) as string
    })
  }

  async simulateTransferFrom(
    inputs: ITransferFromInput
  ): Promise<SimulationResult> {
    return {
      success: false,
      message: 'Not implemented'
    }
  }
}
