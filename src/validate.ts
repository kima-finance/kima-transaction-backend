import dotenv from 'dotenv'
import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import { isAddress } from 'viem'
import { fetchWrapper } from './fetch-wrapper'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { ChainName } from './types/chain-name'
import chainsService from './service/chains.service'

dotenv.config()

/**
 * Returns empty string if the tokens are supported on the given chains
 * @param {string} originChain sending chain
 * @param {string} targetChain receiving chain
 * @param {string} originSymbol sending token symbol
 * @param {string} targetSymbol receiving token symbol
 * @returns {Promise<string>}
 */
async function isValidChain(
  originChain: string,
  targetChain: string,
  originSymbol: string,
  targetSymbol: string
): Promise<string> {
  const chainNames = await chainsService.getChainNames()

  if (!chainNames.find((item: string) => item === originChain)) {
    return 'origin chain not found'
  }
  if (!chainNames.find((item: string) => item === targetChain)) {
    return 'target chain not found'
  }

  const currencies = await chainsService.getAvailableCurrencies({
    originChain,
    targetChain
  })

  if (
    !currencies.find(
      (item: string) => item.toLowerCase() === originSymbol.toLowerCase()
    )
  ) {
    return 'origin symbol not found'
  }
  if (
    !currencies.find(
      (item: string) => item.toLowerCase() === targetSymbol.toLowerCase()
    )
  ) {
    return 'target symbol not found'
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
      if (!PublicKey.isOnCurve(owner))
        return 'invalid Solana address: not on curve'
    }

    if (chain === ChainName.TRON) {
      const res: any = await fetchWrapper.post(
        'https://api.nileex.io/wallet/validateaddress',
        {
          address,
          visible: 'true'
        }
      )

      if (res?.result === false) return 'invalid Tron address'
    }

    if (chain === ChainName.BTC) {
      if (!validateBTC(address, Network.testnet)) return 'invalid BTC address'
    }

    return isAddress(address) ? '' : 'invalid EVM address'
  } catch (e) {
    console.error(e)
    return 'unknown error: invalid address'
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
    originAddress,
    originChain,
    targetAddress,
    targetChain,
    amount,
    fee,
    originSymbol,
    targetSymbol
  } = req.body

  try {
    let error = await isValidChain(
      originChain,
      targetChain,
      originSymbol,
      targetSymbol
    )
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
