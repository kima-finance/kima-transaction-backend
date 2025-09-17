import { Pagination } from '@shared/types/pagination'
import { ChainDto } from './chain.dto'

export interface ChainsResponseDto extends Pagination {
  Chains: ChainDto[]
}
