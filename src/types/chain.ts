import { Chain as ViemChain } from 'viem'
import { TokenDto } from './token.dto'

export enum ChainCompatibility {
  BTC = 'BTC',
  EVM = 'EVM',
  FIAT = 'FIAT',
  COSMOS = 'COSMOS',
  SELF = 'SELF',
  CC = 'CC'
}

export interface Chain extends ViemChain {
  shortName: string
  compatibility: ChainCompatibility
  faucets?: string[]
  supportedTokens: TokenDto[]
  disabled?: boolean
}
