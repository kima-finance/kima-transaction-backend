import { ecsign, keccak256, toRpcSig } from 'ethereumjs-util'
import { getTronAddressFromPrivateKey } from '../tron'

const signTronMessage = (message: string): string => {
  const privateKeyHex = process.env.TRX_PRIVATE_KEY
  if (!privateKeyHex) throw new Error('Missing TRX_PRIVATE_KEY')

  // just for visibility in logs
  const address = getTronAddressFromPrivateKey(privateKeyHex)
  console.log('recovered TRX address:', address)

  const privateKey = Buffer.from(privateKeyHex, 'hex')
  const prefix = `\x19TRON Signed Message:\n${message.length}${message}`
  const messageHash = keccak256(Buffer.from(prefix))
  const { v, r, s } = ecsign(messageHash, privateKey)
  return toRpcSig(v, r, s)
}

export default signTronMessage
export { signTronMessage }
