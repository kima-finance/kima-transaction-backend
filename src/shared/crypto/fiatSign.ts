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
import ENV from 'core/env'

const HD_PATH = stringToPath("m/44'/118'/0'/0/0")

const signMessage = async (message: string) => {
  try {
    const seed = await Bip39.mnemonicToSeed(
      new EnglishMnemonic(ENV.KIMA_BACKEND_MNEMONIC as string)
    )
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, HD_PATH)

    const hash = sha256(toUtf8(message))
    const signature = await Secp256k1.createSignature(hash, privkey)
    const fixedLengthSig = signature.toFixedLength().slice(0, 64)
    const hexSignature = toHex(fixedLengthSig)
    return { fixedLengthSig, hexSignature }
  } catch (e) {
    // keep error terse, upstream logs should include context
    throw new Error('Error signing message')
  }
}

export const generateFiatOptions = async (transactionIdSeed: string) => {
  const { hexSignature } = await signMessage(transactionIdSeed)
  const transactionId = toHex(sha256(new TextEncoder().encode(hexSignature)))

  return {
    options: {
      transactionIdSeed,
      transactionIdSignature: hexSignature
    },
    transactionId
  }
}

export default { generateFiatOptions }
