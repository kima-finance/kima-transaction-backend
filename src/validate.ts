import dotenv from 'dotenv'
import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import Web3 from 'web3'
import { fetchWrapper } from './fetch-wrapper'
import { Network, validate as validateBTC } from 'bitcoin-address-validation'

dotenv.config()

async function isValidChain(
  sourceChain: string,
  targetChain: string,
  symbol: string
) {
  let res: any = await fetchWrapper.get(
    `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_chains`
  )

  if (!res?.Chains?.length) return false
  if (
    !res.Chains.find((item: string) => item === sourceChain) ||
    !res.Chains.find((item: string) => item === targetChain)
  )
    return false

  res = await fetchWrapper.get(
    `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima-blockchain/chains/get_currencies/${sourceChain}/${targetChain}`
  )

  if (!res?.Currencies?.length) return false
  return res.Currencies.find(
    (item: string) => item.toLowerCase() === symbol.toLowerCase()
  )
}

async function isValidAddress(address: string, chainId: string) {
  try {
    if (chainId === 'SOL') {
      const owner = new PublicKey(address)
      return PublicKey.isOnCurve(owner)
    }

    if (chainId === 'TRX') {
      const res: any = await fetchWrapper.post(
        'https://api.nileex.io/wallet/validateaddress',
        {
          address,
          visible: 'true'
        }
      )

      return res?.result
    }

    if (chainId === 'BTC') {
      return validateBTC(address, Network.testnet)
    }

    return Web3.utils.isAddress(address)
  } catch (e) {
    console.log(e)
  }
  return false
}

export async function validate(req: Request) {
  const {
    originAddress,
    originChain,
    targetAddress,
    targetChain,
    amount,
    fee,
    symbol
  } = req.body

  try {
    if (!(await isValidChain(originChain, targetChain, symbol))) return false

    if (
      !(await isValidAddress(originAddress, originChain)) ||
      !(await isValidAddress(targetAddress, targetChain))
    )
      return false

    return amount > 0 && fee >= 0
  } catch (e) {
    console.log(e)
  }

  return false
}
