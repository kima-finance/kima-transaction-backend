import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  ParsedAccountData,
  PublicKey
} from '@solana/web3.js'

export interface WalletTokenAddresses {
  tokenAddress: string
  walletAddress: string
}

export class SolanaService {
  connection: Connection

  get getRpcUrl() {
    return process.env.SOLANA_RPC_URL
      ? (process.env.SOLANA_RPC_URL as string)
      : clusterApiUrl('mainnet-beta')
  }

  constructor() {
    this.connection = new Connection(this.getRpcUrl, 'confirmed')
  }

  async getNativeBalance(walletAddress: string) {
    const publicKey = new PublicKey(walletAddress)

    const solBalance =
      (await this.connection.getBalance(publicKey)) / LAMPORTS_PER_SOL

    return { solBalance }
  }

  async getAllowance(addresses: WalletTokenAddresses) {
    const walletAccount = this.getWalletTokenAccount(addresses)
    const accountInfo = await this.connection.getParsedAccountInfo(
      walletAccount
    )

    const parsedAccountInfo = accountInfo?.value?.data as ParsedAccountData

    return {
      balance: parsedAccountInfo.parsed?.info?.tokenAmount?.uiAmount,
      spender: parsedAccountInfo.parsed?.info?.delegate,
      decimals: parsedAccountInfo.parsed?.info?.tokenAmount?.decimals,
      allowance: parsedAccountInfo.parsed?.info?.delegatedAmount?.uiAmount
    }
  }

  async getBalances(addresses: WalletTokenAddresses) {
    const walletAccount = this.getWalletTokenAccount(addresses)
    const { value } = await this.connection.getTokenAccountBalance(
      walletAccount
    )
    return value
  }

  getWalletTokenAccount({
    tokenAddress,
    walletAddress
  }: WalletTokenAddresses): PublicKey {
    const mintPubKey = new PublicKey(tokenAddress)
    const walletPubKey = new PublicKey(walletAddress)
    const walletTokenAddress = getAssociatedTokenAddressSync(
      mintPubKey,
      walletPubKey,
      true, // allow owner to be a PDA
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    return walletTokenAddress
  }

  async getLatestBlockhash() {
    const blockHashResponse = await this.connection.getLatestBlockhash()
    const hash = await blockHashResponse.blockhash

    return hash
  }

  async sendTransaction(transaction: Buffer) {
    await this.connection.sendRawTransaction(transaction)
  }
}

const solanaService = new SolanaService()

export default solanaService
