import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import {
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress
} from '@solana/spl-token'
import {
  ChainClientBase,
  ITransferFromInput,
  SimulationResult,
  TokenBalance
} from './ChainClient'
import { ChainsService } from '../chains.service'
import { ChainName } from '../../types/chain-name'

export class SolanaChainClient extends ChainClientBase {
  private connection: Connection

  constructor(chainService: ChainsService) {
    super(chainService, ChainName.SOLANA)
    this.connection = new Connection(this.chain.rpcUrls.default.http[0])
  }

  async getTokenBalance({
    originAddress,
    originSymbol
  }: ITransferFromInput): Promise<TokenBalance> {
    const { poolAddress, token } = await this.getTokenInfo(originSymbol)
    const output: TokenBalance = {
      address: token.address,
      allowanceAmount: BigInt(0),
      allowanceSpender: '',
      balance: BigInt(0),
      decimals: token.decimals,
      kimaPoolAddress: poolAddress,
      symbol: token.symbol
    }
    
    try {
      const sourceAssociatedTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(token.address),
        new PublicKey(originAddress)
      )
      const sourceAccountInfo = await getAccount(
        this.connection,
        sourceAssociatedTokenAccount
      )
      output.allowanceAmount = sourceAccountInfo.delegatedAmount
      output.allowanceSpender = sourceAccountInfo.delegate?.toBase58() ?? ''
      output.balance = sourceAccountInfo.amount
    } catch {
      // associated token account does not exist- zero balance
    }

    return output
  }

  async simulateTransferFrom(
    inputs: ITransferFromInput
  ): Promise<SimulationResult> {
    const { amount, originAddress, originSymbol } = inputs
    const token = await this.getTokenBalance(inputs)
    const { kimaPoolAddress } = token
    const destinationPubKey = new PublicKey(kimaPoolAddress)
    const sourcePubKey = new PublicKey(originAddress)
    const mintPubKey = new PublicKey(token.address)

    const validationMsg = this.validateTokenBalance(inputs, token)
    const output = {
      success: false,
      messages: validationMsg.length
        ? validationMsg
        : ['Fetched token balance and allowance'],
      amount,
      chain: this.chain.name,
      network: this.chainEnv,
      originAddress,
      token
    } satisfies SimulationResult

    try {
      const sourceAssociatedTokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        sourcePubKey
      )
      const destAssociatedTokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        destinationPubKey
      )

      const instruction = createTransferCheckedInstruction(
        sourceAssociatedTokenAccount,
        mintPubKey,
        destAssociatedTokenAccount,
        destinationPubKey,
        amount,
        token.decimals
      )

      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash()
      const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: destinationPubKey
      }).add(instruction)

      const response = await this.connection.simulateTransaction(transaction)
      // console.log(
      //   `SolanaChainClient:simulateTransferFrom: ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
      //   response.value.err ? 'fail' : 'success',
      //   JSON.stringify(response, null, 2)
      // )

      if (response.value.err) {
        const message = response.value.logs?.find((log) =>
          log.includes('Error')
        )
        output.messages.push(message || 'Tranaction simulation failed')
      } else {
        output.messages.push('Tranaction simulation successful.')
      }

      return output
    } catch (e) {
      console.error(
        `SolanaChainClient:simulateTransferFrom: error ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        e
      )
      if (e instanceof Error) {
        output.messages.push(e.message)
      }

      return output
    }
  }
}
