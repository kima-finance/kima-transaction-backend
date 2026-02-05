import * as bitcoin from 'bitcoinjs-lib'
import { Network as AddressNetwork } from 'bitcoin-address-validation'
import { isTestnet } from 'core/constants'

export const getBtcMempoolBase = () => {
  if (!isTestnet) return 'https://mempool.space/api'
  return 'https://mempool.space/testnet4/api'
}

export const getBtcValidationNetwork = () =>
  isTestnet ? AddressNetwork.testnet : AddressNetwork.mainnet

// testnet4 shares the same address parameters in bitcoinjs-lib
export const getBitcoinJsNetwork = () =>
  isTestnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin
