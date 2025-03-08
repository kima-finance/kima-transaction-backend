import { TronWeb } from 'tronweb'
import {
  ChainClientBase,
  ITransferFromInput,
  SimulationResult,
  TokenBalance
} from './ChainClient'
import { ChainsService } from '../chains.service'
import { ChainName } from '../../types/chain-name'
import { erc20Abi } from 'viem'

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

  async getTokenBalance({
    originAddress,
    originSymbol
  }: ITransferFromInput): Promise<TokenBalance> {
    const { poolAddress, token } = await this.getTokenInfo(originSymbol)
    const tokenContract = this.tronWeb.contract(erc20Abi, token.address)
    const balance = await tokenContract
      .balanceOf(poolAddress)
      .call({ from: poolAddress })
    const allowance = await tokenContract
      .allowance(originAddress, poolAddress)
      .call({ from: poolAddress })

    return {
      ...token,
      kimaPoolAddress: poolAddress,
      allowanceAmount: BigInt(allowance),
      allowanceSpender: poolAddress,
      balance: BigInt(balance)
    }
  }

  async simulateTransferFrom(
    inputs: ITransferFromInput
  ): Promise<SimulationResult> {
    const { amount, originAddress } = inputs
    const token = await this.getTokenBalance(inputs)
    const { kimaPoolAddress } = token

    const validationMsg = this.validateTokenBalance(inputs, token)
    const output: SimulationResult = {
      success: false,
      messages: validationMsg.length
        ? validationMsg
        : ['Fetched token balance and allowance'],
      amount,
      chain: this.chain.name,
      originAddress,
      token
    } satisfies SimulationResult
    console.log('TronClient::simulateTransferFrom', output)

    try {
      // Call the transferFrom method in constant (simulation) mode.
      // Note: Even though transferFrom is not declared as constant,
      // the TRON node will simulate it without committing changes.
      const result =
        await this.tronWeb.transactionBuilder.triggerConstantContract(
          token.address,
          'transferFrom(address,address,uint256)',
          {}, // options (usually left empty)
          [
            { type: 'address', value: originAddress },
            { type: 'address', value: kimaPoolAddress },
            { type: 'uint256', value: amount }
          ],
          kimaPoolAddress
        )

      console.log('Simulation result:', JSON.stringify(result, null, 2))
      if (result.result.result) {
        output.success = true
        output.messages.push('Tranaction simulation successful.')
      } else {
        output.messages.push(
          result.result.message
            ? `Simulation error: ${result.result.message}`
            : 'Tranaction simulation failed.'
        )
      }
      return output
    } catch (error) {
      console.error('Simulation error:', error)
      if (error instanceof Error) {
        output.messages.push(`Simulation error: ${error.message}`)
      }
      return output
    }
  }
}
