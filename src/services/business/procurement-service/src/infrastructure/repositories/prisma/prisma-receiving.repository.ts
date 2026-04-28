import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Prisma } from '../../../../prisma/generated/prisma'
import { PROCUREMENT_ALREADY_EXISTS } from '../../../common/errors/procurement.errors'
import {
  PageResult,
  ReceivingExpectationRecord,
  SearchReceivingExpectationsInput
} from '../../../domain/models/procurement-records'
import { ReceivingRepository } from '../../../domain/repositories/receiving.repository'
import { normalizePageInput, paginate } from '../../../application/support/procurement-assertions'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaProcurementRecordMapper } from './prisma-procurement-record.mapper'

/** PrismaReceivingRepository persists procurement-owned expectation and discrepancy summaries inside the service database. */
@Injectable()
export class PrismaReceivingRepository implements ReceivingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextExpectationNo(_tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.procurementSequenceCounter.upsert({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        create: {
          tenantId: GLOBAL_SEQUENCE_KEY,
          nextReceivingExpectationNo: 1
        },
        update: {}
      })

      const row = await client.procurementSequenceCounter.update({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        data: {
          nextReceivingExpectationNo: {
            increment: 1
          }
        },
        select: {
          nextReceivingExpectationNo: true
        }
      })

      return formatDocumentNo('RE', row.nextReceivingExpectationNo - 1)
    })
  }

  async findById(tenantId: string, receivingExpectationId: string): Promise<ReceivingExpectationRecord | null> {
    const row = await this.prisma.getExecutionClient().receivingExpectation.findFirst({
      where: {
        tenantId,
        id: receivingExpectationId
      },
      include: PrismaProcurementRecordMapper.receivingExpectationIncludeValue()
    })

    return row ? PrismaProcurementRecordMapper.toReceivingExpectation(row) : null
  }

  async findByPurchaseOrderLineId(
    tenantId: string,
    purchaseOrderLineId: string
  ): Promise<ReceivingExpectationRecord | null> {
    const row = await this.prisma.getExecutionClient().receivingExpectation.findFirst({
      where: {
        tenantId,
        purchaseOrderLineId
      },
      include: PrismaProcurementRecordMapper.receivingExpectationIncludeValue()
    })

    return row ? PrismaProcurementRecordMapper.toReceivingExpectation(row) : null
  }

  async save(record: ReceivingExpectationRecord): Promise<ReceivingExpectationRecord> {
    try {
      return await this.prisma.runInTransaction(async () => {
        const client = this.prisma.getExecutionClient()
        const expectationNo =
          (await client.receivingExpectation.findUnique({
            where: {
              id: record.receivingExpectationId
            },
            select: {
              expectationNo: true
            }
          }))?.expectationNo ?? (await this.nextExpectationNo(record.tenantId))

        await client.receivingExpectation.upsert({
          where: {
            id: record.receivingExpectationId
          },
          create: {
            id: record.receivingExpectationId,
            expectationNo,
            tenantId: record.tenantId,
            orgId: record.orgId ?? null,
            purchaseOrderId: record.purchaseOrderId,
            purchaseOrderLineId: record.purchaseOrderLineId,
            supplierId: record.supplierId,
            expectedQuantity: record.expectedQuantity,
            receivedQuantitySummary: record.receivedQuantitySummary,
            openQuantity: record.openQuantity,
            expectedReceiptDate: record.expectedReceiptDate ?? null,
            status: PrismaProcurementRecordMapper.toPersistedReceivingExpectationStatus(record.status),
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt)
          },
          update: {
            orgId: record.orgId ?? null,
            purchaseOrderId: record.purchaseOrderId,
            purchaseOrderLineId: record.purchaseOrderLineId,
            supplierId: record.supplierId,
            expectedQuantity: record.expectedQuantity,
            receivedQuantitySummary: record.receivedQuantitySummary,
            openQuantity: record.openQuantity,
            expectedReceiptDate: record.expectedReceiptDate ?? null,
            status: PrismaProcurementRecordMapper.toPersistedReceivingExpectationStatus(record.status),
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt)
          }
        })

        if (record.discrepancy) {
          await client.receivingDiscrepancy.upsert({
            where: {
              receivingExpectationId: record.receivingExpectationId
            },
            create: {
              id: record.discrepancy.receivingDiscrepancyId,
              tenantId: record.tenantId,
              receivingExpectationId: record.receivingExpectationId,
              discrepancyType: PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyType(record.discrepancy.discrepancyType),
              summary: record.discrepancy.summary,
              status: PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyStatus(record.discrepancy.status),
              resolutionCode: PrismaProcurementRecordMapper.toPersistedReceivingResolutionCode(record.discrepancy.resolutionCode),
              resolutionNote: record.discrepancy.resolutionNote ?? null,
              resolvedAt: record.discrepancy.resolvedAt ? new Date(record.discrepancy.resolvedAt) : null
            },
            update: {
              discrepancyType: PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyType(record.discrepancy.discrepancyType),
              summary: record.discrepancy.summary,
              status: PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyStatus(record.discrepancy.status),
              resolutionCode: PrismaProcurementRecordMapper.toPersistedReceivingResolutionCode(record.discrepancy.resolutionCode),
              resolutionNote: record.discrepancy.resolutionNote ?? null,
              resolvedAt: record.discrepancy.resolvedAt ? new Date(record.discrepancy.resolvedAt) : null
            }
          })
        } else {
          await client.receivingDiscrepancy.deleteMany({
            where: {
              receivingExpectationId: record.receivingExpectationId
            }
          })
        }

        const saved = await client.receivingExpectation.findUniqueOrThrow({
          where: {
            id: record.receivingExpectationId
          },
          include: PrismaProcurementRecordMapper.receivingExpectationIncludeValue()
        })

        return PrismaProcurementRecordMapper.toReceivingExpectation(saved)
      })
    } catch (error) {
      if (isReceivingUniqueViolation(error)) {
        throw ExceptionFactory.application(PROCUREMENT_ALREADY_EXISTS, {
          reason: 'receiving expectation already exists for purchase order line',
          purchaseOrderLineId: record.purchaseOrderLineId
        })
      }
      throw error
    }
  }

  async search(input: SearchReceivingExpectationsInput): Promise<PageResult<ReceivingExpectationRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().receivingExpectation.findMany({
      where: {
        tenantId: input.tenantId
      },
      include: PrismaProcurementRecordMapper.receivingExpectationIncludeValue(),
      orderBy: {
        expectationNo: 'asc'
      }
    })
    const filtered = rows
      .map((row) => PrismaProcurementRecordMapper.toReceivingExpectation(row))
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.purchaseOrderId || record.purchaseOrderId === input.purchaseOrderId)
      .filter((record) => !input.supplierId || record.supplierId === input.supplierId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => {
        if (input.hasOpenDiscrepancy === undefined) {
          return true
        }
        const hasOpen = record.discrepancy?.status === 'OPEN'
        return input.hasOpenDiscrepancy ? hasOpen : !hasOpen
      })
      .filter((record) => {
        if (!input.expectedReceiptDateFrom && !input.expectedReceiptDateTo) {
          return true
        }
        const expectedDate = record.expectedReceiptDate
        if (!expectedDate) {
          return false
        }
        if (input.expectedReceiptDateFrom && expectedDate < input.expectedReceiptDateFrom) {
          return false
        }
        if (input.expectedReceiptDateTo && expectedDate > input.expectedReceiptDateTo) {
          return false
        }
        return true
      })

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async existsByPurchaseOrderId(tenantId: string, purchaseOrderId: string): Promise<boolean> {
    const count = await this.prisma.getExecutionClient().receivingExpectation.count({
      where: {
        tenantId,
        purchaseOrderId
      }
    })
    return count > 0
  }
}

const GLOBAL_SEQUENCE_KEY = '__global_procurement_sequences__'

function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}

function isReceivingUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
