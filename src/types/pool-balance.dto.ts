export interface PoolBalanceDto {
  index: string
  chainName: string
  balance: PoolTokenBalanceDto[]
  nativeGasAmount: string
}

export interface PoolTokenBalanceDto {
  amount: string
  tokenSymbol: string
  decimal: string
}
