import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction
} from '@solana/web3.js'
import {
  createApproveInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'

const sendUnlimitedApproval = async ({
  keypair,
  mintAddress = '9YSFWfU9Ram6mAo2QP9zsTnA8yFkkkFGEs3kGgjtQKvp',
  delegateAddress = '5tvyUUqPMWVGaVsRXHoQWqGw6h9uifM45BHCTQgzwSdr',
  rpcUrl = 'https://api.devnet.solana.com'
}: {
  keypair: Keypair
  mintAddress?: string
  delegateAddress?: string
  rpcUrl?: string
}) => {
  const connection = new Connection(rpcUrl, 'confirmed')
  const owner = keypair.publicKey
  const mint = new PublicKey(mintAddress)
  const delegate = new PublicKey(delegateAddress)
  const ata = await getAssociatedTokenAddress(mint, owner)

  const approveIx = createApproveInstruction(
    ata,
    delegate,
    owner,
    BigInt('0xffffffffffffffff'),
    [],
    TOKEN_PROGRAM_ID
  )

  const tx = new Transaction().add(approveIx)
  tx.feePayer = owner
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  tx.sign(keypair)

  const txid = await sendAndConfirmTransaction(connection, tx, [keypair], {
    commitment: 'confirmed'
  })
  console.log('✅ Unlimited approval sent, tx:', txid)
  return txid
}

export default sendUnlimitedApproval
export { sendUnlimitedApproval }
