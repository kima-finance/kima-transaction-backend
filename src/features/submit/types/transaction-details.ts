import { z } from 'zod'

export const TransactionDetails= z.object({
  originAddress: z.string(),
  originChain: z.string(),
  targetAddress: z.string(),
  targetChain: z.string(),
  originSymbol: z.string(),
  targetSymbol: z.string(),
  amount: z.string(), // assumed as bigint string
  fee: z.string()     // assumed as bigint string
})
