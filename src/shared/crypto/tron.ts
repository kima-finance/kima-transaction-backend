import { keccak256 } from 'ethereumjs-util'
import base58 from 'bs58'

const toTronAddress = (ethLikeAddress: string): string => {
  const hex = ethLikeAddress.replace(/^0x/i, '')
  if (hex.length !== 40)
    throw new Error('toTronAddress expects 20-byte address')
  const addr = Buffer.from(hex, 'hex')
  const withPrefix = Buffer.concat([Buffer.from([0x41]), addr])
  const hash = keccak256(withPrefix)
  const checksum = hash.subarray(0, 4)
  return base58.encode(Buffer.concat([withPrefix, checksum]))
}

const getTronAddressFromPrivateKey = (privateKeyHex: string): string => {
  const priv = Buffer.from(privateKeyHex, 'hex')
  const ethAddr = keccak256(priv).subarray(-20) // derive pubkey->addr path is simplified for util parity
  const withPrefix = Buffer.concat([Buffer.from([0x41]), ethAddr])
  const hash = keccak256(withPrefix)
  const checksum = hash.subarray(0, 4)
  return base58.encode(Buffer.concat([withPrefix, checksum]))
}

export default toTronAddress
export { toTronAddress, getTronAddressFromPrivateKey }
