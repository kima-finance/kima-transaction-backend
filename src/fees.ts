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
  originChain,
  originAddress,
  originSymbol,
  targetChain,
  targetAddress,
  targetSymbol
}: GetFeeInput): Promise<FeeResponse> {
  console.debug('calcServiceFee:', {
    amount: amountStr,
    originChain,
    originAddress,
    originSymbol,
    targetChain,
    targetAddress,
    targetSymbol
  })

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
  // console.debug('fee result:', JSON.stringify(result, null, 2))

  return result
}
