import {
  Address,
  BaseError,
  createPublicClient,
  erc20Abi,
  getContract,
  http,
  parseUnits,
  PublicClient
} from 'viem'
import {
  ChainClientBase,
  ITransferFromInput,
  SimulationResult,
  TokenBalance
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

  async getTokenBalance({
    originAddress,
    originSymbol
  }: ITransferFromInput): Promise<TokenBalance> {
    const { poolAddress, token } = await this.getTokenInfo(originSymbol)
    const erc20Contract = getContract({
      address: token.address as `0x${string}`,
      abi: erc20Abi,
      client: this.publicClient
    })

    const [allowance, balance, decimals] = await Promise.all([
      erc20Contract.read.allowance([
        originAddress as `0x${string}`,
        poolAddress as `0x${string}`
      ]) as Promise<bigint>,
      erc20Contract.read.balanceOf([
        originAddress as `0x${string}`
      ]) as Promise<bigint>,
      erc20Contract.read.decimals() as Promise<number>
    ])

    return {
      ...token,
      decimals,
      kimaPoolAddress: poolAddress,
      allowanceAmount: allowance,
      allowanceSpender: poolAddress,
      balance
    }
  }

  async simulateTransferFrom(
    inputs: ITransferFromInput
  ): Promise<SimulationResult> {
    const { amount, originAddress, originSymbol } = inputs
    const token = await this.getTokenBalance(inputs)
    const { kimaPoolAddress } = token

    const validationMsg = this.validateTokenBalance(inputs, token)
    const output: SimulationResult = {
      success: false,
      amount,
      messages: validationMsg.length
        ? validationMsg
        : ['Fetched token balance and allowance'],
      chain: this.chain.name,
      network: this.chainEnv,
      originAddress,
      token
    } satisfies SimulationResult

    try {
      const args = {
        account: kimaPoolAddress as Address,
        address: token.address as Address,
        chain: this.chain,
        abi: erc20Abi,
        functionName: 'transferFrom' as const,
        args: [
          originAddress as Address,
          kimaPoolAddress as Address,
          amount
        ] as const
      }

      const response = await this.publicClient.simulateContract(args)
      // console.log(
      //   `EvmChainClient:simulateTransferFrom: ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
      //   response.result ? 'success' : 'fail',
      //   JSON.stringify(response, null, 2)
      // )
      output.success = response.result
      output.messages.push(
        response.result
          ? 'Tranaction simulation successful'
          : 'Tranaction simulation failed'
      )

      return output
    } catch (e) {
      console.error(
        `EvmChainClient:simulateTransferFrom: error ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        e
      )
      output.messages.push(
        e instanceof Error ? e.message : 'Tranaction simulation failed'
      )

      return output
    }
  }
}
