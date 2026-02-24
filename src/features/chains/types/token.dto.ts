import { z } from 'zod'
import { Location } from './chain'

export interface KimaApiTokenDto {
  symbol: string
  address: string
  decimals: string
  peggedTo: string // currency symbol i.e. USD, EUR
  isPermit2?: boolean
}

const protocolSchema = z.enum(['creditCard', 'swiftUsd', 'sepaEur'])
export type TokenProtocol = z.infer<typeof protocolSchema>

/**
 * TokenDto now optionally declares where it is valid:
 * - If `supportedLocations` is omitted, treat it as valid for BOTH origin and target.
 */
export interface TokenDto extends Omit<KimaApiTokenDto, 'decimals'> {
  decimals: number
  isPermit2?: boolean
  protocol?: TokenProtocol
  supportedLocations?: readonly Location[] // ['origin'], ['target'], or ['origin','target'] (default)
}
