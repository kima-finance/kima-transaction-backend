import { ChainEnv } from './types/chain-env'

export const DECIMALS = 6
export const isMainnet = process.env.KIMA_ENVIRONMENT === ChainEnv.MAINNET
export const isTestnet = process.env.KIMA_ENVIRONMENT === ChainEnv.TESTNET
export const useSimulator = process.env.KIMA_BLOCKCHAIN_SIMULATOR === 'true'
