-- CreateEnum
CREATE TYPE "SalesQuoteStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SalesFulfillmentHandoffStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "PriceListType" AS ENUM ('STANDARD', 'ACTIVITY', 'EXHIBITION');

-- CreateEnum
CREATE TYPE "PriceListStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CustomerPriceAgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "SalesSequenceCounter" (
    "tenantId" VARCHAR(128) NOT NULL,
    "nextQuoteNo" INTEGER NOT NULL DEFAULT 1,
    "nextSalesOrderNo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesSequenceCounter_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "SalesQuote" (
    "id" UUID NOT NULL,
    "quoteNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "customerTenantPartyId" VARCHAR(128) NOT NULL,
    "opportunityId" VARCHAR(128),
    "opportunityNo" VARCHAR(128),
    "opportunityName" VARCHAR(255),
    "status" "SalesQuoteStatus" NOT NULL,
    "latestPublishedVersionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesQuoteLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "quoteId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemId" VARCHAR(128) NOT NULL,
    "itemSnapshot" JSONB NOT NULL,
    "salesConfigSnapshot" JSONB NOT NULL,
    "packagingRequirementSnapshot" JSONB NOT NULL,
    "priceQuantityDeliverySnapshot" JSONB NOT NULL,
    "customerItemSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesQuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesQuoteVersion" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "quoteNo" VARCHAR(64) NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "customerTenantPartyId" VARCHAR(128) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesQuoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesQuoteVersionLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "quoteVersionId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemId" VARCHAR(128) NOT NULL,
    "itemSnapshot" JSONB NOT NULL,
    "salesConfigSnapshot" JSONB NOT NULL,
    "packagingRequirementSnapshot" JSONB NOT NULL,
    "priceQuantityDeliverySnapshot" JSONB NOT NULL,
    "customerItemSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesQuoteVersionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" UUID NOT NULL,
    "salesOrderNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "customerTenantPartyId" VARCHAR(128) NOT NULL,
    "quoteId" UUID NOT NULL,
    "quoteVersionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderCommercialGateSummary" (
    "salesOrderId" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orderEstablished" BOOLEAN NOT NULL,
    "productionGate" BOOLEAN NOT NULL,
    "stockingGate" BOOLEAN NOT NULL,
    "shippingGate" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderCommercialGateSummary_pkey" PRIMARY KEY ("salesOrderId")
);

-- CreateTable
CREATE TABLE "SalesOrderFulfillmentHandoffSummary" (
    "salesOrderId" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "status" "SalesFulfillmentHandoffStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderFulfillmentHandoffSummary_pkey" PRIMARY KEY ("salesOrderId")
);

