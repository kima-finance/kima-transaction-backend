import { Connection } from '@solana/web3.js'
import { ChainClientBase, ITransferFromInput, SimulationResult } from './ChainClient'
import { ChainsService } from '../chains.service'
import { ChainName } from '../../types/chain-name'

export class SolanaChainClient extends ChainClientBase {
  private connection: Connection

  constructor(chainService: ChainsService) {
    super(chainService, ChainName.SOLANA)
    this.connection = new Connection(this.chain.rpcUrls.default.http[0])
  }

  async simulateTransferFrom(inputs: ITransferFromInput): Promise<SimulationResult> {
    return {
      success: false,
      message: 'Not implemented'
    }
  }
}
