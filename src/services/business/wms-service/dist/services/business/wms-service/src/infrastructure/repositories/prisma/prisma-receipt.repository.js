"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaReceiptRepository = void 0;
const exceptions_1 = require("@oes/common/exceptions");
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../../../prisma/generated/prisma");
const wms_errors_1 = require("../../../common/errors/wms.errors");
const wms_assertions_1 = require("../../../application/support/wms-assertions");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_wms_record_mapper_1 = require("./prisma-wms-record.mapper");
const GLOBAL_SEQUENCE_KEY = '__GLOBAL__';
/** PrismaReceiptRepository persists and queries WMS-owned receipt truth inside the service database. */
let PrismaReceiptRepository = class PrismaReceiptRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextReceiptNo(_tenantId) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            await client.wmsSequenceCounter.upsert({
                where: {
                    tenantId: GLOBAL_SEQUENCE_KEY
                },
                create: {
                    tenantId: GLOBAL_SEQUENCE_KEY,
                    nextReceiptNo: 1
                },
                update: {}
            });
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
            });
            return formatDocumentNo('RC', row.nextReceiptNo - 1);
        });
    }
    async findById(tenantId, receiptId) {
        const row = await this.prisma.getExecutionClient().receipt.findFirst({
            where: {
                tenantId,
                id: receiptId
            },
            include: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.receiptIncludeValue()
        });
        return row ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toReceipt(row) : null;
    }
    async findLineById(tenantId, receiptLineId) {
        const row = await this.prisma.getExecutionClient().receiptLine.findFirst({
            where: {
                tenantId,
                id: receiptLineId
            },
            include: {
                receipt: {
                    include: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.receiptIncludeValue()
                }
            }
        });
        if (!row) {
            return null;
        }
        const receipt = prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toReceipt(row.receipt);
        const line = receipt.lines.find((candidate) => candidate.receiptLineId === receiptLineId);
        return line ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toReceiptLineSummary(receipt, line) : null;
    }
    async save(record) {
        try {
            return await this.prisma.runInTransaction(async () => {
                const client = this.prisma.getExecutionClient();
                const receiptNo = (await client.receipt.findUnique({
                    where: {
                        id: record.receiptId
                    },
                    select: {
                        receiptNo: true
                    }
                }))?.receiptNo ?? record.receiptNo;
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
                        status: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedReceiptStatus(record.status),
                        receiptSourceType: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedReceiptSourceType(record.receiptSourceType),
                        referencedReceivingExpectationIds: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(record.referencedReceivingExpectationIds),
                        receiptDate: record.receiptDate,
                        note: record.note ?? null,
                        attachmentRefs: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(record.attachmentRefs),
                        lineCount: record.lineCount,
                        postedAt: record.postedAt ? new Date(record.postedAt) : null,
                        cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null,
                        cancelReason: record.cancelReason ?? null,
                        postComment: record.postComment ?? null,
                        procurementReceiptSummary: record.procurementReceiptSummary
                            ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(record.procurementReceiptSummary)
                            : prisma_1.Prisma.JsonNull,
                        createdAt: new Date(record.createdAt),
                        updatedAt: new Date(record.updatedAt)
                    },
                    update: {
                        orgId: record.orgId ?? null,
                        warehouseId: record.warehouseId,
                        status: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedReceiptStatus(record.status),
                        receiptSourceType: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedReceiptSourceType(record.receiptSourceType),
                        referencedReceivingExpectationIds: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(record.referencedReceivingExpectationIds),
                        receiptDate: record.receiptDate,
                        note: record.note ?? null,
                        attachmentRefs: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(record.attachmentRefs),
                        lineCount: record.lineCount,
                        postedAt: record.postedAt ? new Date(record.postedAt) : null,
                        cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null,
                        cancelReason: record.cancelReason ?? null,
                        postComment: record.postComment ?? null,
                        procurementReceiptSummary: record.procurementReceiptSummary
                            ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(record.procurementReceiptSummary)
                            : prisma_1.Prisma.JsonNull,
                        createdAt: new Date(record.createdAt),
                        updatedAt: new Date(record.updatedAt)
                    }
                });
                await client.receiptLine.deleteMany({
                    where: {
                        receiptId: record.receiptId
                    }
                });
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
                            inventoryStatus: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toPersistedInventoryStatus(line.inventoryStatus),
                            restrictedReason: line.restrictedReason
                                ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(line.restrictedReason)
                                : prisma_1.Prisma.JsonNull,
                            trackingRefs: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(line.trackingRefs),
                            physicalDiscrepancy: line.physicalDiscrepancy
                                ? prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(line.physicalDiscrepancy)
                                : prisma_1.Prisma.JsonNull,
                            evidenceAttachmentRefs: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(line.evidenceAttachmentRefs),
                            postedStockLedgerEntryIds: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toInputJson(line.postedStockLedgerEntryIds),
                            createdAt: new Date(line.createdAt),
                            updatedAt: new Date(line.updatedAt)
                        }
                    });
                }
                const saved = await client.receipt.findUniqueOrThrow({
                    where: {
                        id: record.receiptId
                    },
                    include: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.receiptIncludeValue()
                });
                return prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toReceipt(saved);
            });
        }
        catch (error) {
            if (isReceiptUniqueViolation(error)) {
                throw exceptions_1.ExceptionFactory.application(wms_errors_1.WMS_ALREADY_EXISTS, {
                    reason: 'receipt number already exists',
                    receiptNo: record.receiptNo
                });
            }
            throw error;
        }
    }
    async searchReceipts(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const rows = await this.prisma.getExecutionClient().receipt.findMany({
            where: {
                tenantId: input.tenantId
            },
            include: prisma_wms_record_mapper_1.PrismaWmsRecordMapper.receiptIncludeValue(),
            orderBy: {
                receiptNo: 'asc'
            }
        });
        const keyword = (0, wms_assertions_1.normalizeOptionalString)(input.keyword)?.toLowerCase();
        const filtered = rows
            .map((row) => prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toReceipt(row))
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => !input.receiptSourceType || record.receiptSourceType === input.receiptSourceType)
            .filter((record) => !input.receivingExpectationId ||
            record.referencedReceivingExpectationIds.includes(input.receivingExpectationId) ||
            record.lines.some((line) => line.receivingExpectationId === input.receivingExpectationId))
            .filter((record) => {
            if (!keyword) {
                return true;
            }
            return (record.receiptNo.toLowerCase().includes(keyword) ||
                (record.note ?? '').toLowerCase().includes(keyword) ||
                record.lines.some((line) => line.trackingRefs.some((trackingRef) => trackingRef.trackingRefValue.toLowerCase().includes(keyword))));
        })
            .filter((record) => !input.receiptDateFrom || record.receiptDate >= input.receiptDateFrom)
            .filter((record) => !input.receiptDateTo || record.receiptDate <= input.receiptDateTo)
            .filter((record) => !input.postedAtFrom || (record.postedAt ?? '') >= input.postedAtFrom)
            .filter((record) => !input.postedAtTo || (record.postedAt ?? '') <= input.postedAtTo);
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async searchReceiptLines(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const receipts = await this.searchReceipts({
            tenantId: input.tenantId,
            orgId: input.orgId,
            warehouseId: input.warehouseId,
            receiptId: undefined,
            page: 1,
            pageSize: Number.MAX_SAFE_INTEGER
        });
        const filtered = receipts.items
            .filter((receipt) => !input.receiptId || receipt.receiptId === input.receiptId)
            .flatMap((receipt) => receipt.lines.map((line) => prisma_wms_record_mapper_1.PrismaWmsRecordMapper.toReceiptLineSummary(receipt, line)))
            .filter((line) => !input.targetLocationId || line.targetLocationId === input.targetLocationId)
            .filter((line) => !input.itemId || line.itemId === input.itemId)
            .filter((line) => !input.receivingExpectationId || line.receivingExpectationId === input.receivingExpectationId)
            .filter((line) => !input.inventoryStatus || line.inventoryStatus === input.inventoryStatus)
            .filter((line) => !input.restrictedReasonCode || line.restrictedReason?.reasonCode === input.restrictedReasonCode)
            .filter((line) => !input.discrepancyType || line.physicalDiscrepancy?.discrepancyType === input.discrepancyType)
            .filter((line) => !input.postedAtFrom || (line.postedAt ?? '') >= input.postedAtFrom)
            .filter((line) => !input.postedAtTo || (line.postedAt ?? '') <= input.postedAtTo);
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaReceiptRepository = PrismaReceiptRepository;
exports.PrismaReceiptRepository = PrismaReceiptRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaReceiptRepository);
function formatDocumentNo(prefix, sequence) {
    return `${prefix}-${sequence.toString().padStart(6, '0')}`;
}
function isReceiptUniqueViolation(error) {
    return (error instanceof prisma_1.Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002');
}
//# sourceMappingURL=prisma-receipt.repository.js.map