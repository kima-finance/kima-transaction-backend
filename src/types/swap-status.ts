export interface SwapTransactionStatus {
  failreason: string
  pullfailcount: number
  pullhash: string
  releasefailcount: number
  releasehash: string
  refundhash: string
  txstatus: string
  amountIn: number
  amountOut: number
  creator: string
  originaddress: string
  originchain: string
  originsymbol: string
  targetsymbol: string
  targetaddress: string
  targetchain: string
  dex: string
  slippage: string
  tx_id: string
  kimahash: string
}

export interface GraphqlSwapTxStatusResponse {
  data: {
    swap_data: SwapTransactionStatus
  }
}

export interface ApiSwapTxStatusResponse {
  swapData: {
    index: string
    originChain: string
    originAddress: string
    targetChain: string
    targetAddress: string
    originSymbol: string
    targetSymbol: string
    amountIn: string
    amountOut: string
    time: string
    status: string
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
    dex: string
    slippage: string
    options: string
  }
}
