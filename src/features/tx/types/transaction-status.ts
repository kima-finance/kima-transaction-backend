export interface TransactionStatus {
  failreason: string
  pullfailcount: number
  pullhash: string
  releasefailcount: number
  releasehash: string
  refundhash: string
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

export interface GraphqlTxStatusResponse {
  data: {
    transaction_data: TransactionStatus
  }
}

export interface GraphqlLiquidityTxStatusResponse {
  data: {
    liquidity_transaction_data: TransactionStatus
  }
}

export interface ApiLiquidityTxStatusResponse {
  LiquidityTransactionData: {
    index: string
    chain: string
    providerChainAddress: string
    providerKimaAddress: string
    symbol: string
    poolAddr: string
    amount: string
    options: string
    time: string
    status: string
    confirmedBlockHash: string
    signedKey: string
    tssPullHash: string
    tssReleaseHash: string
    tssRefundHash: string
    kimaTxHash: string
    failReason: string
    pullFailCount: string
    releaseFailCount: string
    creator: string
    processing: boolean
    tssMsgId: string
    timestamp: string
    handleId: string
    txType: string
    htlcExpirationTimestamp: string
    htlcCreationHash: string
    htlcCreationVout: number
    htlcVersion: string
    senderPubKey: string | null
  }
}

export interface ApiTxStatusResponse {
  transactionData: {
    index: string
    originChain: string
    originAddress: string
    targetChain: string
    targetAddress: string
    originSymbol: string
    targetSymbol: string
    amount: string
    time: string
    status: string
    confirmedBlockHash: string
    signedKey: string
    fee: string
    tssPullHash: string
    tssReleaseHash: string
    tssRefundHash: string
    kimaTxHash: string
    failReason: string
    pullFailCount: string
    releaseFailCount: string
    creator: string
    processing: boolean
    tssMsgId: string
    timestamp: string
    handleId: string
    htlcExpirationTimestamp: string
    htlcCreationHash: string
    htlcCreationVout: number
    htlcVersion: string
    senderPubKey: string | null
    options: string
  }
}
