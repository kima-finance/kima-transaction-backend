import { ChainName } from './types/chain-name'
import { fetchWrapper } from './fetch-wrapper'
import { ENV } from './env-validate'
import { getCreatorAddress } from '@kimafinance/kima-transaction-api'
import chainsService from './service/chains.service'
import { parseUnits } from 'viem'
import { bigintToNumber, formatterFloat } from './utils'

export interface GetFeeInput {
  amount: string
  originAddress: string
  originChain: ChainName
  originSymbol: string
  targetAddress: string
  targetChain: ChainName
  targetSymbol: string
}

export interface GetFeeRequest extends GetFeeInput {
  creator: string // Kima address of backend wallet "kima1..."
}

export interface BigintAmount {
  value: number | string | bigint
  decimals: number
}

export interface FeeResponse {
  feeId: string
  feeOriginGasFiat: string
  feeOriginGasBigInt: BigintAmount
  feeKimaProcessingFiat: string
  feeKimaProcessingBigInt: BigintAmount
  feeTargetGasFiat: string
  feeTargetGasBigInt: BigintAmount
  feeTotalFiat: string
  feeTotalBigInt: BigintAmount
  peggedTo: string
  expiration: string
  transactionValues: FeeTransactionValues
}

export interface FeeTransactionValues {
  feeFromOrigin: TransactionValues
  feeFromTarget: TransactionValues
}

export interface TransactionValues {
  allowanceAmount: BigintAmount
  submitAmount: BigintAmount
  message: string
}

// amounts in USD expressed as bigint strings
// do NOT use javascript numbers in web3 calls as they will have rounding errors
export interface FeeResult {
  feeId: string
  totalFee: string
  sourceFee: string
  targetFee: string
  kimaFee: string
  decimals: number
  transactionValues: FeeTransactionValues
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
  // deductFee,
  originChain,
  originAddress,
  originSymbol,
  targetChain,
  targetAddress,
  targetSymbol
}: GetFeeInput): Promise<FeeResponse> {
  console.debug('calcServiceFee:', {
    amount: amountStr,
    // deductFee,
    originChain,
    originAddress,
    originSymbol,
    targetChain,
    targetAddress,
    targetSymbol
  })
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
    `${ENV.KIMA_BACKEND_FEE_URL as string}/v2/fees/calculate`,
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
  console.debug('fee result:', result)

  return result

  // const originFeeTokenAmount = chainsService.toTokenDecimals(
  //   originChain,
  //   originSymbol,
  //   +result.feeOriginGas
  // )

  // // use integer math with the source decimals to avoid rounding errors
  // console.info('feeId:', result.feeId)
  // const decimals = originFeeTokenAmount.decimals
  // const fee = parseUnits(result.feeTotal, decimals)
  // const amount = parseUnits(amountStr, decimals)

  // // the amount sent to the Kima transaction should reflect
  // // what the target address will receive
  // const allowanceAmount = deductFee ? amount : amount + fee
  // const submitAmount = deductFee ? amount - fee : amount

  // // round output values to a standard number of fixed decimals (currently 6)
  // // this is to produce consistent output for the signed transaction data message
  // const outputAllowanceAmount = formatterFloat.format(
  //   bigintToNumber(allowanceAmount, decimals)
  // )
  // const outputSubmitAmount = formatterFloat.format(
  //   bigintToNumber(submitAmount, decimals)
  // )

  // return {
  //   totalFee: result.feeTotal,
  //   allowanceAmount: outputAllowanceAmount,
  //   submitAmount: outputSubmitAmount,
  //   sourceFee: result.feeOriginGas,
  //   targetFee: result.feeTargetGas,
  //   kimaFee: result.feeKimaProcessing,
  //   decimals: originFeeTokenAmount.decimals,
  //   feeId: result.feeId
  // }
}
