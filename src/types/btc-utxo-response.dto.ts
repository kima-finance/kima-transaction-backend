export interface BtcUtxoResponseDto {
  txid: string
  vout: number
  value: number
  status: {
    confirmed: boolean
  }
}
