import { ChainEnv } from './types/chain-env'

export function hexStringToUint8Array(hexString: string) {
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const arrayBuffer = new Uint8Array(hexString.length / 2)
  for (let i = 0; i < hexString.length; i += 2) {
    arrayBuffer[i / 2] = parseInt(hexString.substr(i, 2), 16)
  }
  return arrayBuffer
}

export const isMainnet = process.env.KIMA_ENVIRONMENT === ChainEnv.MAINNET
export const isTestnet = process.env.KIMA_ENVIRONMENT === ChainEnv.TESTNET
