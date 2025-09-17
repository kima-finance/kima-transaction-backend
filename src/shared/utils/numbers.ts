import { DECIMALS } from 'core/constants'
import { formatUnits } from 'viem'

export const bigintToNumber = (amount: bigint, decimals: number): number =>
  Number(formatUnits(amount, decimals))

export const toFixedNumber = (
  value: bigint | number | string,
  decimals = DECIMALS
): number => Number(Number(value).toFixed(decimals))

export const bigintToFixedNumber = (
  value: bigint | number | string,
  decimals = DECIMALS
): number => toFixedNumber(bigintToNumber(BigInt(value), decimals), decimals)

export const formatterInt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  useGrouping: false
})

export const formatterFloat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: DECIMALS,
  useGrouping: false
})

export default {
  bigintToNumber,
  toFixedNumber,
  bigintToFixedNumber,
  formatterInt,
  formatterFloat
}
