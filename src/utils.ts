import { formatUnits } from 'viem'
import { DECIMALS } from './constants'

export function bigintToNumber(amount: bigint, decimals: number): number {
  return Number(formatUnits(amount, decimals))
}

export function hexStringToUint8Array(hexString: string) {
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const arrayBuffer = new Uint8Array(hexString.length / 2)
  for (let i = 0; i < hexString.length; i += 2) {
    arrayBuffer[i / 2] = parseInt(hexString.substr(i, 2), 16)
  }
  return arrayBuffer
}

export function toFixedNumber(
  value: bigint | number | string,
  decimals = DECIMALS
): number {
  return Number(Number(value).toFixed(decimals))
}

export function bigintToFixedNumber(
  value: bigint | number | string,
  decimals = DECIMALS
): number {
  return toFixedNumber(bigintToNumber(BigInt(value), decimals), decimals)
}

/**
 * Will convert a full url or a domain name to a URL object
 * @param urlOrDomain a full url or a domain name
 * @returns {URL} the URL object
 */
export function toUrl(urlOrDomain: string): URL {
  if (!urlOrDomain) {
    throw new Error('urlOrDomain must not be empty')
  }
  return urlOrDomain.startsWith('http')
    ? new URL(urlOrDomain)
    : new URL(`http://${urlOrDomain}`)
}
