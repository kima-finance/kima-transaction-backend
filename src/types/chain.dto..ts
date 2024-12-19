import { TokenDto } from './token.dto'

export interface ChainDto {
  id: string
  name: string
  symbol: string
  tokens: TokenDto[]
  disabled: boolean
  isEvm: boolean
}
