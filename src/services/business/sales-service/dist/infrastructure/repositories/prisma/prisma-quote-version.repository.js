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
exports.PrismaQuoteVersionRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_sales_record_mapper_1 = require("./prisma-sales-record.mapper");
/** PrismaQuoteVersionRepository persists immutable published quote baselines and paged history reads. */
let PrismaQuoteVersionRepository = class PrismaQuoteVersionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextVersionNo(tenantId, quoteId) {
        const total = await this.prisma.getExecutionClient().salesQuoteVersion.count({
            where: {
                tenantId,
                quoteId
            }
        });
        return total + 1;
    }
    async findById(tenantId, quoteVersionId) {
        const record = await this.prisma.getExecutionClient().salesQuoteVersion.findFirst({
            where: {
                tenantId,
                id: quoteVersionId
            },
            include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.quoteVersionIncludeValue()
        });
        return record ? prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toQuoteVersion(record) : null;
    }
    async save(quoteVersion) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
            await client.salesQuoteVersion.upsert({
                where: {
                    id: quoteVersion.id
                },
                create: {
                    id: quoteVersion.id,
                    quoteId: quoteVersion.quoteId,
                    quoteNo: quoteVersion.quoteNo,
                    versionNo: quoteVersion.versionNo,
                    tenantId: quoteVersion.tenantId,
                    customerTenantPartyId: quoteVersion.customerTenantPartyId,
                    publishedAt: new Date(quoteVersion.publishedAt)
                },
                update: {
                    quoteId: quoteVersion.quoteId,
                    quoteNo: quoteVersion.quoteNo,
                    versionNo: quoteVersion.versionNo,
                    customerTenantPartyId: quoteVersion.customerTenantPartyId,
                    publishedAt: new Date(quoteVersion.publishedAt)
                }
            });
            await client.salesQuoteVersionLine.deleteMany({
                where: {
                    quoteVersionId: quoteVersion.id
                }
            });
            if (quoteVersion.lines.length > 0) {
                await client.salesQuoteVersionLine.createMany({
                    data: quoteVersion.lines.map((line) => ({
                        id: line.quoteLineId,
                        tenantId: quoteVersion.tenantId,
                        quoteVersionId: quoteVersion.id,
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
            const saved = await client.salesQuoteVersion.findUniqueOrThrow({
                where: {
                    id: quoteVersion.id
                },
                include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.quoteVersionIncludeValue()
            });
            return prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toQuoteVersion(saved);
        });
    }
    async listByQuoteId(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const where = {
            tenantId: input.tenantId,
            quoteId: input.quoteId
        };
        const [total, items] = await Promise.all([
            this.prisma.getExecutionClient().salesQuoteVersion.count({ where }),
            this.prisma.getExecutionClient().salesQuoteVersion.findMany({
                where,
                include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.quoteVersionIncludeValue(),
                orderBy: {
                    versionNo: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toQuoteVersion(item)),
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaQuoteVersionRepository = PrismaQuoteVersionRepository;
exports.PrismaQuoteVersionRepository = PrismaQuoteVersionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaQuoteVersionRepository);
//# sourceMappingURL=prisma-quote-version.repository.js.map