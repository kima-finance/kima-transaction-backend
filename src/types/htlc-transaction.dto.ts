export interface HtlcTransactionDto {
  id: string
  senderAddress: string
  senderPubkey: string
  htlcTimestamp: string
  amount: string
  txHash: string
  status: string
  errReason: string
  creator: string
  htlcAddress: string
  pull_status: string
}

export interface HtlcTransactionResponseDto {
  htlcLockingTransaction: HtlcTransactionDto[]
}
