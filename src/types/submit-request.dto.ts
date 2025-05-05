import { z } from 'zod'
import { TransactionDetails } from './transaction-details'

export const SubmitRequestSchema = TransactionDetails.extend({
  decimals: z.number(),
  htlcCreationHash: z.string().optional(),
  htlcCreationVout: z.number().optional(),
  htlcExpirationTimestamp: z.string().optional(),
  htlcVersion: z.string().optional(),
  senderPubKey: z.string().optional(),
  options: z.string().optional()
}).superRefine((data, ctx) => {
  // Custom rule: originAddress is required unless originChain === 'FIAT'
  if (
    data.originChain !== 'CC' && data.originChain !== 'FIAT' &&
    (!data.originAddress || data.originAddress.trim() === '')
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['originAddress'],
      message: 'originAddress is required when originChain is not FIAT'
    })
  }
})

// Optional: Export the inferred type
export type SubmitRequestDto = z.infer<typeof SubmitRequestSchema>
