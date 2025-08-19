import { z } from 'zod'

export interface KimaApiTokenDto {
  symbol: string
  address: string
  decimals: string
  peggedTo: string // currency symbol i.e. USD, EUR
}

export interface TokenDto extends Omit<KimaApiTokenDto, 'decimals'> {
  decimals: number
  protocol?: TokenProtocol
}

const protocolSchema = z.enum(['credit_card', 'ERC20', 'swift_usd', 'sepa_eur'])
export type TokenProtocol = z.infer<typeof protocolSchema>
