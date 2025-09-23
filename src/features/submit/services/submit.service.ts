import fetchWrapper from '@shared/http/fetch'
import { getCreatorAddress } from '@kimafinance/kima-transaction-api'
import { ChainName } from '@features/chains/types/chain-name'
import chainsService from '@features/chains/services/singleton'
import ENV from 'core/env'

export type BigintAmount = {
  value: number | string | bigint
  decimals: number
}

export type TransactionValues = {
  allowanceAmount: BigintAmount
  submitAmount: BigintAmount
  message: string
}

export type FeeTransactionValues = {
  feeFromOrigin: TransactionValues
  feeFromTarget: TransactionValues
}

export type FeeResponse = {
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

export type GetFeeInput = {
  amount: string
  originAddress: string
  originChain: ChainName
  originSymbol: string
  targetAddress: string
  targetChain: ChainName
  targetSymbol: string
}

export const calcServiceFee = async ({
  amount: amountStr,
  originChain,
  originAddress,
  originSymbol,
  targetChain,
  targetAddress,
  targetSymbol
}: GetFeeInput): Promise<FeeResponse> => {
  const kimaAddress = await getCreatorAddress()

  const isFiat = originChain === 'CC' || originChain === 'BANK'

  // still get token (for peggedTo/decimals), but don't trust protocol for FIAT
  const originToken = await chainsService.getToken(originChain, originSymbol)
  if (!originToken) {
    throw new Error(
      `orign token ${originSymbol} not found on chain ${originChain}`
    )
  }

  const mappedOriginChain = isFiat ? 'FIAT' : originChain

  const body = {
    creator: kimaAddress.address,
    originChain: mappedOriginChain,
    originAddress: isFiat ? '' : originAddress,
    originSymbol,
    peggedTo: originToken.peggedTo,
    targetChain,
    targetAddress,
    targetSymbol,
    amount: amountStr,
    options: originToken.protocol
      ? { paymentMethod: originToken.protocol }
      : undefined
  }

  return fetchWrapper.post<FeeResponse>(
    `${ENV.KIMA_BACKEND_FEE_URL}/v3/fees/calculate`,
    body
  )
}

// lightweight mock (kept for tests/simulators)
export const mockServiceFee = ({
  amount,
  originChain,
  originSymbol,
  targetAddress,
  targetChain
}: GetFeeInput): FeeResponse => {
  const amountNum = parseFloat(amount)
  const to18 = (n: number) => BigInt(Math.floor(n * 1e18)).toString()
  const to6 = (n: number) => BigInt(Math.floor(n * 1e6)).toString()

  const submitValue18 = to18(amountNum)

  const kimaFeePercent = 0.00005 // 0.005%
  const kimaFee = amountNum * kimaFeePercent
  const kimaFeeStr = kimaFee.toFixed(6)
  const kimaFeeBigInt = to6(kimaFee)

  const totalFiatStr = kimaFeeStr
  const totalFiatBigInt = kimaFeeBigInt

  const allowanceAmount = to18(amountNum + kimaFee)

  return {
    feeId: 'mock-zero-fee-id',
    feeOriginGasFiat: '0.000000',
    feeOriginGasBigInt: { value: '0', decimals: 18 },
    feeKimaProcessingFiat: kimaFeeStr,
    feeKimaProcessingBigInt: { value: kimaFeeBigInt, decimals: 6 },
    feeTargetGasFiat: '0.000000',
    feeTargetGasBigInt: { value: '0', decimals: 18 },
    feeTotalFiat: totalFiatStr,
    feeTotalBigInt: { value: totalFiatBigInt, decimals: 6 },
    peggedTo: 'USD',
    expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    transactionValues: {
      feeFromOrigin: {
        allowanceAmount: { value: allowanceAmount, decimals: 18 },
        submitAmount: { value: submitValue18, decimals: 18 },
        message: `I approve the transfer of ${(amountNum + kimaFee).toFixed(6)} ${originSymbol} from ${originChain} to ${targetAddress} on ${targetChain}.`
      },
      feeFromTarget: {
        allowanceAmount: { value: submitValue18, decimals: 18 },
        submitAmount: { value: submitValue18, decimals: 18 },
        message: `I approve the transfer of ${amountNum.toFixed(6)} ${originSymbol} from ${originChain} to ${targetAddress} on ${targetChain}.`
      }
    }
  }
}

export default { calcServiceFee, mockServiceFee }
