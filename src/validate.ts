import dotenv from 'dotenv'
import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import { isAddress } from 'viem'
import { fetchWrapper } from './fetch-wrapper'
// import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { ChainName } from './types/chain-name'
import chainsService from './service/chains.service'
import { ChainEnv } from './types/chain-env'

dotenv.config()

/**
 * Returns empty string if the tokens are supported on the given chains
 * @param {number} inputs.decimals
 * @param {string} inputs.originChain sending chain
 * @param {string} inputs.targetChain receiving chain
 * @param {string} inputs.originSymbol sending token symbol
 * @param {string} inputs.targetSymbol receiving token symbol
 * @returns {Promise<string>}
 */
async function isValidChain(inputs: {
  decimals: number
  originChain: string
  targetChain: string
  originSymbol: string
  targetSymbol: string
}): Promise<string> {
  const { decimals, originChain, targetChain, originSymbol, targetSymbol } =
    inputs
  const chainEnv = process.env.KIMA_ENVIRONMENT as ChainEnv
  if (!chainsService.getChain(chainEnv, originChain as ChainName)) {
    return `Origin chain ${originChain} not supported`
  }
  if (!chainsService.getChain(chainEnv, targetChain as ChainName)) {
    return `Target chain ${targetChain} not supported`
  }

  const originToken = chainsService.getToken(originChain, originSymbol)
  if (!originToken) {
    return `Origin token ${originSymbol} not supported`
  }

  if (originToken.decimals !== decimals) {
    return `Invalid decimals for token ${originToken.symbol}. Expected ${originToken.decimals}, got ${decimals}`
  }

  const targetToken = chainsService.getToken(targetChain, targetSymbol)
  if (!targetToken) {
    return `Target token ${targetSymbol} not supported`
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
    if (chain === ChainName.SOLANA) {
      const owner = new PublicKey(address)
      return !PublicKey.isOnCurve(owner)
        ? 'invalid Solana address ${address}'
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

      return res?.result === false ? 'invalid Tron address ${address}' : ''
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
    decimals,
    originAddress,
    originChain,
    originSymbol,
    targetAddress,
    targetChain,
    targetSymbol
  } = req.body

  try {
    let error = await isValidChain({
      decimals: Number(decimals),
      originChain,
      originSymbol,
      targetChain,
      targetSymbol
    })
    if (error) {
      return error
    }

    error = await isValidAddress(originAddress, originChain)
    if (error) return error

    error = await isValidAddress(targetAddress, targetChain)
    return error
  } catch (e) {
    console.error(e)
    return 'unknown error: invalid chain or address'
  }
}
