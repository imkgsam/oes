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
exports.PrismaPurchaseRequestRepository = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const prisma_1 = require("../../../../prisma/generated/prisma");
const procurement_errors_1 = require("../../../common/errors/procurement.errors");
const procurement_records_1 = require("../../../domain/models/procurement-records");
const procurement_assertions_1 = require("../../../application/support/procurement-assertions");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_procurement_record_mapper_1 = require("./prisma-procurement-record.mapper");
/** PrismaPurchaseRequestRepository persists PR aggregates and directory reads inside the procurement database. */
let PrismaPurchaseRequestRepository = class PrismaPurchaseRequestRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextRequestNo(_tenantId) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            await client.procurementSequenceCounter.upsert({
                where: {
                    tenantId: GLOBAL_SEQUENCE_KEY
                },
                create: {
                    tenantId: GLOBAL_SEQUENCE_KEY,
                    nextPurchaseRequestNo: 1
                },
                update: {}
            });
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
            });
            return formatDocumentNo('PR', row.nextPurchaseRequestNo - 1);
        });
    }
    async findById(tenantId, purchaseRequestId) {
        const row = await this.prisma.getExecutionClient().purchaseRequest.findFirst({
            where: {
                tenantId,
                id: purchaseRequestId
            },
            include: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.purchaseRequestIncludeValue()
        });
        return row ? prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPurchaseRequest(row) : null;
    }
    async save(record) {
        try {
            return await this.prisma.runInTransaction(async () => {
                const client = this.prisma.getExecutionClient();
                await client.purchaseRequest.upsert({
                    where: {
                        id: record.purchaseRequestId
                    },
                    create: {
                        id: record.purchaseRequestId,
                        requestNo: record.requestNo,
                        tenantId: record.tenantId,
                        orgId: record.orgId ?? null,
                        requestType: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestType(record.requestType),
                        status: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestStatus(record.status),
                        requesterOperatorId: record.requester.operatorId,
                        requesterDisplayName: record.requester.displayName,
                        title: record.title ?? null,
                        reason: record.reason ?? null,
                        submissionComment: record.submissionComment ?? null,
                        cancelReason: record.cancelReason ?? null,
                        linkedPurchaseOrders: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toInputJson(record.linkedPurchaseOrders ?? []),
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
                        requestType: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestType(record.requestType),
                        status: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestStatus(record.status),
                        requesterOperatorId: record.requester.operatorId,
                        requesterDisplayName: record.requester.displayName,
                        title: record.title ?? null,
                        reason: record.reason ?? null,
                        submissionComment: record.submissionComment ?? null,
                        cancelReason: record.cancelReason ?? null,
                        linkedPurchaseOrders: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toInputJson(record.linkedPurchaseOrders ?? []),
                        nextExpectedReceiptDate: record.nextExpectedReceiptDate ?? null,
                        receivingStatusSummary: record.receivingStatusSummary ?? null,
                        createdAt: new Date(record.createdAt),
                        updatedAt: new Date(record.updatedAt),
                        submittedAt: record.submittedAt ? new Date(record.submittedAt) : null,
                        decidedAt: record.decidedAt ? new Date(record.decidedAt) : null,
                        cancelledAt: record.cancelledAt ? new Date(record.cancelledAt) : null
                    }
                });
                await client.purchaseRequestLine.deleteMany({
                    where: {
                        purchaseRequestId: record.purchaseRequestId
                    }
                });
                if (record.lines.length > 0) {
                    await client.purchaseRequestLine.createMany({
                        data: record.lines.map((line) => ({
                            id: line.purchaseRequestLineId,
                            tenantId: record.tenantId,
                            purchaseRequestId: record.purchaseRequestId,
                            lineNo: line.lineNo,
                            lineType: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestLineType(line.lineType),
                            itemId: line.itemId ?? null,
                            itemCode: line.itemCode ?? null,
                            itemName: line.itemName ?? null,
                            description: line.description,
                            requestedQuantity: line.requestedQuantity,
                            uom: line.uom,
                            neededByDate: line.neededByDate ?? null,
                            demandReferenceType: line.demandReferenceType ?? null,
                            demandReferenceId: line.demandReferenceId ?? null,
                            conversionStatus: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestLineConversionStatus(line.conversionStatus ?? procurement_records_1.PurchaseRequestLineConversionStatus.NOT_CONVERTED),
                            linkedPurchaseOrderLines: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toInputJson(line.linkedPurchaseOrderLines ?? [])
                        }))
                    });
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
                            decision: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestDecision(record.approvalSnapshot.decision),
                            decidedByOperatorId: record.approvalSnapshot.decidedBy.operatorId,
                            decidedByDisplayName: record.approvalSnapshot.decidedBy.displayName,
                            decidedAt: new Date(record.approvalSnapshot.decidedAt),
                            comment: record.approvalSnapshot.comment ?? null,
                            approvalReference: record.approvalSnapshot.approvalReference ?? null
                        },
                        update: {
                            decision: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedPurchaseRequestDecision(record.approvalSnapshot.decision),
                            decidedByOperatorId: record.approvalSnapshot.decidedBy.operatorId,
                            decidedByDisplayName: record.approvalSnapshot.decidedBy.displayName,
                            decidedAt: new Date(record.approvalSnapshot.decidedAt),
                            comment: record.approvalSnapshot.comment ?? null,
                            approvalReference: record.approvalSnapshot.approvalReference ?? null
                        }
                    });
                }
                else {
                    await client.purchaseRequestApprovalSnapshot.deleteMany({
                        where: {
                            purchaseRequestId: record.purchaseRequestId
                        }
                    });
                }
                const saved = await client.purchaseRequest.findUniqueOrThrow({
                    where: {
                        id: record.purchaseRequestId
                    },
                    include: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.purchaseRequestIncludeValue()
                });
                return prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPurchaseRequest(saved);
            });
        }
        catch (error) {
            if (isRequestNoUniqueViolation(error)) {
                throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_ALREADY_EXISTS, {
                    reason: 'requestNo is already occupied by another purchase request',
                    requestNo: record.requestNo,
                    purchaseRequestId: record.purchaseRequestId
                });
            }
            throw error;
        }
    }
    async search(input) {
        const { page, pageSize } = (0, procurement_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const rows = await this.prisma.getExecutionClient().purchaseRequest.findMany({
            where: {
                tenantId: input.tenantId
            },
            include: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.purchaseRequestIncludeValue(),
            orderBy: {
                requestNo: 'asc'
            }
        });
        const filtered = rows
            .map((row) => prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPurchaseRequest(row))
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.requestType || record.requestType === input.requestType)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => !input.requesterOperatorId || record.requester.operatorId === input.requesterOperatorId)
            .filter((record) => !input.itemId || record.lines.some((line) => line.itemId === input.itemId))
            .filter((record) => !input.purchaseOrderId ||
            (record.linkedPurchaseOrders ?? []).some((link) => link.purchaseOrderId === input.purchaseOrderId))
            .filter((record) => {
            if (!input.neededByDateFrom && !input.neededByDateTo) {
                return true;
            }
            return record.lines.some((line) => {
                const date = line.neededByDate;
                if (!date) {
                    return false;
                }
                if (input.neededByDateFrom && date < input.neededByDateFrom) {
                    return false;
                }
                if (input.neededByDateTo && date > input.neededByDateTo) {
                    return false;
                }
                return true;
            });
        })
            .filter((record) => {
            if (!input.keyword) {
                return true;
            }
            const keyword = input.keyword.toLowerCase();
            return (record.requestNo.toLowerCase().includes(keyword) ||
                (record.title ?? '').toLowerCase().includes(keyword) ||
                record.requester.displayName.toLowerCase().includes(keyword));
        });
        const { pageItems, total } = (0, procurement_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaPurchaseRequestRepository = PrismaPurchaseRequestRepository;
exports.PrismaPurchaseRequestRepository = PrismaPurchaseRequestRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPurchaseRequestRepository);
const GLOBAL_SEQUENCE_KEY = '__global_procurement_sequences__';
function formatDocumentNo(prefix, value) {
    return `${prefix}-${String(value).padStart(4, '0')}`;
}
function isRequestNoUniqueViolation(error) {
    return error instanceof prisma_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
//# sourceMappingURL=prisma-purchase-request.repository.js.map