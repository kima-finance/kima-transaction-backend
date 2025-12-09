import { z } from 'zod'
import { TransactionDetails } from './transaction-details'
import { SwapDetails } from './swap-details'
import { ChainName } from '@features/chains/types/chain-name'

const NON_ADDRESS_CHAINS: ChainName[] = [
  ChainName.FIAT,
  ChainName.CC,
  ChainName.BANK
]

export const SubmitRequestSchema = TransactionDetails.extend({
  decimals: z.number(),
  htlcCreationHash: z.string().optional(),
  htlcCreationVout: z.number().optional(),
  htlcExpirationTimestamp: z.string().optional(),
  htlcVersion: z.string().optional(),
  senderPubKey: z.string().optional(),
  options: z.string().optional(),
  fiatTransactionIdSeed: z.string().optional(),
  mode: z.enum(['bridge', 'light', 'payment']).optional(),
  feeDeduct: z.boolean().optional()
}).superRefine((data, ctx) => {
  const needsOriginAddress = !NON_ADDRESS_CHAINS.includes(
    data.originChain as ChainName
  )
  if (
    needsOriginAddress &&
    (!data.originAddress || data.originAddress.trim() === '')
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['originAddress'],
      message: 'originAddress is required unless originChain is FIAT/CC/BANK'
    })
  }
})

export const SubmitExternalRequestSchema = TransactionDetails.extend({
  decimals: z.number(),
  options: z.string().optional(),
  mode: z.enum(['bridge', 'light', 'payment']).optional(),
  feeDeduct: z.boolean().optional()
}).superRefine((data, ctx) => {
  const needsOriginAddress = !NON_ADDRESS_CHAINS.includes(
    data.originChain as ChainName
  )
  if (
    needsOriginAddress &&
    (!data.originAddress || data.originAddress.trim() === '')
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['originAddress'],
      message: 'originAddress is required unless originChain is FIAT/CC/BANK'
    })
  }
})

export const SubmitSwapRequestSchema = SwapDetails.extend({
  decimals: z.number().optional(),

  amountInDecimals: z.number().int().positive().optional(),
  amountOutDecimals: z.number().int().positive().optional(),

  options: z.string().optional(),
  fiatTransactionIdSeed: z.string().optional(),
  mode: z.enum(['bridge', 'light', 'payment']).optional(),
  feeDeduct: z.boolean().optional()
}).superRefine((data, ctx) => {
  const needsOriginAddress = !NON_ADDRESS_CHAINS.includes(
    data.originChain as ChainName
  )
  if (
    needsOriginAddress &&
    (!data.originAddress || data.originAddress.trim() === '')
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['originAddress'],
      message: 'originAddress is required unless originChain is FIAT/CC/BANK'
    })
  }
})

export type SubmitRequestDto = z.infer<typeof SubmitRequestSchema>
export type SubmitExternalRequestDto = z.infer<typeof SubmitExternalRequestSchema>
export type SubmitSwapRequestDto = z.infer<typeof SubmitSwapRequestSchema>