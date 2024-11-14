import { TransactionDetails } from './transaction-details'

export interface SubmitRequestDto extends TransactionDetails {
  htlcCreationHash?: string
  htlcCreationVout?: number
  htlcExpirationTimestamp?: string
  htlcVersion?: string
  senderPubKey?: string
}
