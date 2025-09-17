import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import { isAddress } from 'viem'
import fetchWrapper from '@shared/http/fetch'
import { ChainName } from '@features/chains/types/chain-name'
import { chainsService } from '@features/chains/services/singleton'
import type { SubmitTransaction } from '@features/submit/types/submit-transaction'

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

const isValidAddress = async (
  address: string,
  chain: ChainName
): Promise<string> => {
  try {
    if (chain === ChainName.FIAT || chain === 'CC') return ''

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

    // TODO: add BTC once supported in mainnet
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

const validate = async (req: Request): Promise<string> => {
  const {
    originAddress,
    originSymbol,
    targetAddress,
    targetChain,
    targetSymbol
  } = req.body as SubmitTransaction

  const originChain =
    req.body.originChain === 'FIAT' ? 'CC' : req.body.originChain

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
}

export default validate
export { validate }
