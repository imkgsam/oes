import { PageResult } from '../models/sales-records'
import {
  PriceListLineListInput,
  PriceListRecord,
  PriceListSearchInput
} from '../models/pricing-records'

/** PriceListRepository persists tenant-scoped pricing list heads and line-level sales pricing baselines. */
export interface PriceListRepository {
  findById(tenantId: string, priceListId: string): Promise<PriceListRecord | null>
  save(record: PriceListRecord): Promise<PriceListRecord>
  search(input: PriceListSearchInput): Promise<PageResult<PriceListRecord>>
  listLines(input: PriceListLineListInput): Promise<PageResult<PriceListRecord['lines'][number]>>
}
