import { ASSOCIATED_TOKEN_PROGRAM_ID, getAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey, TokenAmount } from "@solana/web3.js";

export interface WalletTokenAddresses {
  tokenAddress: string
  walletAddress: string
}

export class SolanaService {
  connection: Connection;

  get getRpcUrl() {
    return process.env.SOLANA_RPC_URL
      ? process.env.SOLANA_RPC_URL as string
      : clusterApiUrl("mainnet-beta")
  };

  constructor() {
    this.connection = new Connection(this.getRpcUrl, "confirmed");
  }

  async getAllowance(addresses: WalletTokenAddresses) {
    const walletAccount = this.getWalletTokenAccount(addresses)
    const account = await getAccount(
      this.connection,
      walletAccount,
    )

    return {
      balance: account.amount,
      spender: account.delegate,
      allowance: account.delegatedAmount
    }
  }

  async getBalances(addresses: WalletTokenAddresses) {
    const walletAccount = this.getWalletTokenAccount(addresses)
    const { value } = await this.connection.getTokenAccountBalance(walletAccount)
    return value
  }

  getWalletTokenAccount(
    { tokenAddress,  walletAddress }: WalletTokenAddresses
  ): PublicKey { 
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
  
}

const solanaService = new SolanaService()

export default solanaService
