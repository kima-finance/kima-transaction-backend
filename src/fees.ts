import { ChainName } from './types/chain-name'
import { fetchWrapper } from './fetch-wrapper'
import { ENV } from './env-validate'
import { getCreatorAddress } from '@kimafinance/kima-transaction-api'
import { chainsService } from './service/chain-service-singleton'

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
  const originToken = await chainsService.getToken(originChain, originSymbol)
  if (!originToken) {
    throw new Error(
      `orign token ${originSymbol} not found on chain ${originChain}`
    )
  }

  if (originChain === 'CFX')
    return mockServiceFee({
      amount: amountStr,
      originChain,
      originAddress,
      originSymbol,
      targetChain,
      targetAddress,
      targetSymbol
    })

  console.log(ENV.KIMA_BACKEND_FEE_URL)
  const result = (await fetchWrapper.post(
    `${ENV.KIMA_BACKEND_FEE_URL as string}/v3/fees/calculate`,
    {
      creator: kimaAddress.address,
      originChain,
      originAddress,
      originSymbol,
      peggedTo: originToken.peggedTo,
      targetChain,
      targetAddress,
      targetSymbol,
      amount: amountStr,
      options: originToken.protocol
        ? { payment_method: originToken.protocol }
        : undefined
    }
  )) as unknown as FeeResponse
  // console.debug('fee result:', JSON.stringify(result, null, 2))

  return result
}

export function mockServiceFee(input: GetFeeInput): FeeResponse {
  const amount = parseFloat(input.amount)
  const value18Submit = BigInt(Math.floor(amount * 10 ** 18)).toString()

  const kimaFeePercent = 0.00005 // 0.005%
  const kimaFee = amount * kimaFeePercent
  const kimaFeeStr = kimaFee.toFixed(6)
  const kimaFeeBigInt = BigInt(Math.floor(kimaFee * 10 ** 6)).toString()

  const totalFiatStr = kimaFeeStr // total fees = only Kima fee
  const totalFiatBigInt = kimaFeeBigInt

  const allowanceAmount = BigInt(Math.floor((amount + kimaFee) * 10 ** 18)).toString()

  return {
    feeId: 'mock-zero-fee-id',
    feeOriginGasFiat: '0.000000',
    feeOriginGasBigInt: {
      value: '0',
      decimals: 18
    },
    feeKimaProcessingFiat: kimaFeeStr,
    feeKimaProcessingBigInt: {
      value: kimaFeeBigInt,
      decimals: 6
    },
    feeTargetGasFiat: '0.000000',
    feeTargetGasBigInt: {
      value: '0',
      decimals: 18
    },
    feeTotalFiat: totalFiatStr,
    feeTotalBigInt: {
      value: totalFiatBigInt,
      decimals: 6
    },
    peggedTo: 'USD',
    expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    transactionValues: {
      feeFromOrigin: {
        allowanceAmount: {
          value: allowanceAmount,
          decimals: 18
        },
        submitAmount: {
          value: value18Submit,
          decimals: 18
        },
        message: `I approve the transfer of ${(amount + kimaFee).toFixed(6)} ${input.originSymbol} from ${input.originChain} to ${input.targetAddress} on ${input.targetChain}.`
      },
      feeFromTarget: {
        allowanceAmount: {
          value: value18Submit,
          decimals: 18
        },
        submitAmount: {
          value: value18Submit,
          decimals: 18
        },
        message: `I approve the transfer of ${amount.toFixed(6)} ${input.originSymbol} from ${input.originChain} to ${input.targetAddress} on ${input.targetChain}.`
      }
    }
  }
}