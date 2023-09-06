import dotenv from 'dotenv'
import { Request } from 'express'
import { PublicKey } from '@solana/web3.js'
import Web3 from 'web3'
import { fetchWrapper } from './fetch-wrapper'

dotenv.config()

async function isValidChain(
  sourceChain: string,
  targetChain: string,
  symbol: string
) {
  let res: any = await fetchWrapper.get(
    `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima/getChains`
  )

  if (!res?.Chains?.length) return false
  if (
    !res.Chains.find((item: string) => item === sourceChain) ||
    !res.Chains.find((item: string) => item === targetChain)
  )
    return false

  res = await fetchWrapper.get(
    `${process.env.KIMA_BACKEND_NODE_PROVIDER_QUERY}/kima-finance/kima/getCurrencies/${sourceChain}/${targetChain}`
  )

  if (!res?.Currencies?.length) return false
  return res.Currencies.find((item: string) => item === symbol)
}

function isValidAddress(address: string, chainId: string) {
  try {
    if (chainId === 'SOL') {
      const owner = new PublicKey(address)
      return PublicKey.isOnCurve(owner)
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
      !isValidAddress(originAddress, originChain) ||
      !isValidAddress(targetAddress, targetChain)
    )
      return false

    return amount > 0 && fee >= 0
  } catch (e) {
    console.log(e)
  }

  return false
}
