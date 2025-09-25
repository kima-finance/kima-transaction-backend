import { Chain as ViemChain } from 'viem'
import { TokenDto } from './token.dto'
import { z } from 'zod'
import { ChainName } from './chain-name'

export enum ChainCompatibility {
  BANK = 'BANK',
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
  supportedLocations: Location[]
  supportedTokens: TokenDto[]
  disabled?: boolean
}

const filterMode = z.enum(['whitelist', 'blacklist'])
export type ChainFilterMode = z.infer<typeof filterMode>

const chainFilterSchema = z.object({
  mode: filterMode,
  chains: z.array(z.nativeEnum(ChainName)).nonempty()
})
export type ChainList = [ChainName, ...ChainName[]]

export const filterConfigSchema = z
  .object({
    origin: chainFilterSchema.optional(),
    target: chainFilterSchema.optional()
  })
  .optional()

export type FilterConfig = z.infer<typeof filterConfigSchema>
export type ChainFilterConfig = z.infer<typeof chainFilterSchema>

export const locationSchema = z.enum(['origin', 'target'])
export type Location = z.infer<typeof locationSchema>

export const DEFAULT_TOKEN_LOCATIONS: Readonly<Location[]> = [
  'origin',
  'target'
] as const

/**
 * Example filter config
 * const chainFilter = {
  source: {
    mode: 'whitelist',
    chains: ["ARB", "OPT"]
  },
  target: {
    mode: 'blacklist',
    chains: ["TRX"]
  }
} satisfies FilterConfig
 */
