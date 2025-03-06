import {
  Address,
  BaseError,
  createPublicClient,
  erc20Abi,
  http,
  parseUnits,
  PublicClient
} from 'viem'
import {
  ChainClientBase,
  ITransferFromInput,
  SimulationResult
} from './ChainClient'
import { ChainsService } from '../chains.service'
import { ChainName } from '../../types/chain-name'

export class EvmChainClient extends ChainClientBase {
  private publicClient: PublicClient

  constructor(chainService: ChainsService, chainName: ChainName) {
    super(chainService, chainName)
    if (!this.chain) {
      throw new Error(`Missing Solana chain`)
    }
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.chain.rpcUrls.default.http[0])
    })
  }

  async simulateTransferFrom({
    amount,
    originAddress,
    originSymbol
  }: ITransferFromInput): Promise<SimulationResult> {
    const poolAddress = await this.getPoolAddress()
    const token = this.chain!.supportedTokens.find(
      (t) => (t.symbol = originSymbol)
    )
    if (!token) {
      throw new Error(`Token ${originSymbol} not found`)
    }

    try {
      const amountInWei = parseUnits(amount.toString(), token.decimals)
      const args = {
        account: poolAddress as Address,
        address: token.address as Address,
        chain: this.chain,
        abi: erc20Abi,
        functionName: 'transferFrom' as const,
        args: [
          originAddress as Address,
          poolAddress as Address,
          amountInWei
        ] as const
      }

      const response = await this.publicClient.simulateContract(args)
      console.log(
        `EvmChainClient:simulateTransferFrom: ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        response.result ? 'success' : 'fail',
        JSON.stringify(response, null, 2)
      )
      return {
        success: response.result,
        message: 'Tranaction simulation successful.'
      }
    } catch (e) {
      console.error(
        `EvmChainClient:simulateTransferFrom: error ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        e
      )
      let message = 'Tranaction simulation failed.'
      if (e instanceof Error) {
        message = e.message
      }

      return {
        success: false,
        message
      }
    }
  }
}
