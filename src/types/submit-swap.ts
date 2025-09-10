import { z } from 'zod'
import { TransactionDetails } from './transaction-details'

export type TransactionDetailsType = z.infer<typeof TransactionDetails>

export interface SubmitTransaction extends TransactionDetailsType {
  htlcCreationHash?: string
  htlcCreationVout?: number
  htlcExpirationTimestamp?: number
  htlcVersion?: string
  senderPubKey?: string
  options?: string
}
