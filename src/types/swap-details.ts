import { z } from 'zod'

export const SwapDetails= z.object({
  originAddress: z.string(),
  originChain: z.string(),
  targetAddress: z.string(),
  targetChain: z.string(),
  originSymbol: z.string(),
  targetSymbol: z.string(),
  amountIn: z.string(), // assumed as bigint string
  amountOut: z.string(), // assumed as bigint string
  fee: z.string(),     // assumed as bigint string
  dex: z.string(),
  slippage: z.string(),
})
