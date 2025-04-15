import { ChainName } from './types/chain-name'
import { fetchWrapper } from './fetch-wrapper'
import { ENV } from './env-validate'
import chainsService from './service/chains.service'
import { getCreatorAddress } from '@kimafinance/kima-transaction-api'

export interface GetFeeInput {
  amount: string
  deductFee: boolean
  originChain: ChainName
  originAddress: string
  originSymbol: string
  targetChain: ChainName
  targetAddress: string
  targetSymbol: string
}

export interface FeeResponse {
  feeId: string
  feeOriginGas: string
  feeKimaProcessing: string
  feeTargetGas: string
  feeTotal: string
  peggedTo: string
  expiration: string
}

// amounts in USD expressed as bigint strings
// do NOT use javascript numbers in web3 calls as they will have rounding errors
export interface FeeResult {
  allowanceAmount: string
  submitAmount: string
  totalFee: string
  sourceFee: string
  targetFee: string
  kimaFee: string
  decimals: number
  feeId: string
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
  originAddress,
  originSymbol,
  targetChain,
  targetAddress,
  targetSymbol
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

  const kimaAddress = await getCreatorAddress()

  console.log(ENV.KIMA_BACKEND_FEE_URL)
  const result = (await fetchWrapper.post(
    `${ENV.KIMA_BACKEND_FEE_URL as string}/v1/fees/calculate`,
    {
      creator: kimaAddress.address,
      originChain,
      originAddress,
      originSymbol,
      targetChain,
      targetAddress,
      targetSymbol,
      amount: amountStr
    }
  )) as unknown as FeeResponse

  const originFeeTokenAmount = chainsService.toTokenDecimals(
    originChain,
    originSymbol,
    +result.feeOriginGas
  )

  console.log(result.feeId)
  const fee = +result.feeTotal
  const amount = +amountStr

  // the amount sent to the Kima transaction should reflect
  // what the target address will receive
  const allowanceAmount = deductFee ? amount : amount + fee
  const submitAmount = deductFee ? amount - fee : amount

  return {
    totalFee: result.feeTotal,
    allowanceAmount: allowanceAmount.toString(),
    submitAmount: submitAmount.toString(),
    sourceFee: result.feeOriginGas,
    targetFee: result.feeTargetGas,
    kimaFee: result.feeKimaProcessing,
    decimals: originFeeTokenAmount.decimals,
    feeId: result.feeId
  }
}
