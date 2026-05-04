import { ExceptionFactory } from '@oes/common/exceptions'
import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../../prisma/generated/prisma'
import { WMS_ALREADY_EXISTS } from '../../../common/errors/wms.errors'
import { PageResult, ReceiptLineSummaryRecord, ReceiptRecord, SearchReceiptLinesInput, SearchReceiptsInput } from '../../../domain/models/wms-records'
import { ReceiptRepository } from '../../../domain/repositories/receipt.repository'
import { normalizeOptionalString, normalizePageInput, paginate } from '../../../application/support/wms-assertions'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaWmsRecordMapper } from './prisma-wms-record.mapper'

const GLOBAL_SEQUENCE_KEY = '__GLOBAL__'

/** PrismaReceiptRepository persists and queries WMS-owned receipt truth inside the service database. */
@Injectable()
export class PrismaReceiptRepository implements ReceiptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextReceiptNo(_tenantId: string): Promise<string> {
    return this.prisma.runInTransaction(async () => {
      const client = this.prisma.getExecutionClient()
      await client.wmsSequenceCounter.upsert({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        create: {
          tenantId: GLOBAL_SEQUENCE_KEY,
          nextReceiptNo: 1
        },
        update: {}
      })

      const row = await client.wmsSequenceCounter.update({
        where: {
          tenantId: GLOBAL_SEQUENCE_KEY
        },
        data: {
          nextReceiptNo: {
            increment: 1
          }
        },
        select: {
          nextReceiptNo: true
        }
      })

      return formatDocumentNo('RC', row.nextReceiptNo - 1)
    })
  }

  async findById(tenantId: string, receiptId: string): Promise<ReceiptRecord | null> {
    const row = await this.prisma.getExecutionClient().receipt.findFirst({
      where: {
        tenantId,
        id: receiptId
      },
      include: PrismaWmsRecordMapper.receiptIncludeValue()
    })

    return row ? PrismaWmsRecordMapper.toReceipt(row) : null
  }

  async findLineById(tenantId: string, receiptLineId: string): Promise<ReceiptLineSummaryRecord | null> {
    const row = await this.prisma.getExecutionClient().receiptLine.findFirst({
      where: {
        tenantId,
        id: receiptLineId
      },
      include: {
        receipt: {
          include: PrismaWmsRecordMapper.receiptIncludeValue()
        }
      }
    })

    if (!row) {
      return null
    }

    const receipt = PrismaWmsRecordMapper.toReceipt(row.receipt)
    const line = receipt.lines.find((candidate) => candidate.receiptLineId === receiptLineId)
    return line ? PrismaWmsRecordMapper.toReceiptLineSummary(receipt, line) : null
  }

  async save(record: ReceiptRecord): Promise<ReceiptRecord> {
    try {
      return await this.prisma.runInTransaction(async () => {
        const client = this.prisma.getExecutionClient()
        const receiptNo =
          (await client.receipt.findUnique({
            where: {
              id: record.receiptId
            },
            select: {
              receiptNo: true
            }
          }))?.receiptNo ?? record.receiptNo

        await client.receipt.upsert({
          where: {
            id: record.receiptId
          },
          create: {
            id: record.receiptId,
            receiptNo,
            tenantId: record.tenantId,
            orgId: record.orgId ?? null,
            warehouseId: record.warehouseId,
            status: PrismaWmsRecordMapper.toPersistedReceiptStatus(record.status),
            receiptSourceType: PrismaWmsRecordMapper.toPersistedReceiptSourceType(record.receiptSourceType),
            referencedReceivingExpectationIds: PrismaWmsRecordMapper.toInputJson(
              record.referencedReceivingExpectationIds
            ),
            receiptDate: record.receiptDate,
            note: record.note ?? null,
            attachmentRefs: PrismaWmsRecordMapper.toInputJson(record.attachmentRefs),
            lineCount: record.lineCount,
            postedAt: record.postedAt ? new Date(record.postedAt) : null,
            cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null,
            cancelReason: record.cancelReason ?? null,
            postComment: record.postComment ?? null,
            procurementReceiptSummary: record.procurementReceiptSummary
              ? PrismaWmsRecordMapper.toInputJson(record.procurementReceiptSummary)
              : Prisma.JsonNull,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt)
          },
          update: {
            orgId: record.orgId ?? null,
            warehouseId: record.warehouseId,
            status: PrismaWmsRecordMapper.toPersistedReceiptStatus(record.status),
            receiptSourceType: PrismaWmsRecordMapper.toPersistedReceiptSourceType(record.receiptSourceType),
            referencedReceivingExpectationIds: PrismaWmsRecordMapper.toInputJson(
              record.referencedReceivingExpectationIds
            ),
            receiptDate: record.receiptDate,
            note: record.note ?? null,
            attachmentRefs: PrismaWmsRecordMapper.toInputJson(record.attachmentRefs),
            lineCount: record.lineCount,
            postedAt: record.postedAt ? new Date(record.postedAt) : null,
            cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null,
            cancelReason: record.cancelReason ?? null,
            postComment: record.postComment ?? null,
            procurementReceiptSummary: record.procurementReceiptSummary
              ? PrismaWmsRecordMapper.toInputJson(record.procurementReceiptSummary)
              : Prisma.JsonNull,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt)
          }
        })

        await client.receiptLine.deleteMany({
          where: {
            receiptId: record.receiptId
          }
        })

        for (const line of record.lines) {
          await client.receiptLine.create({
            data: {
              id: line.receiptLineId,
              tenantId: record.tenantId,
              receiptId: record.receiptId,
              lineNo: line.lineNo,
              itemId: line.itemId,
              itemCode: line.itemCode ?? null,
              itemName: line.itemName ?? null,
              receivingExpectationId: line.receivingExpectationId ?? null,
              targetLocationId: line.targetLocationId,
              confirmedQuantity: line.confirmedQuantity,
              uom: line.uom,
              inventoryStatus: PrismaWmsRecordMapper.toPersistedInventoryStatus(line.inventoryStatus),
              restrictedReason: line.restrictedReason
                ? PrismaWmsRecordMapper.toInputJson(line.restrictedReason)
                : Prisma.JsonNull,
              trackingRefs: PrismaWmsRecordMapper.toInputJson(line.trackingRefs),
              physicalDiscrepancy: line.physicalDiscrepancy
                ? PrismaWmsRecordMapper.toInputJson(line.physicalDiscrepancy)
                : Prisma.JsonNull,
              evidenceAttachmentRefs: PrismaWmsRecordMapper.toInputJson(line.evidenceAttachmentRefs),
              postedStockLedgerEntryIds: PrismaWmsRecordMapper.toInputJson(line.postedStockLedgerEntryIds),
              createdAt: new Date(line.createdAt),
              updatedAt: new Date(line.updatedAt)
            }
          })
        }

        const saved = await client.receipt.findUniqueOrThrow({
          where: {
            id: record.receiptId
          },
          include: PrismaWmsRecordMapper.receiptIncludeValue()
        })

        return PrismaWmsRecordMapper.toReceipt(saved)
      })
    } catch (error) {
      if (isReceiptUniqueViolation(error)) {
        throw ExceptionFactory.application(WMS_ALREADY_EXISTS, {
          reason: 'receipt number already exists',
          receiptNo: record.receiptNo
        })
      }
      throw error
    }
  }

  async searchReceipts(input: SearchReceiptsInput): Promise<PageResult<ReceiptRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const rows = await this.prisma.getExecutionClient().receipt.findMany({
      where: {
        tenantId: input.tenantId
      },
      include: PrismaWmsRecordMapper.receiptIncludeValue(),
      orderBy: {
        receiptNo: 'asc'
      }
    })

    const keyword = normalizeOptionalString(input.keyword)?.toLowerCase()
    const filtered = rows
      .map((row) => PrismaWmsRecordMapper.toReceipt(row))
      .filter((record) => !input.orgId || record.orgId === input.orgId)
      .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
      .filter((record) => !input.status || record.status === input.status)
      .filter((record) => !input.receiptSourceType || record.receiptSourceType === input.receiptSourceType)
      .filter(
        (record) =>
          !input.receivingExpectationId ||
          record.referencedReceivingExpectationIds.includes(input.receivingExpectationId) ||
          record.lines.some((line) => line.receivingExpectationId === input.receivingExpectationId)
      )
      .filter((record) => {
        if (!keyword) {
          return true
        }
        return (
          record.receiptNo.toLowerCase().includes(keyword) ||
          (record.note ?? '').toLowerCase().includes(keyword) ||
          record.lines.some((line) =>
            line.trackingRefs.some((trackingRef) =>
              trackingRef.trackingRefValue.toLowerCase().includes(keyword)
            )
          )
        )
      })
      .filter((record) => !input.receiptDateFrom || record.receiptDate >= input.receiptDateFrom)
      .filter((record) => !input.receiptDateTo || record.receiptDate <= input.receiptDateTo)
      .filter((record) => !input.postedAtFrom || (record.postedAt ?? '') >= input.postedAtFrom)
      .filter((record) => !input.postedAtTo || (record.postedAt ?? '') <= input.postedAtTo)

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }

  async searchReceiptLines(input: SearchReceiptLinesInput): Promise<PageResult<ReceiptLineSummaryRecord>> {
    const { page, pageSize } = normalizePageInput(input.page, input.pageSize)
    const receipts = await this.searchReceipts({
      tenantId: input.tenantId,
      orgId: input.orgId,
      warehouseId: input.warehouseId,
      receiptId: undefined,
      page: 1,
      pageSize: Number.MAX_SAFE_INTEGER
    } as SearchReceiptsInput)

    const filtered = receipts.items
      .filter((receipt) => !input.receiptId || receipt.receiptId === input.receiptId)
      .flatMap((receipt) =>
        receipt.lines.map((line) => PrismaWmsRecordMapper.toReceiptLineSummary(receipt, line))
      )
      .filter((line) => !input.targetLocationId || line.targetLocationId === input.targetLocationId)
      .filter((line) => !input.itemId || line.itemId === input.itemId)
      .filter(
        (line) => !input.receivingExpectationId || line.receivingExpectationId === input.receivingExpectationId
      )
      .filter((line) => !input.inventoryStatus || line.inventoryStatus === input.inventoryStatus)
      .filter(
        (line) =>
          !input.restrictedReasonCode || line.restrictedReason?.reasonCode === input.restrictedReasonCode
      )
      .filter(
        (line) =>
          !input.discrepancyType || line.physicalDiscrepancy?.discrepancyType === input.discrepancyType
      )
      .filter((line) => !input.postedAtFrom || (line.postedAt ?? '') >= input.postedAtFrom)
      .filter((line) => !input.postedAtTo || (line.postedAt ?? '') <= input.postedAtTo)

    const { pageItems, total } = paginate(filtered, page, pageSize)
    return {
      items: pageItems,
      total,
      page,
      pageSize
    }
  }
}

function formatDocumentNo(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(6, '0')}`
}

function isReceiptUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}
