import { Chain } from '../../types/chain'
import { ChainEnv } from '../../types/chain-env'
import { ChainName } from '../../types/chain-name'
import { ChainsService } from '../chains.service'

export interface ITransferFromInput {
  amount: bigint
  originAddress: string
  originSymbol: string
}

/**
 * Chain agnostic client
 */
export interface ChainClient {
  chain: Chain
  getPoolAddress(): Promise<string>
  getTokenBalance(inputs: ITransferFromInput): Promise<TokenBalance>
  simulateTransferFrom(inputs: ITransferFromInput): Promise<SimulationResult>
  validateTokenBalance(
    input: ITransferFromInput,
    tokenBalance: TokenBalance
  ): string[]
}

export interface SimulationResult {
  success: boolean
  messages: string[]
  amount: bigint
  chain: string
  originAddress: string
  token: TokenBalance
}

export interface TokenBalance {
  address: string
  allowanceAmount: bigint
  allowanceSpender: string
  balance: bigint
  decimals: number
  kimaPoolAddress: string
  symbol: string
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

  async getTokenInfo(tokenSymbol: string) {
    const poolAddress = await this.getPoolAddress()
    if (!poolAddress) {
      throw new Error('Pool address not found')
    }

    const token = this.chain!.supportedTokens.find(
      (t) => (t.symbol = tokenSymbol)
    )
    if (!token) {
      throw new Error(`Token ${tokenSymbol} not found`)
    }

    return {
      poolAddress,
      token
    }
  }

  /**
   *
   * @param input transfer from input
   * @param tokenBalance token balance and allowance info
   * @returns error message if validation fails
   */
  validateTokenBalance(
    { amount }: ITransferFromInput,
    {
      allowanceAmount,
      allowanceSpender,
      balance,
      kimaPoolAddress
    }: TokenBalance
  ): string[] {
    let msg = []
    if (balance < amount) {
      msg.push(`Insufficient balance. Balance: ${balance}, Amount: ${amount}`)
    }
    if (allowanceSpender !== kimaPoolAddress) {
      msg.push(
        `Allowance not granted. Allowance Spender: ${allowanceSpender}, Kima Pool Address: ${kimaPoolAddress}`
      )
    }
    if (allowanceAmount < amount) {
      msg.push(
        `Insufficient allowance. Allowance: ${allowanceAmount}, Amount: ${amount}`
      )
    }
    return msg
  }

  abstract getTokenBalance(inputs: ITransferFromInput): Promise<TokenBalance>

  abstract simulateTransferFrom(
    inputs: ITransferFromInput
  ): Promise<SimulationResult>
}
