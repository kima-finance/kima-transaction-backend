import { DECIMALS } from './constants'
import { ChainName } from './types/chain-name'
import { fetchWrapper } from './fetch-wrapper'
import { parseUnits } from 'viem'
import { bigintToNumber } from './utils'

export interface GetFeeInput {
  amount: string
  deductFee: boolean
  originChain: ChainName
  targetChain: ChainName
}

// amounts in USD expressed as bigint strings
// do NOT use javascript numbers in web3 calls as they will have rounding errors
export interface FeeResult {
  allowanceAmount: string
  breakdown: FeeBreakdown[]
  decimals: number
  deductFee: boolean
  submitAmount: string
  totalFee: string
  totalFeeUsd: number // total fee in USD expressed as a number for display only
}

// Fees by chain (for display only)
export interface FeeBreakdown {
  amount: number
  feeType: 'gas' | 'service'
  chain: ChainName | 'KIMA'
}

/**
 * Fetch the total gas fees in USD for the given chains
 *
 * @export
 * @async
 * @param {GetFeeInput} args amount and chains
 * @returns {Promise<FeeResult>} the total fee in USD
 */
export async function calcServiceFee(args: GetFeeInput): Promise<FeeResult> {
  const { amount: amountStr, deductFee, originChain, targetChain } = args

  // TODO: add FIAT fees once supported in mainnet
  // if (originChain === ChainName.FIAT || targetChain === ChainName.FIAT) {
  //   return 0
  // }

  // TODO: add BTC fees once supported in mainnet
  // if (originChain === ChainName.BTC) {
  //   return 0.0004
  // }
  // if (targetChain === ChainName.BTC) {
  //   return 0
  // }

  const [originFee, targetFee] = await Promise.all([
    getServiceFee(originChain),
    getServiceFee(targetChain)
  ])

  // calculate amounts with integer math to avoid rounding errors
  const decimals = originFee.decimals
  const amount = parseUnits(amountStr, decimals)
  const fee = originFee.amount + targetFee.amount

  const allowanceAmount = deductFee ? amount : amount + fee
  const submitAmount = deductFee ? amount - fee : amount

  // TODO: convert amount into origin token amount
  // using USD price of origin token
  // Note even stable coins are often not exactly 1:1

  // TODO: how to handle 0.05% Kima service fee?

  return {
    totalFee: fee.toString(),
    totalFeeUsd: bigintToNumber(fee, decimals),
    allowanceAmount: allowanceAmount.toString(),
    decimals,
    deductFee,
    submitAmount: submitAmount.toString(),
    breakdown: [
      {
        amount: bigintToNumber(originFee.amount, decimals),
        feeType: 'gas',
        chain: originChain
      },
      {
        amount: bigintToNumber(targetFee.amount, decimals),
        feeType: 'gas',
        chain: targetChain
      }
    ]
  }
}

async function getServiceFee(
  chain: ChainName
): Promise<{ amount: bigint; decimals: number }> {
  const result = (await fetchWrapper.get(
    `${process.env.KIMA_BACKEND_FEE_URL as string}/fee/${chain}`
  )) as unknown as { fee: string }

  // parse the dash separated fee
  // <Amount USD>-<Timestamp>-<Amount Crypto>
  // we want the USD amount
  const { fee } = result
  const [amount] = fee.split('-')

  return {
    amount: parseUnits(amount, DECIMALS),
    decimals: DECIMALS
  }
}
