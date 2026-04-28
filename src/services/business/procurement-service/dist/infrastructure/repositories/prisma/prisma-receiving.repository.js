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
exports.PrismaReceivingRepository = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("@oes/common/exceptions");
const prisma_1 = require("../../../../prisma/generated/prisma");
const procurement_errors_1 = require("../../../common/errors/procurement.errors");
const procurement_assertions_1 = require("../../../application/support/procurement-assertions");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_procurement_record_mapper_1 = require("./prisma-procurement-record.mapper");
/** PrismaReceivingRepository persists procurement-owned expectation and discrepancy summaries inside the service database. */
let PrismaReceivingRepository = class PrismaReceivingRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextExpectationNo(_tenantId) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            await client.procurementSequenceCounter.upsert({
                where: {
                    tenantId: GLOBAL_SEQUENCE_KEY
                },
                create: {
                    tenantId: GLOBAL_SEQUENCE_KEY,
                    nextReceivingExpectationNo: 1
                },
                update: {}
            });
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
            });
            return formatDocumentNo('RE', row.nextReceivingExpectationNo - 1);
        });
    }
    async findById(tenantId, receivingExpectationId) {
        const row = await this.prisma.getExecutionClient().receivingExpectation.findFirst({
            where: {
                tenantId,
                id: receivingExpectationId
            },
            include: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.receivingExpectationIncludeValue()
        });
        return row ? prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toReceivingExpectation(row) : null;
    }
    async findByPurchaseOrderLineId(tenantId, purchaseOrderLineId) {
        const row = await this.prisma.getExecutionClient().receivingExpectation.findFirst({
            where: {
                tenantId,
                purchaseOrderLineId
            },
            include: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.receivingExpectationIncludeValue()
        });
        return row ? prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toReceivingExpectation(row) : null;
    }
    async save(record) {
        try {
            return await this.prisma.runInTransaction(async () => {
                const client = this.prisma.getExecutionClient();
                const expectationNo = (await client.receivingExpectation.findUnique({
                    where: {
                        id: record.receivingExpectationId
                    },
                    select: {
                        expectationNo: true
                    }
                }))?.expectationNo ?? (await this.nextExpectationNo(record.tenantId));
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
                        status: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingExpectationStatus(record.status),
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
                        status: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingExpectationStatus(record.status),
                        createdAt: new Date(record.createdAt),
                        updatedAt: new Date(record.updatedAt)
                    }
                });
                if (record.discrepancy) {
                    await client.receivingDiscrepancy.upsert({
                        where: {
                            receivingExpectationId: record.receivingExpectationId
                        },
                        create: {
                            id: record.discrepancy.receivingDiscrepancyId,
                            tenantId: record.tenantId,
                            receivingExpectationId: record.receivingExpectationId,
                            discrepancyType: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyType(record.discrepancy.discrepancyType),
                            summary: record.discrepancy.summary,
                            status: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyStatus(record.discrepancy.status),
                            resolutionCode: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingResolutionCode(record.discrepancy.resolutionCode),
                            resolutionNote: record.discrepancy.resolutionNote ?? null,
                            resolvedAt: record.discrepancy.resolvedAt ? new Date(record.discrepancy.resolvedAt) : null
                        },
                        update: {
                            discrepancyType: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyType(record.discrepancy.discrepancyType),
                            summary: record.discrepancy.summary,
                            status: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingDiscrepancyStatus(record.discrepancy.status),
                            resolutionCode: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toPersistedReceivingResolutionCode(record.discrepancy.resolutionCode),
                            resolutionNote: record.discrepancy.resolutionNote ?? null,
                            resolvedAt: record.discrepancy.resolvedAt ? new Date(record.discrepancy.resolvedAt) : null
                        }
                    });
                }
                else {
                    await client.receivingDiscrepancy.deleteMany({
                        where: {
                            receivingExpectationId: record.receivingExpectationId
                        }
                    });
                }
                const saved = await client.receivingExpectation.findUniqueOrThrow({
                    where: {
                        id: record.receivingExpectationId
                    },
                    include: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.receivingExpectationIncludeValue()
                });
                return prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toReceivingExpectation(saved);
            });
        }
        catch (error) {
            if (isReceivingUniqueViolation(error)) {
                throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_ALREADY_EXISTS, {
                    reason: 'receiving expectation already exists for purchase order line',
                    purchaseOrderLineId: record.purchaseOrderLineId
                });
            }
            throw error;
        }
    }
    async search(input) {
        const { page, pageSize } = (0, procurement_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const rows = await this.prisma.getExecutionClient().receivingExpectation.findMany({
            where: {
                tenantId: input.tenantId
            },
            include: prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.receivingExpectationIncludeValue(),
            orderBy: {
                expectationNo: 'asc'
            }
        });
        const filtered = rows
            .map((row) => prisma_procurement_record_mapper_1.PrismaProcurementRecordMapper.toReceivingExpectation(row))
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.purchaseOrderId || record.purchaseOrderId === input.purchaseOrderId)
            .filter((record) => !input.supplierId || record.supplierId === input.supplierId)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => {
            if (input.hasOpenDiscrepancy === undefined) {
                return true;
            }
            const hasOpen = record.discrepancy?.status === 'OPEN';
            return input.hasOpenDiscrepancy ? hasOpen : !hasOpen;
        })
            .filter((record) => {
            if (!input.expectedReceiptDateFrom && !input.expectedReceiptDateTo) {
                return true;
            }
            const expectedDate = record.expectedReceiptDate;
            if (!expectedDate) {
                return false;
            }
            if (input.expectedReceiptDateFrom && expectedDate < input.expectedReceiptDateFrom) {
                return false;
            }
            if (input.expectedReceiptDateTo && expectedDate > input.expectedReceiptDateTo) {
                return false;
            }
            return true;
        });
        const { pageItems, total } = (0, procurement_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async existsByPurchaseOrderId(tenantId, purchaseOrderId) {
        const count = await this.prisma.getExecutionClient().receivingExpectation.count({
            where: {
                tenantId,
                purchaseOrderId
            }
        });
        return count > 0;
    }
};
exports.PrismaReceivingRepository = PrismaReceivingRepository;
exports.PrismaReceivingRepository = PrismaReceivingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaReceivingRepository);
const GLOBAL_SEQUENCE_KEY = '__global_procurement_sequences__';
function formatDocumentNo(prefix, value) {
    return `${prefix}-${String(value).padStart(4, '0')}`;
}
function isReceivingUniqueViolation(error) {
    return error instanceof prisma_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
//# sourceMappingURL=prisma-receiving.repository.js.map