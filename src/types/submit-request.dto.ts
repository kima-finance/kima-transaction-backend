import { TransactionDetails } from './transaction-details'

export interface SubmitRequestDto extends TransactionDetails {
  decimals: number
  htlcCreationHash?: string
  htlcCreationVout?: number
  htlcExpirationTimestamp?: string
  htlcVersion?: string
  senderPubKey?: string
  options?: string
}
