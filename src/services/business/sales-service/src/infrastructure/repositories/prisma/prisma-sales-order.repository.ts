import { Injectable } from '@nestjs/common'
import { PageResult, SalesOrderRecord, SalesOrderSearchInput } from '../../../domain/models/sales-records'
import { SalesOrderRepository } from '../../../domain/repositories/sales-order.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaSalesRecordMapper } from './prisma-sales-record.mapper'

/** PrismaSalesOrderRepository persists established orders plus gate and handoff summaries in PostgreSQL. */
@Injectable()
export class PrismaSalesOrderRepository implements SalesOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextSalesOrderNo(tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      const existing = await client.salesSequenceCounter.findUnique({
        where: {
          tenantId
        }
      })

      if (!existing) {
        await client.salesSequenceCounter.create({
          data: {
            tenantId,
            nextQuoteNo: 1,
            nextSalesOrderNo: 2
          }
        })

        return formatDocumentNo('SO', 1)
      }

      const updated = await client.salesSequenceCounter.update({
        where: {
          tenantId
        },
        data: {
          nextSalesOrderNo: {
            increment: 1
          }
        },
        select: {
          nextSalesOrderNo: true
        }
      })

      return formatDocumentNo('SO', updated.nextSalesOrderNo - 1)
    })
  }

  async findById(tenantId: string, salesOrderId: string): Promise<SalesOrderRecord | null> {
    const record = await this.prisma.getExecutionClient().salesOrder.findFirst({
      where: {
        tenantId,
        id: salesOrderId
      },
      include: PrismaSalesRecordMapper.salesOrderIncludeValue()
    })

    return record ? PrismaSalesRecordMapper.toSalesOrder(record) : null
  }

  async findByQuoteVersionId(tenantId: string, quoteVersionId: string): Promise<SalesOrderRecord | null> {
    const record = await this.prisma.getExecutionClient().salesOrder.findFirst({
      where: {
        tenantId,
        quoteVersionId
      },
      include: PrismaSalesRecordMapper.salesOrderIncludeValue()
    })

    return record ? PrismaSalesRecordMapper.toSalesOrder(record) : null
  }

  async findLineById(
    tenantId: string,
    salesOrderLineId: string
  ): Promise<{ order: SalesOrderRecord; line: SalesOrderRecord['lines'][number] } | null> {
    const record = await this.prisma.getExecutionClient().salesOrder.findFirst({
      where: {
        tenantId,
        lines: {
          some: {
            id: salesOrderLineId
          }
        }
      },
      include: PrismaSalesRecordMapper.salesOrderIncludeValue()
    })
    if (!record) {
      return null
    }

    const order = PrismaSalesRecordMapper.toSalesOrder(record)
    const line = order.lines.find((candidate) => candidate.salesOrderLineId === salesOrderLineId)
    if (!line) {
      return null
    }

    return {
      order,
      line
    }
  }

  async save(order: SalesOrderRecord): Promise<SalesOrderRecord> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.salesOrder.upsert({
        where: {
          id: order.id
        },
        create: {
          id: order.id,
          salesOrderNo: order.salesOrderNo,
          tenantId: order.tenantId,
          customerTenantPartyId: order.customerTenantPartyId,
          quoteId: order.quoteId,
          quoteVersionId: order.quoteVersionId
        },
        update: {
          salesOrderNo: order.salesOrderNo,
          customerTenantPartyId: order.customerTenantPartyId,
          quoteId: order.quoteId,
          quoteVersionId: order.quoteVersionId
        }
      })

      await client.salesOrderCommercialGateSummary.upsert({
        where: {
          salesOrderId: order.id
        },
        create: {
          salesOrderId: order.id,
          tenantId: order.tenantId,
          orderEstablished: order.commercialGateSummary.orderEstablished,
          productionGate: order.commercialGateSummary.productionGate,
          stockingGate: order.commercialGateSummary.stockingGate,
          shippingGate: order.commercialGateSummary.shippingGate
        },
        update: {
          orderEstablished: order.commercialGateSummary.orderEstablished,
          productionGate: order.commercialGateSummary.productionGate,
          stockingGate: order.commercialGateSummary.stockingGate,
          shippingGate: order.commercialGateSummary.shippingGate
        }
      })

      await client.salesOrderFulfillmentHandoffSummary.upsert({
        where: {
          salesOrderId: order.id
        },
        create: {
          salesOrderId: order.id,
          tenantId: order.tenantId,
          status: PrismaSalesRecordMapper.toPersistedHandoffStatus(order.fulfillmentHandoffStatus.status),
          submittedAt: order.fulfillmentHandoffStatus.submittedAt
            ? new Date(order.fulfillmentHandoffStatus.submittedAt)
            : null
        },
        update: {
          status: PrismaSalesRecordMapper.toPersistedHandoffStatus(order.fulfillmentHandoffStatus.status),
          submittedAt: order.fulfillmentHandoffStatus.submittedAt
            ? new Date(order.fulfillmentHandoffStatus.submittedAt)
            : null
        }
      })

      await client.salesOrderLine.deleteMany({
        where: {
          salesOrderId: order.id
        }
      })

      if (order.lines.length > 0) {
        await client.salesOrderLine.createMany({
          data: order.lines.map((line) => ({
            id: line.salesOrderLineId,
            tenantId: order.tenantId,
            salesOrderId: order.id,
            lineNo: line.lineNo,
            itemId: line.itemId,
            itemSnapshot: PrismaSalesRecordMapper.toInputJson(line.itemSnapshot),
            salesConfigSnapshot: PrismaSalesRecordMapper.toInputJson(line.salesConfigSnapshot),
            packagingRequirementSnapshot: PrismaSalesRecordMapper.toInputJson(
              line.packagingRequirementSnapshot
            ),
            priceQuantityDeliverySnapshot: PrismaSalesRecordMapper.toInputJson(
              line.priceQuantityDeliverySnapshot
            ),
            customerItemSnapshot: PrismaSalesRecordMapper.toInputJson(line.customerItemSnapshot)
          }))
        })
      }

      const saved = await client.salesOrder.findUniqueOrThrow({
        where: {
          id: order.id
        },
        include: PrismaSalesRecordMapper.salesOrderIncludeValue()
      })

      return PrismaSalesRecordMapper.toSalesOrder(saved)
    })
  }

  async search(input: SalesOrderSearchInput): Promise<PageResult<SalesOrderRecord>> {
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    const where = {
      tenantId: input.tenantId,
      customerTenantPartyId: input.customerTenantPartyId,
      quoteVersionId: input.quoteVersionId,
      OR: input.keyword
        ? [
            {
              salesOrderNo: {
                contains: input.keyword,
                mode: 'insensitive' as const
              }
            },
            {
              customerTenantPartyId: {
                contains: input.keyword,
                mode: 'insensitive' as const
              }
            }
          ]
        : undefined,
      commercialGateSummary:
        input.productionGate === undefined &&
        input.stockingGate === undefined &&
        input.shippingGate === undefined
          ? undefined
          : {
              is: {
                productionGate: input.productionGate,
                stockingGate: input.stockingGate,
                shippingGate: input.shippingGate
              }
            }
    }

    const [total, items] = await Promise.all([
      this.prisma.getExecutionClient().salesOrder.count({ where }),
      this.prisma.getExecutionClient().salesOrder.findMany({
        where,
        include: PrismaSalesRecordMapper.salesOrderIncludeValue(),
        orderBy: {
          salesOrderNo: 'asc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items: items.map((item) => PrismaSalesRecordMapper.toSalesOrder(item)),
      total,
      page,
      pageSize
    }
  }
}

/** formatDocumentNo converts one numeric sequence into the frozen sales document summary format. */
function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}
