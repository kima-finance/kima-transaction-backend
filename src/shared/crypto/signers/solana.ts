import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'

const signSolanaMessage = async (message: string): Promise<string> => {
  const privateKey = process.env.SOL_PRIVATE_KEY
  if (!privateKey) throw new Error('Missing SOL_PRIVATE_KEY')

  const keypairBytes = bs58.decode(privateKey)
  const keypair = Keypair.fromSecretKey(keypairBytes)

  const messageBytes = naclUtil.decodeUTF8(message)
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey)
  const ok = nacl.sign.detached.verify(
    messageBytes,
    signature,
    keypair.publicKey.toBytes()
  )
  if (!ok) throw new Error('Signature verification failed')
  return `0x${Buffer.from(signature).toString('hex')}`
}

export default signSolanaMessage
export { signSolanaMessage }
