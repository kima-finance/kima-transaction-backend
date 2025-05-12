import {
  Bip39,
  EnglishMnemonic,
  Secp256k1,
  sha256,
  Slip10,
  Slip10Curve,
  stringToPath
} from '@cosmjs/crypto'
import { toUtf8 } from '@cosmjs/encoding'
import { toHex } from '@cosmjs/encoding'

const mnemonic = process.env.KIMA_BACKEND_MNEMONIC as string
const path = stringToPath("m/44'/118'/0'/0/0")

// generate a transaction id and signature for credit card options
export const generateCreditCardOptions = async (transactionIdSeed: string) => {
  const { fixedLengthSig, hexSignature } = await signMessage(transactionIdSeed)

  const transactionId = toHex(sha256(new TextEncoder().encode(hexSignature)))

  return {
    options: {
      transactionIdSeed,
      transactionIdSignature: hexSignature
    },
    transactionId
  }
}

const signMessage = async (message: string) => {
  // create wallet instance from mnemonic
  try {
    const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic)) // create seed from mnemonic
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, path) // get privkey from seed generated

    const hash = sha256(toUtf8(message)) // hash message

    const signature = await Secp256k1.createSignature(hash, privkey)
    const fixedLengthSig = signature.toFixedLength().slice(0, 64) // 64-byte Uint8Array

    const hexSignature = toHex(fixedLengthSig) // hex string

    return { fixedLengthSig, hexSignature }
  } catch (e) {
    console.error(e)
    throw new Error('Error signing message')
  }
}
