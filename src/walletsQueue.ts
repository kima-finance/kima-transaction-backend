// simple wallets round robin to manage multiple signers

import { AccountData, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { stringToPath } from '@cosmjs/crypto'

import { range } from 'lodash'

let cachedWallet: DirectSecp256k1HdWallet
let cachedAccounts: readonly AccountData[]
const numWallets = Number(process.env.KIMA_BACKEND_MNEMONIC_ACCOUNTS || '1')

export const getOrCreateWallet = async (
  mnemonic = process.env.KIMA_BACKEND_MNEMONIC
) => {
  if (cachedWallet) {
    return cachedWallet
  }
  if (numWallets >= 1) {
    const hdPaths = range(0, numWallets).map((i) =>
      stringToPath(`m/44'/118'/0'/0/${i}`)
    ) as any
    cachedWallet = await DirectSecp256k1HdWallet.fromMnemonic(
      process.env.KIMA_BACKEND_MNEMONIC as string,
      {
        prefix: 'kima',
        hdPaths
      }
    )

    cachedAccounts = await cachedWallet.getAccounts()
  }
  return cachedWallet
}

let lastIndex = 0

export const getNextAddress = () => {
  const { address } = cachedAccounts[lastIndex]
  lastIndex = (lastIndex + 1) % numWallets

  return address
}
