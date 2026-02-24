import { KimaApiTokenDto, TokenDto } from './token.dto'

export interface ChainDto {
  id: string
  name: string
  symbol: string
  // remote token metadata from kima-blockchain (includes optional isPermit2)
  tokens: KimaApiTokenDto[]
  disabled: boolean
  isEvm: boolean
  derivationAlgorithm: DerivationAlgorithm
}

export type DerivationAlgorithm = 'ECDSA' | 'EDDSA'
