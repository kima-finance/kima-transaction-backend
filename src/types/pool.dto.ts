import { PoolBalanceDto } from './pool-balance.dto'

export interface PoolDto extends Omit<PoolBalanceDto, 'index'> {
  poolAddress: string
}
