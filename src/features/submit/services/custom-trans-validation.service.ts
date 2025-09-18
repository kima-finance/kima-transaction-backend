import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import { isAddress } from 'viem'
import fetchWrapper from '@shared/http/fetch'
import { z } from 'zod'
import chainsService from '@features/chains/services/singleton'
import { ChainName } from '@features/chains/types/chain-name'
import { TransactionDetails } from '../types/transaction-details'

type TransactionDetailsType = z.infer<typeof TransactionDetails>

type SubmitTransRequest = Request & {
  body: TransactionDetailsType
}

const isValidChain = async (
  originChain: string,
  targetChain: string
): Promise<string> => {
  if (!chainsService.isSupportedChain(originChain, 'origin'))
    return `origin chain ${originChain} not supported`

  if (!chainsService.isSupportedChain(targetChain, 'target'))
    return `target chain ${targetChain} not supported`

  const originDisabled = await chainsService.isDisabledChain(
    originChain as ChainName
  )
  if (originDisabled) return `origin chain ${originChain} disabled`

  const targetDisabled = await chainsService.isDisabledChain(
    targetChain as ChainName
  )
  if (targetDisabled) return `target chain ${targetChain} disabled`

  return ''
}

const NON_ADDRESS_CHAINS: ChainName[] = [
  ChainName.FIAT,
  ChainName.CC,
  ChainName.BANK
]

const isValidAddress = async (
  address: string,
  chain: ChainName
): Promise<string> => {
  try {
    if (NON_ADDRESS_CHAINS.includes(chain)) return ''

    if (chain === ChainName.SOLANA) {
      const owner = new PublicKey(address)
      return !PublicKey.isOnCurve(owner)
        ? `invalid Solana address ${address}`
        : ''
    }

    if (chain === ChainName.TRON) {
      const res: any = await fetchWrapper.post(
        'https://api.nileex.io/wallet/validateaddress',
        { address, visible: 'true' }
      )
      return res?.result === false ? `invalid Tron address ${address}` : ''
    }

    // Default: treat as EVM
    return isAddress(address) ? '' : `invalid EVM address ${address}`
  } catch {
    return `unknown error: invalid address ${address}`
  }
}

const areValidTokens = async (inputs: {
  originChain: string
  originSymbol: string
  targetChain: string
  targetSymbol: string
}): Promise<string> => {
  const originToken = await chainsService.getToken(
    inputs.originChain,
    inputs.originSymbol
  )
  if (!originToken) return `origin symbol ${inputs.originSymbol} not found`

  const targetToken = await chainsService.getToken(
    inputs.targetChain,
    inputs.targetSymbol
  )
  if (!targetToken) return `target symbol ${inputs.targetSymbol} not found`

  return ''
}

/**
 * Custom transaction validation
 * - Put any app-specific rules here (e.g., payment address allowlist)
 * - Return an error string when invalid; empty string when valid
 */
const customTransValidation = async (
  req: SubmitTransRequest
): Promise<string> => {
  const {
    originAddress,
    originSymbol,
    targetAddress,
    targetChain,
    targetSymbol
  } = req.body

  const originChain = req.body.originChain

  try {
    let error = await isValidChain(originChain, targetChain)
    if (error) return error

    error = await isValidAddress(originAddress, originChain as ChainName)
    if (error) return error

    error = await isValidAddress(targetAddress, targetChain as ChainName)
    if (error) return error

    error = await areValidTokens({
      originChain,
      originSymbol,
      targetChain,
      targetSymbol
    })
    return error
  } catch {
    return 'unknown error: invalid chain or address'
  }
}

export default customTransValidation
