import dotenv from 'dotenv'
import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import { isAddress } from 'viem'
import { fetchWrapper } from './fetch-wrapper'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'
import { ChainName } from './types/chain-name'

dotenv.config()

/**
 * Returns true if the tokens are supported on the given chains
 * @param {string} originChain sending chain
 * @param {string} targetChain receiving chain
 * @param {string} originSymbol sending token symbol
 * @param {string} targetSymbol receiving token symbol
 * @returns {Promise<boolean>}
 */
async function isValidChain(
  originChain: string,
  targetChain: string,
  originSymbol: string,
  targetSymbol: string
): Promise<boolean> {
  let res: any = await fetchWrapper.get(
    `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_chains`
  )

  if (!res?.Chains?.length) return false
  if (
    !res.Chains.find((item: string) => item === originChain) ||
    !res.Chains.find((item: string) => item === targetChain)
  )
    return false

  res = await fetchWrapper.get(
    `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_currencies/${originChain}/${targetChain}`
  )

  if (!res?.Currencies?.length) return false
  return (
    res.Currencies.find(
      (item: string) => item.toLowerCase() === originSymbol.toLowerCase()
    ) &&
    res.Currencies.find(
      (item: string) => item.toLowerCase() === targetSymbol.toLowerCase()
    )
  )
}

/**
 * Returns true if the address is valid for the given chain
 *
 * @async
 * @param {string} address address to check
 * @param {ChainName} chain chain symbol
 * @returns {Promise<boolean>}
 */
async function isValidAddress(
  address: string,
  chain: ChainName
): Promise<boolean> {
  try {
    if (chain === ChainName.SOLANA) {
      const owner = new PublicKey(address)
      return PublicKey.isOnCurve(owner)
    }

    if (chain === ChainName.TRON) {
      const res: any = await fetchWrapper.post(
        'https://api.nileex.io/wallet/validateaddress',
        {
          address,
          visible: 'true'
        }
      )

      return res?.result as boolean
    }

    if (chain === ChainName.BTC) {
      return validateBTC(address, Network.testnet)
    }

    return isAddress(address)
  } catch (e) {
    console.log(e)
  }
  return false
}

/**
 * Validation for the POST /submit endpoint
 *
 * @export
 * @async
 * @param {Request} req
 * @returns {Promise<boolean>}
 */
export async function validate(req: Request): Promise<boolean> {
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
    if (
      !(await isValidChain(
        originChain,
        targetChain,
        originSymbol,
        targetSymbol
      ))
    ) {
      return false
    }

    if (
      !(await isValidAddress(originAddress, originChain)) ||
      !(await isValidAddress(targetAddress, targetChain))
    ) {
      return false
    }

    return amount > 0 && fee >= 0
  } catch (e) {
    console.log(e)
  }

  return false
}
