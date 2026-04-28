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
exports.PrismaQuoteRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_sales_record_mapper_1 = require("./prisma-sales-record.mapper");
/** PrismaQuoteRepository persists tenant-scoped mutable quote drafts in the sales-service database. */
let PrismaQuoteRepository = class PrismaQuoteRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextQuoteNo(tenantId) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            const existing = await client.salesSequenceCounter.findUnique({
                where: {
                    tenantId
                }
            });
            if (!existing) {
                await client.salesSequenceCounter.create({
                    data: {
                        tenantId,
                        nextQuoteNo: 2,
                        nextSalesOrderNo: 1
                    }
                });
                return formatDocumentNo('SQ', 1);
            }
            const updated = await client.salesSequenceCounter.update({
                where: {
                    tenantId
                },
                data: {
                    nextQuoteNo: {
                        increment: 1
                    }
                },
                select: {
                    nextQuoteNo: true
                }
            });
            return formatDocumentNo('SQ', updated.nextQuoteNo - 1);
        });
    }
    async findById(tenantId, quoteId) {
        const record = await this.prisma.getExecutionClient().salesQuote.findFirst({
            where: {
                tenantId,
                id: quoteId
            },
            include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.quoteIncludeValue()
        });
        return record ? prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toQuote(record) : null;
    }
    async save(quote) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            await client.salesQuote.upsert({
                where: {
                    id: quote.id
                },
                create: {
                    id: quote.id,
                    quoteNo: quote.quoteNo,
                    tenantId: quote.tenantId,
                    customerTenantPartyId: quote.customerTenantPartyId,
                    opportunityId: quote.opportunityRef?.opportunityId ?? null,
                    opportunityNo: quote.opportunityRef?.opportunityNo ?? null,
                    opportunityName: quote.opportunityRef?.opportunityName ?? null,
                    status: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toPersistedQuoteStatus(quote.status),
                    latestPublishedVersionId: quote.latestPublishedVersionId ?? null
                },
                update: {
                    quoteNo: quote.quoteNo,
                    customerTenantPartyId: quote.customerTenantPartyId,
                    opportunityId: quote.opportunityRef?.opportunityId ?? null,
                    opportunityNo: quote.opportunityRef?.opportunityNo ?? null,
                    opportunityName: quote.opportunityRef?.opportunityName ?? null,
                    status: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toPersistedQuoteStatus(quote.status),
                    latestPublishedVersionId: quote.latestPublishedVersionId ?? null
                }
            });
            await client.salesQuoteLine.deleteMany({
                where: {
                    quoteId: quote.id
                }
            });
            if (quote.lines.length > 0) {
                await client.salesQuoteLine.createMany({
                    data: quote.lines.map((line) => ({
                        id: line.quoteLineId,
                        tenantId: quote.tenantId,
                        quoteId: quote.id,
                        lineNo: line.lineNo,
                        itemId: line.itemId,
                        itemSnapshot: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toInputJson(line.itemSnapshot),
                        salesConfigSnapshot: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toInputJson(line.salesConfigSnapshot),
                        packagingRequirementSnapshot: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toInputJson(line.packagingRequirementSnapshot),
                        priceQuantityDeliverySnapshot: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toInputJson(line.priceQuantityDeliverySnapshot),
                        customerItemSnapshot: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toInputJson(line.customerItemSnapshot)
                    }))
                });
            }
            const saved = await client.salesQuote.findUniqueOrThrow({
                where: {
                    id: quote.id
                },
                include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.quoteIncludeValue()
            });
            return prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toQuote(saved);
        });
    }
    async search(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const where = {
            tenantId: input.tenantId,
            customerTenantPartyId: input.customerTenantPartyId,
            status: input.status
                ? prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toPersistedQuoteStatus(input.status)
                : undefined,
            OR: input.keyword
                ? [
                    {
                        quoteNo: {
                            contains: input.keyword,
                            mode: 'insensitive'
                        }
                    },
                    {
                        customerTenantPartyId: {
                            contains: input.keyword,
                            mode: 'insensitive'
                        }
                    }
                ]
                : undefined
        };
        const [total, items] = await Promise.all([
            this.prisma.getExecutionClient().salesQuote.count({ where }),
            this.prisma.getExecutionClient().salesQuote.findMany({
                where,
                include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.quoteIncludeValue(),
                orderBy: {
                    quoteNo: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toQuote(item)),
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaQuoteRepository = PrismaQuoteRepository;
exports.PrismaQuoteRepository = PrismaQuoteRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaQuoteRepository);
/** formatDocumentNo converts one numeric sequence into the frozen sales document summary format. */
function formatDocumentNo(prefix, value) {
    return `${prefix}-${String(value).padStart(4, '0')}`;
}
//# sourceMappingURL=prisma-quote.repository.js.map