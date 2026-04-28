"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSalesRecordMapper = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const sales_records_1 = require("../../../domain/models/sales-records");
const quoteInclude = {
    lines: {
        orderBy: {
            lineNo: 'asc'
        }
    }
};
const quoteVersionInclude = {
    lines: {
        orderBy: {
            lineNo: 'asc'
        }
    }
};
const salesOrderInclude = {
    lines: {
        orderBy: {
            lineNo: 'asc'
        }
    },
    commercialGateSummary: true,
    fulfillmentHandoffSummary: true
};
/** PrismaSalesRecordMapper translates Prisma sales persistence rows into the frozen phase 1 record shapes. */
class PrismaSalesRecordMapper {
    /** quoteIncludeValue exposes the canonical include graph for quote repository round-trips. */
    static quoteIncludeValue() {
        return quoteInclude;
    }
    /** quoteVersionIncludeValue exposes the canonical include graph for quote version repository reads. */
    static quoteVersionIncludeValue() {
        return quoteVersionInclude;
    }
    /** salesOrderIncludeValue exposes the canonical include graph for sales order repository reads. */
    static salesOrderIncludeValue() {
        return salesOrderInclude;
    }
    /** toQuote converts one persisted quote and its lines into the domain query and command record shape. */
    static toQuote(record) {
        return {
            id: record.id,
            quoteNo: record.quoteNo,
            tenantId: record.tenantId,
            customerTenantPartyId: record.customerTenantPartyId,
            opportunityRef: record.opportunityId && record.opportunityNo && record.opportunityName
                ? {
                    opportunityId: record.opportunityId,
                    opportunityNo: record.opportunityNo,
                    opportunityName: record.opportunityName
                }
                : null,
            status: record.status === prisma_1.SalesQuoteStatus.PUBLISHED
                ? sales_records_1.SalesQuoteStatus.PUBLISHED
                : sales_records_1.SalesQuoteStatus.DRAFT,
            latestPublishedVersionId: record.latestPublishedVersionId,
            lines: record.lines.map((line) => this.toQuoteLine(line))
        };
    }
    /** toQuoteVersion converts one persisted quote version and its lines into the immutable published record shape. */
    static toQuoteVersion(record) {
        return {
            id: record.id,
            quoteId: record.quoteId,
            quoteNo: record.quoteNo,
            versionNo: record.versionNo,
            tenantId: record.tenantId,
            customerTenantPartyId: record.customerTenantPartyId,
            publishedAt: record.publishedAt.toISOString(),
            lines: record.lines.map((line) => this.toQuoteLine(line))
        };
    }
    /** toSalesOrder converts one persisted order graph into the phase 1 established order record shape. */
    static toSalesOrder(record) {
        return {
            id: record.id,
            salesOrderNo: record.salesOrderNo,
            tenantId: record.tenantId,
            customerTenantPartyId: record.customerTenantPartyId,
            quoteId: record.quoteId,
            quoteVersionId: record.quoteVersionId,
            commercialGateSummary: this.toCommercialGateSummary(record.commercialGateSummary),
            fulfillmentHandoffStatus: this.toFulfillmentHandoffSummary(record.fulfillmentHandoffSummary),
            lines: record.lines.map((line) => this.toSalesOrderLine(line))
        };
    }
    /** toPersistedQuoteStatus converts the domain quote status enum into the Prisma enum value. */
    static toPersistedQuoteStatus(status) {
        return status === sales_records_1.SalesQuoteStatus.PUBLISHED
            ? prisma_1.SalesQuoteStatus.PUBLISHED
            : prisma_1.SalesQuoteStatus.DRAFT;
    }
    /** toPersistedHandoffStatus converts the domain handoff status enum into the Prisma enum value. */
    static toPersistedHandoffStatus(status) {
        return status === sales_records_1.SalesFulfillmentHandoffStatus.SUBMITTED
            ? prisma_1.SalesFulfillmentHandoffStatus.SUBMITTED
            : prisma_1.SalesFulfillmentHandoffStatus.NOT_SUBMITTED;
    }
    /** toInputJson deep-clones a plain snapshot object into a Prisma JSON input payload. */
    static toInputJson(value) {
        return structuredClone(value);
    }
    /** toQuoteLine converts one persisted quote-style line row into the shared quote line record shape. */
    static toQuoteLine(line) {
        return {
            quoteLineId: line.id,
            lineNo: line.lineNo,
            itemId: line.itemId,
            itemSnapshot: this.fromJson(line.itemSnapshot),
            salesConfigSnapshot: this.fromJson(line.salesConfigSnapshot),
            packagingRequirementSnapshot: this.fromJson(line.packagingRequirementSnapshot),
            priceQuantityDeliverySnapshot: this.fromJson(line.priceQuantityDeliverySnapshot),
            customerItemSnapshot: this.fromJson(line.customerItemSnapshot)
        };
    }
    /** toSalesOrderLine converts one persisted order line row into the frozen order line record shape. */
    static toSalesOrderLine(line) {
        return {
            salesOrderLineId: line.id,
            lineNo: line.lineNo,
            itemId: line.itemId,
            itemSnapshot: this.fromJson(line.itemSnapshot),
            salesConfigSnapshot: this.fromJson(line.salesConfigSnapshot),
            packagingRequirementSnapshot: this.fromJson(line.packagingRequirementSnapshot),
            priceQuantityDeliverySnapshot: this.fromJson(line.priceQuantityDeliverySnapshot),
            customerItemSnapshot: this.fromJson(line.customerItemSnapshot)
        };
    }
    /** toCommercialGateSummary converts the 1:1 gate summary row into the domain gate summary shape. */
    static toCommercialGateSummary(record) {
        return {
            orderEstablished: record?.orderEstablished ?? false,
            productionGate: record?.productionGate ?? false,
            stockingGate: record?.stockingGate ?? false,
            shippingGate: record?.shippingGate ?? false
        };
    }
    /** toFulfillmentHandoffSummary converts the 1:1 handoff summary row into the domain handoff shape. */
    static toFulfillmentHandoffSummary(record) {
        return {
            status: record?.status === prisma_1.SalesFulfillmentHandoffStatus.SUBMITTED
                ? sales_records_1.SalesFulfillmentHandoffStatus.SUBMITTED
                : sales_records_1.SalesFulfillmentHandoffStatus.NOT_SUBMITTED,
            submittedAt: record?.submittedAt?.toISOString() ?? null
        };
    }
    /** fromJson casts one stored JSON payload back into the snapshot shape used by the domain records. */
    static fromJson(value) {
        return structuredClone(value);
    }
}
exports.PrismaSalesRecordMapper = PrismaSalesRecordMapper;
//# sourceMappingURL=prisma-sales-record.mapper.js.map