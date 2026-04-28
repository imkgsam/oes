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
exports.PrismaSalesOrderRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const prisma_sales_record_mapper_1 = require("./prisma-sales-record.mapper");
/** PrismaSalesOrderRepository persists established orders plus gate and handoff summaries in PostgreSQL. */
let PrismaSalesOrderRepository = class PrismaSalesOrderRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async nextSalesOrderNo(tenantId) {
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
                        nextQuoteNo: 1,
                        nextSalesOrderNo: 2
                    }
                });
                return formatDocumentNo('SO', 1);
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
            });
            return formatDocumentNo('SO', updated.nextSalesOrderNo - 1);
        });
    }
    async findById(tenantId, salesOrderId) {
        const record = await this.prisma.getExecutionClient().salesOrder.findFirst({
            where: {
                tenantId,
                id: salesOrderId
            },
            include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.salesOrderIncludeValue()
        });
        return record ? prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toSalesOrder(record) : null;
    }
    async findByQuoteVersionId(tenantId, quoteVersionId) {
        const record = await this.prisma.getExecutionClient().salesOrder.findFirst({
            where: {
                tenantId,
                quoteVersionId
            },
            include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.salesOrderIncludeValue()
        });
        return record ? prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toSalesOrder(record) : null;
    }
    async save(order) {
        return this.prisma.runInTransaction(async () => {
            const client = this.prisma.getExecutionClient();
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
            });
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
            });
            await client.salesOrderFulfillmentHandoffSummary.upsert({
                where: {
                    salesOrderId: order.id
                },
                create: {
                    salesOrderId: order.id,
                    tenantId: order.tenantId,
                    status: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toPersistedHandoffStatus(order.fulfillmentHandoffStatus.status),
                    submittedAt: order.fulfillmentHandoffStatus.submittedAt
                        ? new Date(order.fulfillmentHandoffStatus.submittedAt)
                        : null
                },
                update: {
                    status: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toPersistedHandoffStatus(order.fulfillmentHandoffStatus.status),
                    submittedAt: order.fulfillmentHandoffStatus.submittedAt
                        ? new Date(order.fulfillmentHandoffStatus.submittedAt)
                        : null
                }
            });
            await client.salesOrderLine.deleteMany({
                where: {
                    salesOrderId: order.id
                }
            });
            if (order.lines.length > 0) {
                await client.salesOrderLine.createMany({
                    data: order.lines.map((line) => ({
                        id: line.salesOrderLineId,
                        tenantId: order.tenantId,
                        salesOrderId: order.id,
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
            const saved = await client.salesOrder.findUniqueOrThrow({
                where: {
                    id: order.id
                },
                include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.salesOrderIncludeValue()
            });
            return prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toSalesOrder(saved);
        });
    }
    async search(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const where = {
            tenantId: input.tenantId,
            customerTenantPartyId: input.customerTenantPartyId,
            quoteVersionId: input.quoteVersionId,
            OR: input.keyword
                ? [
                    {
                        salesOrderNo: {
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
                : undefined,
            commercialGateSummary: input.productionGate === undefined &&
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
        };
        const [total, items] = await Promise.all([
            this.prisma.getExecutionClient().salesOrder.count({ where }),
            this.prisma.getExecutionClient().salesOrder.findMany({
                where,
                include: prisma_sales_record_mapper_1.PrismaSalesRecordMapper.salesOrderIncludeValue(),
                orderBy: {
                    salesOrderNo: 'asc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize
            })
        ]);
        return {
            items: items.map((item) => prisma_sales_record_mapper_1.PrismaSalesRecordMapper.toSalesOrder(item)),
            total,
            page,
            pageSize
        };
    }
};
exports.PrismaSalesOrderRepository = PrismaSalesOrderRepository;
exports.PrismaSalesOrderRepository = PrismaSalesOrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSalesOrderRepository);
/** formatDocumentNo converts one numeric sequence into the frozen sales document summary format. */
function formatDocumentNo(prefix, value) {
    return `${prefix}-${String(value).padStart(4, '0')}`;
}
//# sourceMappingURL=prisma-sales-order.repository.js.map