-- CreateTable
CREATE TABLE "SalesOrderLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "salesOrderId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemId" VARCHAR(128) NOT NULL,
    "itemSnapshot" JSONB NOT NULL,
    "salesConfigSnapshot" JSONB NOT NULL,
    "packagingRequirementSnapshot" JSONB NOT NULL,
    "priceQuantityDeliverySnapshot" JSONB NOT NULL,
    "customerItemSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPriceList" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "priceListName" VARCHAR(255) NOT NULL,
    "priceListType" "PriceListType" NOT NULL,
    "status" "PriceListStatus" NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesPriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPriceListLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "priceListId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemId" VARCHAR(128) NOT NULL,
    "brandKey" VARCHAR(128),
    "priceSnapshot" JSONB NOT NULL,
    "moqSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesPriceListLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCustomerPriceAgreementVersion" (
    "id" UUID NOT NULL,
    "customerPriceAgreementId" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "customerTenantPartyId" VARCHAR(128) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "status" "CustomerPriceAgreementStatus" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCustomerPriceAgreementVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCustomerPriceAgreementLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "customerPriceAgreementVersionId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemId" VARCHAR(128) NOT NULL,
    "brandKey" VARCHAR(128),
    "priceSnapshot" JSONB NOT NULL,
    "moqSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCustomerPriceAgreementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesAuditEnvelope" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "operatorId" TEXT,
    "operatorType" TEXT NOT NULL,
    "tenantId" TEXT,
    "orgId" TEXT,
    "traceId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesQuote_quoteNo_key" ON "SalesQuote"("quoteNo");

-- CreateIndex
CREATE INDEX "SalesQuote_tenantId_status_quoteNo_idx" ON "SalesQuote"("tenantId", "status", "quoteNo");

-- CreateIndex
CREATE INDEX "SalesQuote_tenantId_customerTenantPartyId_quoteNo_idx" ON "SalesQuote"("tenantId", "customerTenantPartyId", "quoteNo");

-- CreateIndex
CREATE INDEX "SalesQuoteLine_tenantId_quoteId_lineNo_idx" ON "SalesQuoteLine"("tenantId", "quoteId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesQuoteLine_quoteId_lineNo_key" ON "SalesQuoteLine"("quoteId", "lineNo");

-- CreateIndex
CREATE INDEX "SalesQuoteVersion_tenantId_quoteId_versionNo_idx" ON "SalesQuoteVersion"("tenantId", "quoteId", "versionNo");

-- CreateIndex
CREATE INDEX "SalesQuoteVersion_tenantId_publishedAt_idx" ON "SalesQuoteVersion"("tenantId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalesQuoteVersion_quoteId_versionNo_key" ON "SalesQuoteVersion"("quoteId", "versionNo");

-- CreateIndex
CREATE INDEX "SalesQuoteVersionLine_tenantId_quoteVersionId_lineNo_idx" ON "SalesQuoteVersionLine"("tenantId", "quoteVersionId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesQuoteVersionLine_quoteVersionId_lineNo_key" ON "SalesQuoteVersionLine"("quoteVersionId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_salesOrderNo_key" ON "SalesOrder"("salesOrderNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_quoteVersionId_key" ON "SalesOrder"("quoteVersionId");

-- CreateIndex
CREATE INDEX "SalesOrder_tenantId_salesOrderNo_idx" ON "SalesOrder"("tenantId", "salesOrderNo");

-- CreateIndex
CREATE INDEX "SalesOrder_tenantId_customerTenantPartyId_salesOrderNo_idx" ON "SalesOrder"("tenantId", "customerTenantPartyId", "salesOrderNo");

-- CreateIndex
CREATE INDEX "SalesOrderCommercialGateSummary_tenantId_productionGate_sto_idx" ON "SalesOrderCommercialGateSummary"("tenantId", "productionGate", "stockingGate", "shippingGate");

-- CreateIndex
CREATE INDEX "SalesOrderFulfillmentHandoffSummary_tenantId_status_submitt_idx" ON "SalesOrderFulfillmentHandoffSummary"("tenantId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "SalesOrderLine_tenantId_salesOrderId_lineNo_idx" ON "SalesOrderLine"("tenantId", "salesOrderId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrderLine_salesOrderId_lineNo_key" ON "SalesOrderLine"("salesOrderId", "lineNo");

-- CreateIndex
CREATE INDEX "SalesPriceList_tenantId_status_priceListType_currencyCode_e_idx" ON "SalesPriceList"("tenantId", "status", "priceListType", "currencyCode", "effectiveFrom");

-- CreateIndex
CREATE INDEX "SalesPriceList_tenantId_priceListName_idx" ON "SalesPriceList"("tenantId", "priceListName");

-- CreateIndex
CREATE INDEX "SalesPriceListLine_tenantId_priceListId_itemId_lineNo_idx" ON "SalesPriceListLine"("tenantId", "priceListId", "itemId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesPriceListLine_priceListId_lineNo_key" ON "SalesPriceListLine"("priceListId", "lineNo");

-- CreateIndex
CREATE INDEX "SalesCustomerPriceAgreementVersion_tenantId_customerPriceAg_idx" ON "SalesCustomerPriceAgreementVersion"("tenantId", "customerPriceAgreementId", "versionNo");

-- CreateIndex
CREATE INDEX "SalesCustomerPriceAgreementVersion_tenantId_customerTenantP_idx" ON "SalesCustomerPriceAgreementVersion"("tenantId", "customerTenantPartyId", "currencyCode", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCustomerPriceAgreementVersion_customerPriceAgreementId_key" ON "SalesCustomerPriceAgreementVersion"("customerPriceAgreementId", "versionNo");

-- CreateIndex
CREATE INDEX "SalesCustomerPriceAgreementLine_tenantId_customerPriceAgree_idx" ON "SalesCustomerPriceAgreementLine"("tenantId", "customerPriceAgreementVersionId", "itemId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCustomerPriceAgreementLine_customerPriceAgreementVersi_key" ON "SalesCustomerPriceAgreementLine"("customerPriceAgreementVersionId", "lineNo");

-- CreateIndex
CREATE INDEX "SalesAuditEnvelope_service_module_eventType_occurredAt_idx" ON "SalesAuditEnvelope"("service", "module", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "SalesAuditEnvelope_tenantId_occurredAt_idx" ON "SalesAuditEnvelope"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "SalesAuditEnvelope_resourceType_resourceId_occurredAt_idx" ON "SalesAuditEnvelope"("resourceType", "resourceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "SalesQuoteLine" ADD CONSTRAINT "SalesQuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "SalesQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuoteVersionLine" ADD CONSTRAINT "SalesQuoteVersionLine_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "SalesQuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderCommercialGateSummary" ADD CONSTRAINT "SalesOrderCommercialGateSummary_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderFulfillmentHandoffSummary" ADD CONSTRAINT "SalesOrderFulfillmentHandoffSummary_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderLine" ADD CONSTRAINT "SalesOrderLine_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPriceListLine" ADD CONSTRAINT "SalesPriceListLine_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "SalesPriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCustomerPriceAgreementLine" ADD CONSTRAINT "SalesCustomerPriceAgreementLine_customerPriceAgreementVers_fkey" FOREIGN KEY ("customerPriceAgreementVersionId") REFERENCES "SalesCustomerPriceAgreementVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
