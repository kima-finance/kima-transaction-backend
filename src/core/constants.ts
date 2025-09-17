import ENV from './env'
import { ChainEnv } from './types/chain-env'

export const DECIMALS = 6

export const isDev = ENV.NODE_ENV === 'development'
export const isProd = ENV.NODE_ENV === 'production'
export const isTest = ENV.NODE_ENV === 'test'

export const isMainnet = ENV.KIMA_ENVIRONMENT === ChainEnv.MAINNET
export const isTestnet = ENV.KIMA_ENVIRONMENT === ChainEnv.TESTNET

export default {
  DECIMALS,
  isDev,
  isProd,
  isTest,
  isMainnet,
  isTestnet
}
