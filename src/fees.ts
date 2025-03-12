import { ChainName } from './types/chain-name'
import { fetchWrapper } from './fetch-wrapper'
import { parseUnits } from 'viem'
import { bigintToNumber } from './utils'
import chainsService from './service/chains.service'
import { ENV } from './env-validate'

export interface GetFeeInput {
  amount: string
  deductFee: boolean
  originChain: ChainName
  originSymbol: string
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
 * Get the total fees in USD for the given amount and chains
 * then calculate the allowance and submit amounts accordingly
 *
 * @export
 * @async
 * @param {GetFeeInput} args amount and chains
 * @returns {Promise<FeeResult>} the total fee in USD
 */
export async function calcServiceFee({
  amount: amountStr,
  deductFee,
  originChain,
  originSymbol,
  targetChain
}: GetFeeInput): Promise<FeeResult> {
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
    targetChain === ChainName.BERA ? 0 : getServiceFee(targetChain)
  ])

  // convert USD fee amounts into the origin chain token amounts
  const originFeeTokenAmount = chainsService.toTokenDecimals(
    originChain,
    originSymbol,
    originFee
  )
  const targetFeeTokenAmount = chainsService.toTokenDecimals(
    originChain,
    originSymbol,
    targetFee
  )

  // calculate amounts with integer math to avoid rounding errors
  const decimals = originFeeTokenAmount.decimals
  const amount = parseUnits(amountStr, decimals)

  // TODO: add 0.05% Kima service fee when implemented on chain
  const fee = originFeeTokenAmount.amount + targetFeeTokenAmount.amount

  // the amount sent to the Kima transaction should reflect
  // what the target address will receive
  const allowanceAmount = deductFee ? amount : amount + fee
  const submitAmount = deductFee ? amount - fee : amount

  // TODO: convert amount into origin token amount
  // using USD price of origin token
  // Note even stable coins are often not exactly 1:1

  return {
    totalFee: fee.toString(),
    totalFeeUsd: bigintToNumber(fee, decimals),
    allowanceAmount: allowanceAmount.toString(),
    decimals,
    deductFee,
    submitAmount: submitAmount.toString(),
    breakdown: [
      {
        amount: bigintToNumber(originFeeTokenAmount.amount, decimals),
        feeType: 'gas',
        chain: originChain
      },
      {
        amount: bigintToNumber(targetFeeTokenAmount.amount, decimals),
        feeType: 'gas',
        chain: targetChain
      }
    ]
  }
}

/**
 * Query the Kima API for the gas fees in USD on the given chain
 *
 * @async
 * @param {ChainName} chain
 * @returns {Promise<string>} the estimated gas fee in USD
 */
async function getServiceFee(chain: ChainName): Promise<string> {
  const result = (await fetchWrapper.get(
    `${ENV.KIMA_BACKEND_FEE_URL as string}/fee/${chain}`
  )) as unknown as { fee: string }

  // parse the dash separated fee
  // <Amount USD>-<Timestamp>-<Amount Crypto>
  // we want the USD amount
  const { fee } = result
  const [amount] = fee.split('-')
  return amount
}
