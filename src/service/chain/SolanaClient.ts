import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction
} from '@solana/web3.js'
import {
  createTransferCheckedInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress
} from '@solana/spl-token'
import {
  ChainClientBase,
  ITransferFromInput,
  SimulationResult
} from './ChainClient'
import { ChainsService } from '../chains.service'
import { ChainName } from '../../types/chain-name'
import { parseUnits } from 'viem'

export class SolanaChainClient extends ChainClientBase {
  private connection: Connection

  constructor(chainService: ChainsService) {
    super(chainService, ChainName.SOLANA)
    this.connection = new Connection(this.chain.rpcUrls.default.http[0])
  }

  async simulateTransferFrom({
    amount,
    originAddress,
    originSymbol
  }: ITransferFromInput): Promise<SimulationResult> {
    const { poolAddress, token } = await this.getTokenInfo(originSymbol)
    const destinationPubKey = new PublicKey(poolAddress)
    const sourcePubKey = new PublicKey(originAddress)
    const mintPubKey = new PublicKey(token.address)
    const sourceAssociatedTokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      sourcePubKey
    )
    const destAssociatedTokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      destinationPubKey
    )

    const sourceAccountInfo = await getAccount(
      this.connection,
      sourceAssociatedTokenAccount
    )

    const output = {
      success: false,
      message: 'Tranaction simulation pending',
      chain: this.chain.name,
      originAddress,
      token: {
        ...token,
        kimaPoolAddress: poolAddress,
        allowanceAmount: sourceAccountInfo.delegatedAmount,
        allowanceSpender: sourceAccountInfo.delegate?.toBase58() ?? '',
        balance: sourceAccountInfo.amount
      }
    } satisfies SimulationResult

    console.log('SolanaClient::simulateTransferFrom', output)

    try {
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
      console.log(
        `SolanaChainClient:simulateTransferFrom: ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        response.value.err ? 'fail' : 'success',
        JSON.stringify(response, null, 2)
      )

      if (response.value.err) {
        const message = response.value.logs?.find((log) =>
          log.includes('Error')
        )
        output.message = message || 'Tranaction simulation failed.'
      } else {
        output.message = 'Tranaction simulation successful.'
      }

      return output
    } catch (e) {
      console.error(
        `SolanaChainClient:simulateTransferFrom: error ${this.chain.name} ${originAddress} ${originSymbol} ${amount}`,
        e
      )
      if (e instanceof Error) {
        output.message = e.message
      }

      return output
    }
  }
}
