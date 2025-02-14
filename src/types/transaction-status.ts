export interface TransactionStatus {
  data: {
    transaction_status: {
      failreason: string
      pullfailcount: number
      pullhash: string
      releasefailcount: number
      releasehash: string
      txstatus: string
      amount: number
      creator: string
      originaddress: string
      originchain: string
      originsymbol: string
      targetsymbol: string
      targetaddress: string
      targetchain: string
      tx_id: string
      kimahash: string
    }
  }
}
