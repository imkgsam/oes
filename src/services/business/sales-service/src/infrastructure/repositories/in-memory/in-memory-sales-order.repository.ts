import { Injectable } from '@nestjs/common'
import { PageResult, SalesOrderRecord, SalesOrderSearchInput, cloneRecord } from '../../../domain/models/sales-records'
import { SalesOrderRepository } from '../../../domain/repositories/sales-order.repository'
import { paginate } from '../../../application/support/sales-assertions'
import { SalesInMemoryStore } from '../../store/sales-in-memory-store'

/** InMemorySalesOrderRepository stores established orders, commercial gates, and handoff summaries in-process. */
@Injectable()
export class InMemorySalesOrderRepository implements SalesOrderRepository {
  constructor(private readonly store: SalesInMemoryStore) {}

  async nextSalesOrderNo(_tenantId: string): Promise<string> {
    return this.store.nextSalesOrderNo()
  }

  async findById(tenantId: string, salesOrderId: string): Promise<SalesOrderRecord | null> {
    const order = this.store.salesOrders.get(salesOrderId)
    if (!order || order.tenantId !== tenantId) {
      return null
    }

    return cloneRecord(order)
  }

  async findByQuoteVersionId(tenantId: string, quoteVersionId: string): Promise<SalesOrderRecord | null> {
    const order = [...this.store.salesOrders.values()].find(
      (candidate) => candidate.tenantId === tenantId && candidate.quoteVersionId === quoteVersionId
    )

    return order ? cloneRecord(order) : null
  }

  async findLineById(
    tenantId: string,
    salesOrderLineId: string
  ): Promise<{ order: SalesOrderRecord; line: SalesOrderRecord['lines'][number] } | null> {
    const order = [...this.store.salesOrders.values()].find(
      (candidate) =>
        candidate.tenantId === tenantId &&
        candidate.lines.some((line) => line.salesOrderLineId === salesOrderLineId)
    )
    if (!order) {
      return null
    }

    const line = order.lines.find((candidate) => candidate.salesOrderLineId === salesOrderLineId)
    if (!line) {
      return null
    }

    return {
      order: cloneRecord(order),
      line: cloneRecord(line)
    }
  }

  async save(order: SalesOrderRecord): Promise<SalesOrderRecord> {
    const stored = cloneRecord(order)
    this.store.salesOrders.set(stored.id, stored)
    return cloneRecord(stored)
  }

  async search(input: SalesOrderSearchInput): Promise<PageResult<SalesOrderRecord>> {
    const filtered = [...this.store.salesOrders.values()]
      .filter((order) => order.tenantId === input.tenantId)
      .filter((order) => !input.customerTenantPartyId || order.customerTenantPartyId === input.customerTenantPartyId)
      .filter((order) => !input.quoteVersionId || order.quoteVersionId === input.quoteVersionId)
      .filter((order) => input.productionGate === undefined || order.commercialGateSummary.productionGate === input.productionGate)
      .filter((order) => input.stockingGate === undefined || order.commercialGateSummary.stockingGate === input.stockingGate)
      .filter((order) => input.shippingGate === undefined || order.commercialGateSummary.shippingGate === input.shippingGate)
      .filter((order) => {
        if (!input.keyword) {
          return true
        }

        const keyword = input.keyword.toLowerCase()
        return order.salesOrderNo.toLowerCase().includes(keyword) || order.customerTenantPartyId.toLowerCase().includes(keyword)
      })
      .sort((left, right) => left.salesOrderNo.localeCompare(right.salesOrderNo))
      .map((order) => cloneRecord(order))

    const { pageItems, total } = paginate(filtered, input.page ?? 1, input.pageSize ?? 20)
    return {
      items: pageItems,
      total,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }
}
