import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Prisma } from '../../../../prisma/generated/prisma'
import { PROCUREMENT_ALREADY_EXISTS } from '../../../common/errors/procurement.errors'
import {
  PageResult,
  PurchaseOrderChangeRecord,
  PurchaseOrderRecord,
  SearchPurchaseOrdersInput
} from '../../../domain/models/procurement-records'
import {
  ListPurchaseOrderChangesInput,
  PurchaseOrderRepository
} from '../../../domain/repositories/purchase-order.repository'
import { normalizePageInput, paginate } from '../../../application/support/procurement-assertions'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaProcurementRecordMapper } from './prisma-procurement-record.mapper'

/** PrismaPurchaseOrderRepository persists PO aggregates, applied changes, and search reads inside the procurement database. */
@Injectable()
export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextOrderNo(_tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.procurementSequenceCounter.upsert({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        create: {
          tenantId: GLOBAL_SEQUENCE_KEY,
          nextPurchaseOrderNo: 1
        },
        update: {}
      })

      const row = await client.procurementSequenceCounter.update({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        data: {
          nextPurchaseOrderNo: {
            increment: 1
          }
        },
        select: {
          nextPurchaseOrderNo: true
        }
      })

      return formatDocumentNo('PO', row.nextPurchaseOrderNo - 1)
    })
  }

  async findById(tenantId: string, purchaseOrderId: string): Promise<PurchaseOrderRecord | null> {
    const row = await this.prisma.getExecutionClient().purchaseOrder.findFirst({
      where: {
        tenantId,
        id: purchaseOrderId
      },
      include: PrismaProcurementRecordMapper.purchaseOrderIncludeValue()
    })

    return row ? PrismaProcurementRecordMapper.toPurchaseOrder(row) : null
  }

  async save(record: PurchaseOrderRecord): Promise<PurchaseOrderRecord> {
    try {
      return await this.prisma.runInTransaction(async () => {
        const client = this.prisma.getExecutionClient()
        await client.purchaseOrder.upsert({
          where: {
            id: record.purchaseOrderId
          },
          create: {
            id: record.purchaseOrderId,
            orderNo: record.orderNo,
            tenantId: record.tenantId,
            orgId: record.orgId ?? null,
            status: PrismaProcurementRecordMapper.toPersistedPurchaseOrderStatus(record.status),
            currencyCode: record.currencyCode,
            supplierId: record.supplierId,
            supplierDisplayName: record.supplierSnapshot.supplierDisplayName,
            supplierStatusAtIssue: record.supplierSnapshot.supplierStatusAtIssue ?? null,
            paymentTermsCode: record.paymentTermsSnapshot?.paymentTermsCode ?? null,
            paymentTermsText: record.paymentTermsSnapshot?.paymentTermsText ?? null,
            incotermCode: record.supplierCommercialTermsSnapshot?.incotermCode ?? null,
            commercialTermsText: record.supplierCommercialTermsSnapshot?.commercialTermsText ?? null,
            paymentStatusSummary: record.paymentSummary?.paymentStatusSummary ?? null,
            depositPaidAmount: record.paymentSummary?.depositPaidAmount ?? null,
            balancePaidAmount: record.paymentSummary?.balancePaidAmount ?? null,
            paymentSummaryCurrencyCode: record.paymentSummary?.currencyCode ?? null,
            attachmentRefs: PrismaProcurementRecordMapper.toInputJson(record.paymentSummary?.attachmentRefs ?? []),
            lastPaymentAt: record.paymentSummary?.lastPaymentAt
              ? new Date(record.paymentSummary.lastPaymentAt)
              : null,
            sourcePurchaseRequestIds: PrismaProcurementRecordMapper.toInputJson(record.sourcePurchaseRequestIds),
            sourcePurchaseRequestNos: PrismaProcurementRecordMapper.toInputJson(record.sourcePurchaseRequestNos ?? []),
            acknowledgementStatus: PrismaProcurementRecordMapper.toPersistedSupplierAcknowledgementStatus(record.supplierAcknowledgement.acknowledgementStatus),
            acknowledgedAt: record.supplierAcknowledgement.acknowledgedAt ? new Date(record.supplierAcknowledgement.acknowledgedAt) : null,
            acknowledgementExternalReference: record.supplierAcknowledgement.externalReference ?? null,
            acknowledgementComment: record.supplierAcknowledgement.comment ?? null,
            issueComment: record.issueComment ?? null,
            cancelReason: record.cancelReason ?? null,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null
          },
          update: {
            orderNo: record.orderNo,
            orgId: record.orgId ?? null,
            status: PrismaProcurementRecordMapper.toPersistedPurchaseOrderStatus(record.status),
            currencyCode: record.currencyCode,
            supplierId: record.supplierId,
            supplierDisplayName: record.supplierSnapshot.supplierDisplayName,
            supplierStatusAtIssue: record.supplierSnapshot.supplierStatusAtIssue ?? null,
            paymentTermsCode: record.paymentTermsSnapshot?.paymentTermsCode ?? null,
            paymentTermsText: record.paymentTermsSnapshot?.paymentTermsText ?? null,
            incotermCode: record.supplierCommercialTermsSnapshot?.incotermCode ?? null,
            commercialTermsText: record.supplierCommercialTermsSnapshot?.commercialTermsText ?? null,
            paymentStatusSummary: record.paymentSummary?.paymentStatusSummary ?? null,
            depositPaidAmount: record.paymentSummary?.depositPaidAmount ?? null,
            balancePaidAmount: record.paymentSummary?.balancePaidAmount ?? null,
            paymentSummaryCurrencyCode: record.paymentSummary?.currencyCode ?? null,
            attachmentRefs: PrismaProcurementRecordMapper.toInputJson(record.paymentSummary?.attachmentRefs ?? []),
            lastPaymentAt: record.paymentSummary?.lastPaymentAt
              ? new Date(record.paymentSummary.lastPaymentAt)
              : null,
            sourcePurchaseRequestIds: PrismaProcurementRecordMapper.toInputJson(record.sourcePurchaseRequestIds),
            sourcePurchaseRequestNos: PrismaProcurementRecordMapper.toInputJson(record.sourcePurchaseRequestNos ?? []),
            acknowledgementStatus: PrismaProcurementRecordMapper.toPersistedSupplierAcknowledgementStatus(record.supplierAcknowledgement.acknowledgementStatus),
            acknowledgedAt: record.supplierAcknowledgement.acknowledgedAt ? new Date(record.supplierAcknowledgement.acknowledgedAt) : null,
            acknowledgementExternalReference: record.supplierAcknowledgement.externalReference ?? null,
            acknowledgementComment: record.supplierAcknowledgement.comment ?? null,
            issueComment: record.issueComment ?? null,
            cancelReason: record.cancelReason ?? null,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
            issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
            cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null
          }
        })

        const existingLineIds = await client.purchaseOrderLine.findMany({
          where: {
            purchaseOrderId: record.purchaseOrderId
          },
          select: {
            id: true
          }
        })
        if (existingLineIds.length > 0) {
          await client.purchaseOrderLineAllocation.deleteMany({
            where: {
              purchaseOrderLineId: {
                in: existingLineIds.map((line) => line.id)
              }
            }
          })
        }
        await client.purchaseOrderLine.deleteMany({
          where: {
            purchaseOrderId: record.purchaseOrderId
          }
        })
        await client.purchaseOrderChange.deleteMany({
          where: {
            purchaseOrderId: record.purchaseOrderId
          }
        })

        if (record.lines.length > 0) {
          await client.purchaseOrderLine.createMany({
            data: record.lines.map((line) => ({
              id: line.purchaseOrderLineId,
              tenantId: record.tenantId,
              purchaseOrderId: record.purchaseOrderId,
              lineNo: line.lineNo,
              lineType: PrismaProcurementRecordMapper.toPersistedPurchaseRequestLineType(line.lineType),
              itemId: line.itemId ?? null,
              itemCode: line.itemCode ?? null,
              itemName: line.itemName ?? null,
              description: line.description,
                supplierOfferingId: line.supplierOfferingId ?? null,
                orderedQuantity: line.orderedQuantity,
                uom: line.uom,
                orderedUnitPrice: line.orderedUnitPrice ?? null,
                sourcePurchaseRequestLineId: line.sourcePurchaseRequestLineId ?? null,
                sourceRequestedQuantity: line.sourceRequestedQuantity ?? null,
                generalStockExcessReason: line.generalStockExcessReason ?? null
              }))
          })
          await client.purchaseOrderLineAllocation.createMany({
            data: record.lines.flatMap((line) =>
              line.allocations.map((allocation) => ({
                id: allocation.purchaseOrderLineAllocationId,
                tenantId: record.tenantId,
                purchaseOrderLineId: line.purchaseOrderLineId,
                allocationType: PrismaProcurementRecordMapper.toPersistedPurchaseOrderAllocationType(allocation.allocationType),
                sourceReferenceId: allocation.sourceReferenceId ?? null,
                quantity: allocation.quantity,
                reason: allocation.reason ?? null,
                targetWarehouseId: allocation.targetWarehouseId ?? null,
                targetReceivingAddressId: allocation.targetReceivingAddressId ?? null
              }))
            )
          })
        }

        if (record.changes.length > 0) {
          await client.purchaseOrderChange.createMany({
            data: record.changes.map((change) => ({
              id: change.purchaseOrderChangeId,
              tenantId: record.tenantId,
              purchaseOrderId: record.purchaseOrderId,
              changeType: change.changeType,
              changeSummary: change.changeSummary,
              changeReason: change.changeReason ?? null,
              appliedByOperatorId: change.appliedBy.operatorId,
              appliedByDisplayName: change.appliedBy.displayName,
              appliedAt: new Date(change.appliedAt),
              status: PrismaProcurementRecordMapper.toPersistedPurchaseOrderChangeStatus(change.status)
            }))
          })
        }

        const saved = await client.purchaseOrder.findUniqueOrThrow({
          where: {
            id: record.purchaseOrderId
          },
          include: PrismaProcurementRecordMapper.purchaseOrderIncludeValue()
        })

        return PrismaProcurementRecordMapper.toPurchaseOrder(saved)
      })
    } catch (error) {
      if (isOrderNoUniqueViolation(error)) {
        throw ExceptionFactory.application(PROCUREMENT_ALREADY_EXISTS, {
          reason: 'orderNo is already occupied by another purchase order',
          orderNo: record.orderNo,
          purchaseOrderId: record.purchaseOrderId
        })
      }
      throw error
    }
  }

  async search(input: SearchPurchaseOrdersInput): Promise<PageResult<PurchaseOrderRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().purchaseOrder.findMany({
      where: {
        tenantId: input.tenantId
      },
      include: PrismaProcurementRecordMapper.purchaseOrderIncludeValue(),
      orderBy: {
        orderNo: 'asc'
      }
    })
    const filtered = rows
      .map((row) => PrismaProcurementRecordMapper.toPurchaseOrder(row))
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.supplierId || record.supplierId === input.supplierId)
      .filter((record) => !input.itemId || record.lines.some((line) => line.itemId === input.itemId))
      .filter((record) => !input.requestNo || (record.sourcePurchaseRequestNos ?? []).includes(input.requestNo))
      .filter((record) => {
        if (!input.issuedFrom && !input.issuedTo) {
          return true
        }
        const issuedAt = record.issuedAt
        if (!issuedAt) {
          return false
        }
        if (input.issuedFrom && issuedAt < input.issuedFrom) {
          return false
        }
        if (input.issuedTo && issuedAt > input.issuedTo) {
          return false
        }
        return true
      })
      .filter((record) => {
        if (!input.keyword) {
          return true
        }
        const keyword = input.keyword.toLowerCase()
        return (
          record.orderNo.toLowerCase().includes(keyword) ||
          record.supplierSnapshot.supplierDisplayName.toLowerCase().includes(keyword) ||
          (record.sourcePurchaseRequestNos ?? []).some((requestNo) => requestNo.toLowerCase().includes(keyword))
        )
      })

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async listChanges(input: ListPurchaseOrderChangesInput): Promise<PageResult<PurchaseOrderChangeRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const record = await this.findById(input.tenantId, input.purchaseOrderId)
    if (!record) {
      return {
        items: [],
        total: 0,
        page,
        pageSize
      }
    }

    const { pageItems, total } = paginate(record.changes, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async existsBySourcePurchaseRequestId(tenantId: string, purchaseRequestId: string): Promise<boolean> {
    const rows = await this.prisma.getExecutionClient().purchaseOrder.findMany({
      where: {
        tenantId
      },
      select: {
        sourcePurchaseRequestIds: true
      }
    })
    return rows.some((row) => PrismaProcurementRecordMapper.fromJson<string[]>(row.sourcePurchaseRequestIds).includes(purchaseRequestId))
  }

  async findBySourcePurchaseRequestId(
    tenantId: string,
    purchaseRequestId: string
  ): Promise<PurchaseOrderRecord[]> {
    const rows = await this.prisma.getExecutionClient().purchaseOrder.findMany({
      where: {
        tenantId
      },
      include: PrismaProcurementRecordMapper.purchaseOrderIncludeValue(),
      orderBy: {
        orderNo: 'asc'
      }
    })

    return rows
      .map((row) => PrismaProcurementRecordMapper.toPurchaseOrder(row))
      .filter((record) => record.sourcePurchaseRequestIds.includes(purchaseRequestId))
  }
}

const GLOBAL_SEQUENCE_KEY = '__global_procurement_sequences__'

function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}

function isOrderNoUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
