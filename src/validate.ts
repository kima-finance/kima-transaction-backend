import dotenv from 'dotenv'
import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import { isAddress } from 'viem'
import { fetchWrapper } from './fetch-wrapper'
// import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { ChainName } from './types/chain-name'
import chainsService from './service/chains.service'

dotenv.config()

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

  // const currencies = await chainsService.getAvailableCurrencies({
  //   originChain,
  //   targetChain
  // })

  // if (
  //   !currencies.find(
  //     (item: string) => item.toLowerCase() === originSymbol.toLowerCase()
  //   )
  // ) {
  //   return `origin symbol ${originSymbol} not found`
  // }
  // if (
  //   !currencies.find(
  //     (item: string) => item.toLowerCase() === targetSymbol.toLowerCase()
  //   )
  // ) {
  //   return `target symbol ${targetSymbol} not found`
  // }

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
    console.log("address and chain: ", address, chain)

    if (chain === ChainName.FIAT || chain === 'CC') {
      return ''
    }

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
  const { originAddress, originChain, targetAddress, targetChain } = req.body

  try {
    let error = await isValidChain(originChain, targetChain)
    if (error) {
      return error
    }

    console.log("will validate origin...")
    error = await isValidAddress(originAddress, originChain)
    if (error) return error

    console.log("will validate target...")
    error = await isValidAddress(targetAddress, targetChain)
    return error
  } catch (e) {
    console.error(e)
    return 'unknown error: invalid chain or address'
  }
}
