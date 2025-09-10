import 'dotenv/config'
import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import { isAddress } from 'viem'
import { fetchWrapper } from './fetch-wrapper'
// import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { ChainName } from './types/chain-name'
import { chainsService } from './service/chain-service-singleton'
import { SubmitTransaction } from './types/submit-transaction'

/**
 * Returns empty string if the tokens are supported on the given chains
 * @param {string} originChain sending chain
 * @param {string} targetChain receiving chain
 * @returns {Promise<string>}
 */
async function isValidChain(
  originChain: string,
  targetChain: string
): Promise<string> {
  if (!chainsService.isSupportedChain(originChain, 'origin')) {
    return `origin chain ${originChain} not supported`
  }
  if (!chainsService.isSupportedChain(targetChain, 'target')) {
    return `target chain ${targetChain} not supported`
  }
  const originChainDisabled = await chainsService.isDisabledChain(
    originChain as ChainName
  )
  if (originChainDisabled) {
    return `origin chain ${originChain} disabled`
  }
  const targetChainDisabled = await chainsService.isDisabledChain(
    targetChain as ChainName
  )
  if (targetChainDisabled) {
    return `target chain ${targetChain} disabled`
  }

  return ''
}

/**
 * Returns emtpy string if the address is valid for the given chain
 *
 * @async
 * @param {string} address address to check
 * @param {ChainName} chain chain symbol
 * @returns {Promise<string>}
 */
async function isValidAddress(
  address: string,
  chain: ChainName
): Promise<string> {
  try {
    if (['BANK', 'CC'].includes(chain)) {
      return ''
    }

    if (chain === ChainName.SOLANA) {
      const owner = new PublicKey(address)
      return !PublicKey.isOnCurve(owner)
        ? `invalid Solana address ${address}`
        : ''
    }

    if (chain === ChainName.TRON) {
      const res: any = await fetchWrapper.post(
        'https://api.nileex.io/wallet/validateaddress',
        {
          address,
          visible: 'true'
        }
      )

      return res?.result === false ? `invalid Tron address ${address}` : ''
    }

    // TODO: add BTC once supported in mainnet
    // if (chain === ChainName.BTC) {
    //   if (!validateBTC(address, Network.testnet)) return 'invalid BTC address'
    // }

    return isAddress(address) ? '' : `invalid EVM address ${address}`
  } catch (e) {
    console.error(e)
    return `unknown error: invalid address ${address}`
  }
}

async function areValidTokens(inputs: {
  originChain: string
  originSymbol: string
  targetChain: string
  targetSymbol: string
}): Promise<string> {
  const originToken = await chainsService.getToken(
    inputs.originChain,
    inputs.originSymbol
  )
  if (!originToken) {
    return `origin symbol ${inputs.originSymbol} not found`
  }

  const targetToken = await chainsService.getToken(
    inputs.targetChain,
    inputs.targetSymbol
  )
  if (!targetToken) {
    return `target symbol ${inputs.targetSymbol} not found`
  }

  // must be pegged to the same currency
  if (originToken.peggedTo !== targetToken.peggedTo) {
    return `origin and target tokens must be pagged to the same currency. ${originToken.symbol} (${originToken.peggedTo}) != ${targetToken.symbol} (${targetToken.peggedTo})`
  }

  return ''
}

/**
 * Validation for the POST /submit endpoint
 *
 * @export
 * @async
 * @param {Request} req
 * @returns {Promise<string>}
 */
export async function validate(req: Request): Promise<string> {
  const {
    originAddress,
    originSymbol,
    targetAddress,
    targetChain,
    targetSymbol
  } = req.body as SubmitTransaction

  // the Kima chain currently uses the FIAT symbol instead of CC (Credit Card)
  const originChain =
    req.body.originChain === 'FIAT' ? 'CC' : req.body.originChain

  try {
    let error = await isValidChain(originChain, targetChain)
    if (error) {
      return error
    }

    error = await isValidAddress(originAddress, originChain as ChainName)
    if (error) return error

    error = await isValidAddress(targetAddress, targetChain as ChainName)

    error = await areValidTokens({
      originChain,
      originSymbol,
      targetChain,
      targetSymbol
    })

    return error
  } catch (e) {
    console.error(e)
    return 'unknown error: invalid chain or address'
  }
}
