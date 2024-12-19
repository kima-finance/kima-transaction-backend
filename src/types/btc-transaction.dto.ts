export interface BtcTransactionDto {
  txid: string
  version: number
  locktime: number
  vin: {
    txid: string
    vout: number
    prevout: {
      scriptpubkey: string
      scriptpubkey_asm: string
      scriptpubkey_type: string
      scriptpubkey_address: string
      value: number
    }
    scriptsig: string
    scriptsig_asm: string
    is_coinbase: boolean
    sequence: number
  }[]
  vout: {
    scriptpubkey: string
    scriptpubkey_asm: string
    scriptpubkey_type: string
    scriptpubkey_address: string
    value: number
    n: number
    spent_by: string
  }[]
  size: number
  weight: number
  fee: number
  status: {
    confirmed: boolean
  }
}
