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
    console.log('EvmChainClient::simulateTransferFrom', {
      amount,
      originAddress,
      originSymbol
    })
    const { poolAddress, token } = await this.getTokenInfo(originSymbol)
    // const poolAddress = await this.getPoolAddress()
    // const token = this.chain!.supportedTokens.find(
    //   (t) => (t.symbol = originSymbol)
    // )
    // if (!token) {
    //   throw new Error(`Token ${originSymbol} not found`)
    // }

    // read allowance, balance, and decimals
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

    const output: SimulationResult = {
      success: false,
      message: 'Tranaction simulation pending',
      chain: this.chain.name,
      originAddress,
      token: {
        ...token,
        kimaPoolAddress: poolAddress,
        allowanceAmount: allowance,
        allowanceSpender: poolAddress,
        balance
      }
    } satisfies SimulationResult

    console.log('EvmChainClient::simulateTransferFrom', output)

    try {
      // const amountInWei = parseUnits(amount.toString(), token.decimals)
      const args = {
        account: poolAddress as Address,
        address: token.address as Address,
        chain: this.chain,
        abi: erc20Abi,
        functionName: 'transferFrom' as const,
        args: [
          originAddress as Address,
          poolAddress as Address,
          amount
        ] as const
      }

      const response = await this.publicClient.simulateContract(args)
      console.log(
        `EvmChainClient:simulateTransferFrom: ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        response.result ? 'success' : 'fail',
        JSON.stringify(response, null, 2)
      )
      output.success = response.result
      output.message = response.result
        ? 'Tranaction simulation successful.'
        : 'Tranaction simulation failed.'

      return output
    } catch (e) {
      console.error(
        `EvmChainClient:simulateTransferFrom: error ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        e
      )
      output.message =
        e instanceof Error ? e.message : 'Tranaction simulation failed.'

      return output
    }
  }
}
