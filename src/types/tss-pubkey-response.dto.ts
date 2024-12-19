import { Pagination } from './pagination'
import { TssPubkeyDto } from './tss-pubkey.dto'

export interface TssPubkeyResponseDto extends Pagination {
  tssPubkey: TssPubkeyDto[]
}
