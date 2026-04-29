import { Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Prisma } from '../../../../prisma/generated/prisma'
import { PROCUREMENT_ALREADY_EXISTS } from '../../../common/errors/procurement.errors'
import {
  PageResult,
  PurchaseRequestLineConversionStatus,
  PurchaseRequestRecord,
  SearchPurchaseRequestsInput
} from '../../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../../domain/repositories/purchase-request.repository'
import { normalizePageInput, paginate } from '../../../application/support/procurement-assertions'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaProcurementRecordMapper } from './prisma-procurement-record.mapper'

/** PrismaPurchaseRequestRepository persists PR aggregates and directory reads inside the procurement database. */
@Injectable()
export class PrismaPurchaseRequestRepository implements PurchaseRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextRequestNo(_tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.procurementSequenceCounter.upsert({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        create: {
          tenantId: GLOBAL_SEQUENCE_KEY,
          nextPurchaseRequestNo: 1
        },
        update: {}
      })

      const row = await client.procurementSequenceCounter.update({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        data: {
          nextPurchaseRequestNo: {
            increment: 1
          }
        },
        select: {
          nextPurchaseRequestNo: true
        }
      })

      return formatDocumentNo('PR', row.nextPurchaseRequestNo - 1)
    })
  }

  async findById(tenantId: string, purchaseRequestId: string): Promise<PurchaseRequestRecord | null> {
    const row = await this.prisma.getExecutionClient().purchaseRequest.findFirst({
      where: {
        tenantId,
        id: purchaseRequestId
      },
      include: PrismaProcurementRecordMapper.purchaseRequestIncludeValue()
    })

    return row ? PrismaProcurementRecordMapper.toPurchaseRequest(row) : null
  }

  async save(record: PurchaseRequestRecord): Promise<PurchaseRequestRecord> {
    try {
      return await this.prisma.runInTransaction(async () => {
        const client = this.prisma.getExecutionClient()
        await client.purchaseRequest.upsert({
          where: {
            id: record.purchaseRequestId
          },
          create: {
            id: record.purchaseRequestId,
            requestNo: record.requestNo,
            tenantId: record.tenantId,
            orgId: record.orgId ?? null,
            requestType: PrismaProcurementRecordMapper.toPersistedPurchaseRequestType(record.requestType),
            status: PrismaProcurementRecordMapper.toPersistedPurchaseRequestStatus(record.status),
            requesterOperatorId: record.requester.operatorId,
            requesterDisplayName: record.requester.displayName,
            title: record.title ?? null,
            reason: record.reason ?? null,
            submissionComment: record.submissionComment ?? null,
            cancelReason: record.cancelReason ?? null,
            linkedPurchaseOrders: PrismaProcurementRecordMapper.toInputJson(record.linkedPurchaseOrders ?? []),
            nextExpectedReceiptDate: record.nextExpectedReceiptDate ?? null,
            receivingStatusSummary: record.receivingStatusSummary ?? null,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
            submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
            decidedAt: record.decidedAt ? new Date(record.decidedAt) : null,
            cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null
          },
          update: {
            requestNo: record.requestNo,
            orgId: record.orgId ?? null,
            requestType: PrismaProcurementRecordMapper.toPersistedPurchaseRequestType(record.requestType),
            status: PrismaProcurementRecordMapper.toPersistedPurchaseRequestStatus(record.status),
            requesterOperatorId: record.requester.operatorId,
            requesterDisplayName: record.requester.displayName,
            title: record.title ?? null,
            reason: record.reason ?? null,
            submissionComment: record.submissionComment ?? null,
            cancelReason: record.cancelReason ?? null,
            linkedPurchaseOrders: PrismaProcurementRecordMapper.toInputJson(record.linkedPurchaseOrders ?? []),
            nextExpectedReceiptDate: record.nextExpectedReceiptDate ?? null,
            receivingStatusSummary: record.receivingStatusSummary ?? null,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
            submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
            decidedAt: record.decidedAt ? new Date(record.decidedAt) : null,
            cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null
          }
        })

        await client.purchaseRequestLine.deleteMany({
          where: {
            purchaseRequestId: record.purchaseRequestId
          }
        })
        if (record.lines.length > 0) {
          await client.purchaseRequestLine.createMany({
            data: record.lines.map((line) => ({
              id: line.purchaseRequestLineId,
              tenantId: record.tenantId,
              purchaseRequestId: record.purchaseRequestId,
              lineNo: line.lineNo,
              lineType: PrismaProcurementRecordMapper.toPersistedPurchaseRequestLineType(line.lineType),
              itemId: line.itemId ?? null,
              itemCode: line.itemCode ?? null,
              itemName: line.itemName ?? null,
              description: line.description,
              requestedQuantity: line.requestedQuantity,
              uom: line.uom,
              neededByDate: line.neededByDate ?? null,
              demandReferenceType: line.demandReferenceType ?? null,
              demandReferenceId: line.demandReferenceId ?? null,
              conversionStatus: PrismaProcurementRecordMapper.toPersistedPurchaseRequestLineConversionStatus(
                line.conversionStatus ?? PurchaseRequestLineConversionStatus.NOT_CONVERTED
              ),
              linkedPurchaseOrderLines: PrismaProcurementRecordMapper.toInputJson(
                line.linkedPurchaseOrderLines ?? []
              )
            }))
          })
        }

        if (record.approvalSnapshot) {
          await client.purchaseRequestApprovalSnapshot.upsert({
            where: {
              purchaseRequestId: record.purchaseRequestId
            },
            create: {
              id: record.approvalSnapshot.purchaseRequestApprovalSnapshotId,
              tenantId: record.tenantId,
              purchaseRequestId: record.purchaseRequestId,
              decision: PrismaProcurementRecordMapper.toPersistedPurchaseRequestDecision(record.approvalSnapshot.decision),
              decidedByOperatorId: record.approvalSnapshot.decidedBy.operatorId,
              decidedByDisplayName: record.approvalSnapshot.decidedBy.displayName,
              decidedAt: new Date(record.approvalSnapshot.decidedAt),
              comment: record.approvalSnapshot.comment ?? null,
              approvalReference: record.approvalSnapshot.approvalReference ?? null
            },
            update: {
              decision: PrismaProcurementRecordMapper.toPersistedPurchaseRequestDecision(record.approvalSnapshot.decision),
              decidedByOperatorId: record.approvalSnapshot.decidedBy.operatorId,
              decidedByDisplayName: record.approvalSnapshot.decidedBy.displayName,
              decidedAt: new Date(record.approvalSnapshot.decidedAt),
              comment: record.approvalSnapshot.comment ?? null,
              approvalReference: record.approvalSnapshot.approvalReference ?? null
            }
          })
        } else {
          await client.purchaseRequestApprovalSnapshot.deleteMany({
            where: {
              purchaseRequestId: record.purchaseRequestId
            }
          })
        }

        const saved = await client.purchaseRequest.findUniqueOrThrow({
          where: {
            id: record.purchaseRequestId
          },
          include: PrismaProcurementRecordMapper.purchaseRequestIncludeValue()
        })

        return PrismaProcurementRecordMapper.toPurchaseRequest(saved)
      })
    } catch (error) {
      if (isRequestNoUniqueViolation(error)) {
        throw ExceptionFactory.application(PROCUREMENT_ALREADY_EXISTS, {
          reason: 'requestNo is already occupied by another purchase request',
          requestNo: record.requestNo,
          purchaseRequestId: record.purchaseRequestId
        })
      }
      throw error
    }
  }

  async search(input: SearchPurchaseRequestsInput): Promise<PageResult<PurchaseRequestRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().purchaseRequest.findMany({
      where: {
        tenantId: input.tenantId
      },
      include: PrismaProcurementRecordMapper.purchaseRequestIncludeValue(),
      orderBy: {
        requestNo: 'asc'
      }
    })
    const filtered = rows
      .map((row) => PrismaProcurementRecordMapper.toPurchaseRequest(row))
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.requestType || record.requestType === input.requestType)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.requesterOperatorId || record.requester.operatorId === input.requesterOperatorId)
      .filter((record) => !input.itemId || record.lines.some((line) => line.itemId === input.itemId))
      .filter(
        (record) =>
          !input.purchaseOrderId ||
          (record.linkedPurchaseOrders ?? []).some((link) => link.purchaseOrderId === input.purchaseOrderId)
      )
      .filter((record) => {
        if (!input.neededByDateFrom && !input.neededByDateTo) {
          return true
        }
        return record.lines.some((line) => {
          const date = line.neededByDate
          if (!date) {
            return false
          }
          if (input.neededByDateFrom && date < input.neededByDateFrom) {
            return false
          }
          if (input.neededByDateTo && date > input.neededByDateTo) {
            return false
          }
          return true
        })
      })
      .filter((record) => {
        if (!input.keyword) {
          return true
        }
        const keyword = input.keyword.toLowerCase()
        return (
          record.requestNo.toLowerCase().includes(keyword) ||
          (record.title ?? '').toLowerCase().includes(keyword) ||
          record.requester.displayName.toLowerCase().includes(keyword)
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
}

const GLOBAL_SEQUENCE_KEY = '__global_procurement_sequences__'

function formatDocumentNo(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(4, '0')}`
}

function isRequestNoUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
