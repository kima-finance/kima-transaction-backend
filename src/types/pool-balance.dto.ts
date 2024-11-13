export interface PoolBalanceDto {
  index: string
  chainName: string
  balance: {
    amount: string
    tokenSymbol: string
    decimal: string
  }[]
  nativeGasAmount: string
}
