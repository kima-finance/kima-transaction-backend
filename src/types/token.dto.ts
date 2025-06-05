export interface KimaApiTokenDto {
  symbol: string
  address: string
  decimals: string
  peggedTo: string // currency symbol i.e. USD, EUR
}

export interface TokenDto extends Omit<KimaApiTokenDto, 'decimals'> {
  decimals: number
}
