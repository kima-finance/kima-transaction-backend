import { ChainDto } from './chain.dto.'
import { Pagination } from './pagination'

export interface ChainsResponseDto extends Pagination {
  Chains: ChainDto[]
}
