import ENV from 'core/env'
import { ChainEnv } from 'core/types/chain-env'
import { CHAINS } from '@features/chains/data/chains'
import { ChainCompatibility } from '@features/chains/types/chain'
import { signEvmMessage } from './signers/evm'
import { signSolanaMessage } from './signers/solana'
import { signTronMessage } from './signers/tron'

export type SignApprovalData = {
  originSymbol: string
  originChain: string
  targetAddress: string
  targetChain: string
  allowanceAmount: number
}

const isTestnet = ENV.KIMA_ENVIRONMENT === ChainEnv.TESTNET

const resolveChain = (shortName: string) => {
  const chain = CHAINS.find(
    (c) => c.shortName === shortName && !!c.testnet === isTestnet
  )
  if (!chain) throw new Error(`Chain not found for ${shortName}`)
  return chain
}

const signApprovalMessage = async ({
  originSymbol,
  originChain,
  targetAddress,
  targetChain,
  allowanceAmount
}: SignApprovalData): Promise<string> => {
  const chain = resolveChain(originChain)
  const message = `I approve the transfer of ${allowanceAmount} ${originSymbol} from ${originChain} to ${targetAddress} on ${targetChain}.`
  if (chain.compatibility === ChainCompatibility.EVM)
    return signEvmMessage(chain, message)
  if (chain.shortName === 'SOL') return signSolanaMessage(message)
  if (chain.shortName === 'TRX') return signTronMessage(message)
  throw new Error(`Unsupported compatibility: ${chain.compatibility}`)
}

const signApprovalSwapMessage = async ({
  originSymbol,
  originChain,
  targetAddress,
  targetChain,
  allowanceAmount
}: SignApprovalData): Promise<string> => {
  const chain = resolveChain(originChain)
  const message = `I approve the swap of ${allowanceAmount} ${originSymbol} from ${originChain} to ${targetAddress} on ${targetChain}.`
  if (chain.compatibility === ChainCompatibility.EVM)
    return signEvmMessage(chain, message)
  if (chain.shortName === 'SOL') return signSolanaMessage(message)
  if (chain.shortName === 'TRX') return signTronMessage(message)
  throw new Error(`Unsupported compatibility: ${chain.compatibility}`)
}

export default { signApprovalMessage, signApprovalSwapMessage }
export { signApprovalMessage, signApprovalSwapMessage }
