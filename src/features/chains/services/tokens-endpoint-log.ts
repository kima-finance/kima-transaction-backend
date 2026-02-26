import { ChainDto } from '../types/chain.dto'

export interface TokensEndpointLogPayload {
  chainCount: number
  responseShape: string[]
  tokenShape: string[]
  chains: {
    chainSymbol: string
    tokenCount: number
    tokens: string[]
  }[]
}

export const buildTokensEndpointLogPayload = (
  chains: ChainDto[]
): TokensEndpointLogPayload => {
  const firstToken = chains.flatMap((chain) => chain.tokens ?? [])[0]

  return {
    chainCount: chains.length,
    responseShape: ['Chain'],
    tokenShape: firstToken ? Object.keys(firstToken).sort() : [],
    chains: chains.map((chain) => ({
      chainSymbol: chain.symbol,
      tokenCount: chain.tokens?.length ?? 0,
      tokens: (chain.tokens ?? []).map((token) => token.symbol)
    }))
  }
}
