-- CreateEnum
CREATE TYPE "WmsWarehouseScope" AS ENUM ('INTERNAL');

-- CreateEnum
CREATE TYPE "WmsWarehouseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WmsLocationScope" AS ENUM ('INTERNAL');

-- CreateEnum
CREATE TYPE "WmsLocationType" AS ENUM ('RECEIVING', 'STORAGE', 'STAGING', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "WmsLocationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WmsReceiptStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WmsReceiptSourceType" AS ENUM ('MANUAL', 'RECEIVING_EXPECTATION_REFERENCE');

-- CreateEnum
CREATE TYPE "WmsInventoryStatus" AS ENUM ('AVAILABLE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "WmsStockLedgerEntryType" AS ENUM ('RECEIPT_POSTED');

-- CreateEnum
CREATE TYPE "WmsStockLedgerDirection" AS ENUM ('IN');

-- CreateEnum
CREATE TYPE "WmsStockLedgerSourceDocumentType" AS ENUM ('RECEIPT');

-- CreateTable
CREATE TABLE "WmsSequenceCounter" (
    "tenantId" VARCHAR(128) NOT NULL,
    "nextReceiptNo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WmsSequenceCounter_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "warehouseCode" VARCHAR(128) NOT NULL,
    "warehouseName" VARCHAR(255) NOT NULL,
    "warehouseScope" "WmsWarehouseScope" NOT NULL,
    "status" "WmsWarehouseStatus" NOT NULL,
    "defaultReceivingLocationId" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "warehouseId" VARCHAR(128) NOT NULL,
    "parentLocationId" VARCHAR(128),
    "locationCode" VARCHAR(128) NOT NULL,
    "locationName" VARCHAR(255) NOT NULL,
    "locationScope" "WmsLocationScope" NOT NULL,
    "locationType" "WmsLocationType" NOT NULL,
    "status" "WmsLocationStatus" NOT NULL,
    "supportsReceipt" BOOLEAN NOT NULL,
    "supportsStorage" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" VARCHAR(128) NOT NULL,
    "receiptNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "warehouseId" VARCHAR(128) NOT NULL,
    "status" "WmsReceiptStatus" NOT NULL,
    "receiptSourceType" "WmsReceiptSourceType" NOT NULL,
    "referencedReceivingExpectationIds" JSONB NOT NULL,
    "receiptDate" VARCHAR(64) NOT NULL,
    "note" VARCHAR(500),
    "attachmentRefs" JSONB NOT NULL,
    "lineCount" INTEGER NOT NULL,
    "postedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" VARCHAR(500),
    "postComment" VARCHAR(500),
    "procurementReceiptSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptLine" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "receiptId" VARCHAR(128) NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemId" VARCHAR(128) NOT NULL,
    "itemCode" VARCHAR(128),
    "itemName" VARCHAR(255),
    "receivingExpectationId" VARCHAR(128),
    "targetLocationId" VARCHAR(128) NOT NULL,
    "confirmedQuantity" VARCHAR(64) NOT NULL,
    "uom" VARCHAR(64) NOT NULL,
    "inventoryStatus" "WmsInventoryStatus" NOT NULL,
    "restrictedReason" JSONB,
    "trackingRefs" JSONB NOT NULL,
    "physicalDiscrepancy" JSONB,
    "evidenceAttachmentRefs" JSONB NOT NULL,
    "postedStockLedgerEntryIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLedgerEntry" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "entryType" "WmsStockLedgerEntryType" NOT NULL,
    "direction" "WmsStockLedgerDirection" NOT NULL,
    "warehouseId" VARCHAR(128) NOT NULL,
    "locationId" VARCHAR(128) NOT NULL,
    "itemId" VARCHAR(128) NOT NULL,
    "itemCode" VARCHAR(128),
    "itemName" VARCHAR(255),
    "quantityDelta" VARCHAR(64) NOT NULL,
    "uom" VARCHAR(64) NOT NULL,
    "inventoryStatus" "WmsInventoryStatus" NOT NULL,
    "restrictedReason" JSONB,
    "sourceDocumentType" "WmsStockLedgerSourceDocumentType" NOT NULL,
    "sourceDocumentId" VARCHAR(128) NOT NULL,
    "sourceDocumentLineId" VARCHAR(128) NOT NULL,
    "receivingExpectationId" VARCHAR(128),
    "trackingRefs" JSONB NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBalance" (
    "balanceKey" VARCHAR(255) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "warehouseId" VARCHAR(128) NOT NULL,
    "locationId" VARCHAR(128),
    "itemId" VARCHAR(128) NOT NULL,
    "itemCode" VARCHAR(128),
    "itemName" VARCHAR(255),
    "uom" VARCHAR(64) NOT NULL,
    "onHandQuantity" VARCHAR(64) NOT NULL,
    "availableQuantity" VARCHAR(64) NOT NULL,
    "restrictedQuantity" VARCHAR(64) NOT NULL,
    "restrictedQuantities" JSONB NOT NULL,
    "lastLedgerEntryId" VARCHAR(128) NOT NULL,
    "lastPostedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("balanceKey")
);

-- CreateTable
CREATE TABLE "WmsAuditEnvelope" (
    "id" VARCHAR(128) NOT NULL,
    "service" VARCHAR(128) NOT NULL,
    "module" VARCHAR(128) NOT NULL,
    "eventType" VARCHAR(128) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" VARCHAR(64) NOT NULL,
    "operatorId" VARCHAR(128),
    "operatorType" VARCHAR(64),
    "tenantId" VARCHAR(128),
    "orgId" VARCHAR(128),
    "traceId" VARCHAR(128),
    "resourceType" VARCHAR(128),
    "resourceId" VARCHAR(128),
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WmsAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warehouse_tenantId_orgId_status_idx" ON "Warehouse"("tenantId", "orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_tenantId_warehouseCode_key" ON "Warehouse"("tenantId", "warehouseCode");

-- CreateIndex
CREATE INDEX "Location_tenantId_warehouseId_locationType_status_idx" ON "Location"("tenantId", "warehouseId", "locationType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Location_warehouseId_locationCode_key" ON "Location"("warehouseId", "locationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");

-- CreateIndex
CREATE INDEX "Receipt_tenantId_warehouseId_status_idx" ON "Receipt"("tenantId", "warehouseId", "status");

-- CreateIndex
CREATE INDEX "Receipt_tenantId_receiptDate_idx" ON "Receipt"("tenantId", "receiptDate");

-- CreateIndex
CREATE INDEX "ReceiptLine_tenantId_itemId_idx" ON "ReceiptLine"("tenantId", "itemId");

-- CreateIndex
CREATE INDEX "ReceiptLine_tenantId_receivingExpectationId_idx" ON "ReceiptLine"("tenantId", "receivingExpectationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptLine_receiptId_lineNo_key" ON "ReceiptLine"("receiptId", "lineNo");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_tenantId_warehouseId_itemId_postedAt_idx" ON "StockLedgerEntry"("tenantId", "warehouseId", "itemId", "postedAt");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_tenantId_sourceDocumentId_sourceDocumentLi_idx" ON "StockLedgerEntry"("tenantId", "sourceDocumentId", "sourceDocumentLineId");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_tenantId_receivingExpectationId_idx" ON "StockLedgerEntry"("tenantId", "receivingExpectationId");

-- CreateIndex
CREATE INDEX "InventoryBalance_tenantId_warehouseId_itemId_idx" ON "InventoryBalance"("tenantId", "warehouseId", "itemId");

-- CreateIndex
CREATE INDEX "InventoryBalance_tenantId_warehouseId_locationId_itemId_idx" ON "InventoryBalance"("tenantId", "warehouseId", "locationId", "itemId");

-- CreateIndex
CREATE INDEX "WmsAuditEnvelope_tenantId_occurredAt_idx" ON "WmsAuditEnvelope"("tenantId", "occurredAt");

-- AddForeignKey
ALTER TABLE "ReceiptLine" ADD CONSTRAINT "ReceiptLine_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
