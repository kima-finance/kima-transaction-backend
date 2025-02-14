import { Pagination } from './pagination'
import { PoolBalanceDto } from './pool-balance.dto'

export interface PoolBalanceResponseDto extends Pagination {
  poolBalance: PoolBalanceDto[]
}
