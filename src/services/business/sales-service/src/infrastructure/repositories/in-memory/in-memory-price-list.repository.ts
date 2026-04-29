import { Injectable } from '@nestjs/common'
import {
  PriceListLineListInput,
  PriceListRecord,
  PriceListSearchInput
} from '../../../domain/models/pricing-records'
import { PageResult, cloneRecord } from '../../../domain/models/sales-records'
import { PriceListRepository } from '../../../domain/repositories/price-list.repository'
import { SalesInMemoryStore } from '../../store/sales-in-memory-store'
import { normalizePageInput, paginate } from '../../../application/support/sales-assertions'

/** InMemoryPriceListRepository stores price list heads and lines inside the process-local sales skeleton store. */
@Injectable()
export class InMemoryPriceListRepository implements PriceListRepository {
  constructor(private readonly store: SalesInMemoryStore) {}

  async findById(tenantId: string, priceListId: string): Promise<PriceListRecord | null> {
    const record = this.store.priceLists.get(priceListId)
    if (!record || record.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(record)
  }

  async save(record: PriceListRecord): Promise<PriceListRecord> {
    this.store.priceLists.set(record.id, cloneRecord(record))
    return cloneRecord(record)
  }

  async search(input: PriceListSearchInput): Promise<PageResult<PriceListRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const filtered = [...this.store.priceLists.values()]
      .filter((record) => record.tenantId === input.tenantId)
      .filter((record) => !input.keyword || record.priceListName.toLowerCase().includes(input.keyword.toLowerCase()))
      .filter((record) => !input.priceListType || record.priceListType === input.priceListType)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.currencyCode || record.currencyCode === input.currencyCode)
      .filter((record) => isEffectiveAt(record, input.effectiveAt))
      .sort((left, right) => left.priceListName.localeCompare(right.priceListName))

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems.map((item) => cloneRecord(item)),
      total,
      page,
      pageSize
    }
  }

  async listLines(input: PriceListLineListInput): Promise<PageResult<PriceListRecord['lines'][number]>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const record = await this.findById(input.tenantId, input.priceListId)
    if (!record) {
      return {
        items: [],
        total: 0,
        page,
        pageSize
      }
    }

    const filtered = record.lines
      .filter((line) => !input.itemId || line.itemId === input.itemId)
      .sort((left, right) => left.lineNo - right.lineNo)
    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems.map((item) => cloneRecord(item)),
      total,
      page,
      pageSize
    }
  }
}

function isEffectiveAt(record: PriceListRecord, effectiveAt?: string): boolean {
  if (!effectiveAt) {
    return true
  }

  const target = new Date(effectiveAt).getTime()
  const from = new Date(record.effectiveFrom).getTime()
  const to = record.effectiveTo ? new Date(record.effectiveTo).getTime() : Number.POSITIVE_INFINITY
  return target >= from && target <= to
}
