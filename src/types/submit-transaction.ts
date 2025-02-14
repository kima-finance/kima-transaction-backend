import { TransactionDetails } from './transaction-details'

export interface SubmitTransaction extends TransactionDetails {
  htlcCreationHash?: string
  htlcCreationVout?: number
  htlcExpirationTimestamp?: number
  htlcVersion?: string
  senderPubKey?: string
}
