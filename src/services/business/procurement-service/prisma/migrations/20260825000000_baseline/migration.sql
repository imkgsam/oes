-- CreateEnum
CREATE TYPE "ProcurementPurchaseRequestType" AS ENUM ('DEPARTMENTAL', 'SALES_DEDICATED', 'PRODUCTION_PACKAGING', 'MAINTENANCE', 'SAMPLE');

-- CreateEnum
CREATE TYPE "ProcurementPurchaseRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_CONVERTED', 'CONVERTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProcurementPurchaseRequestLineType" AS ENUM ('STANDARD_ITEM', 'TEXT');

-- CreateEnum
CREATE TYPE "ProcurementPurchaseRequestLineConversionStatus" AS ENUM ('NOT_CONVERTED', 'PARTIALLY_CONVERTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ProcurementPurchaseRequestDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProcurementPurchaseOrderStatus" AS ENUM ('DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProcurementPurchaseOrderLineAllocationType" AS ENUM ('PURCHASE_REQUEST_LINE', 'SALES_ORDER_LINE', 'FULFILLMENT_DEMAND', 'GENERAL_STOCK');

-- CreateEnum
CREATE TYPE "ProcurementSupplierAcknowledgementStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "ProcurementPurchaseOrderChangeStatus" AS ENUM ('APPLIED');

-- CreateEnum
CREATE TYPE "ProcurementReceivingExpectationStatus" AS ENUM ('OPEN', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProcurementReceivingDiscrepancyType" AS ENUM ('SHORT_RECEIVED', 'OVER_RECEIVED', 'DAMAGED', 'WRONG_ITEM', 'QUALITY_HOLD');

-- CreateEnum
CREATE TYPE "ProcurementReceivingDiscrepancyStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ProcurementReceivingResolutionCode" AS ENUM ('WAIT_REDELIVERY', 'CLOSE_UNRECEIVED', 'REQUEST_RESEND', 'ACCEPT_WITH_PO_CHANGE', 'REJECT_EXCESS', 'TEMP_HOLD', 'REJECT_DAMAGED', 'RECEIVE_WITH_RESTRICTION', 'CLAIM', 'REJECT_WRONG_ITEM', 'TEMP_RECEIVE_PENDING_DECISION', 'ACCEPT_WITH_CONTROLLED_CHANGE', 'WAIT_INSPECTION', 'ACCEPT_WITH_ALLOWANCE', 'RETURN_TO_SUPPLIER');

-- CreateTable
CREATE TABLE "ProcurementSequenceCounter" (
    "tenantId" VARCHAR(128) NOT NULL,
    "nextPurchaseRequestNo" INTEGER NOT NULL DEFAULT 1,
    "nextPurchaseOrderNo" INTEGER NOT NULL DEFAULT 1,
    "nextReceivingExpectationNo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementSequenceCounter_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" UUID NOT NULL,
    "requestNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "requestType" "ProcurementPurchaseRequestType" NOT NULL,
    "status" "ProcurementPurchaseRequestStatus" NOT NULL,
    "requesterOperatorId" VARCHAR(128) NOT NULL,
    "requesterDisplayName" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255),
    "reason" VARCHAR(500),
    "submissionComment" VARCHAR(500),
    "cancelReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "linkedPurchaseOrders" JSONB NOT NULL,
    "nextExpectedReceiptDate" VARCHAR(64),
    "receivingStatusSummary" VARCHAR(128),

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "purchaseRequestId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "lineType" "ProcurementPurchaseRequestLineType" NOT NULL,
    "itemId" VARCHAR(128),
    "itemCode" VARCHAR(128),
    "itemName" VARCHAR(255),
    "description" VARCHAR(500) NOT NULL,
    "requestedQuantity" VARCHAR(64) NOT NULL,
    "uom" VARCHAR(64) NOT NULL,
    "neededByDate" VARCHAR(64),
    "demandReferenceType" VARCHAR(128),
    "demandReferenceId" VARCHAR(128),
    "conversionStatus" "ProcurementPurchaseRequestLineConversionStatus" NOT NULL,
    "linkedPurchaseOrderLines" JSONB NOT NULL,

    CONSTRAINT "PurchaseRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestApprovalSnapshot" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "purchaseRequestId" UUID NOT NULL,
    "decision" "ProcurementPurchaseRequestDecision" NOT NULL,
    "decidedByOperatorId" VARCHAR(128) NOT NULL,
    "decidedByDisplayName" VARCHAR(255) NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "comment" VARCHAR(500),
    "approvalReference" VARCHAR(255),

    CONSTRAINT "PurchaseRequestApprovalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "orderNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "status" "ProcurementPurchaseOrderStatus" NOT NULL,
    "currencyCode" VARCHAR(32) NOT NULL,
    "supplierId" VARCHAR(128) NOT NULL,
    "supplierDisplayName" VARCHAR(255) NOT NULL,
    "supplierStatusAtIssue" VARCHAR(64),
    "paymentTermsCode" VARCHAR(128),
    "paymentTermsText" VARCHAR(500),
    "incotermCode" VARCHAR(128),
    "commercialTermsText" VARCHAR(500),
    "paymentStatusSummary" VARCHAR(128),
    "depositPaidAmount" VARCHAR(64),
    "balancePaidAmount" VARCHAR(64),
    "paymentSummaryCurrencyCode" VARCHAR(32),
    "attachmentRefs" JSONB NOT NULL,
    "lastPaymentAt" TIMESTAMP(3),
    "sourcePurchaseRequestIds" JSONB NOT NULL,
    "sourcePurchaseRequestNos" JSONB NOT NULL,
    "acknowledgementStatus" "ProcurementSupplierAcknowledgementStatus" NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgementExternalReference" VARCHAR(255),
    "acknowledgementComment" VARCHAR(500),
    "issueComment" VARCHAR(500),
    "cancelReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "lineType" "ProcurementPurchaseRequestLineType" NOT NULL,
    "itemId" VARCHAR(128),
    "itemCode" VARCHAR(128),
    "itemName" VARCHAR(255),
    "description" VARCHAR(500) NOT NULL,
    "supplierOfferingId" VARCHAR(128),
    "orderedQuantity" VARCHAR(64) NOT NULL,
    "uom" VARCHAR(64) NOT NULL,
    "orderedUnitPrice" VARCHAR(64),
    "sourcePurchaseRequestLineId" VARCHAR(128),
    "sourceRequestedQuantity" VARCHAR(64),
    "generalStockExcessReason" VARCHAR(500),

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLineAllocation" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "purchaseOrderLineId" UUID NOT NULL,
    "allocationType" "ProcurementPurchaseOrderLineAllocationType" NOT NULL,
    "sourceReferenceId" VARCHAR(128),
    "quantity" VARCHAR(64) NOT NULL,
    "reason" VARCHAR(500),
    "targetWarehouseId" VARCHAR(128),
    "targetReceivingAddressId" VARCHAR(128),

    CONSTRAINT "PurchaseOrderLineAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderChange" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "changeType" VARCHAR(128) NOT NULL,
    "changeSummary" VARCHAR(500) NOT NULL,
    "changeReason" VARCHAR(500),
    "appliedByOperatorId" VARCHAR(128) NOT NULL,
    "appliedByDisplayName" VARCHAR(255) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "status" "ProcurementPurchaseOrderChangeStatus" NOT NULL,

    CONSTRAINT "PurchaseOrderChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivingExpectation" (
    "id" UUID NOT NULL,
    "expectationNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "purchaseOrderId" UUID NOT NULL,
    "purchaseOrderLineId" UUID NOT NULL,
    "supplierId" VARCHAR(128) NOT NULL,
    "allocationGroupingKey" VARCHAR(255) NOT NULL,
    "sourceAllocationIds" JSONB NOT NULL,
    "targetWarehouseId" VARCHAR(128),
    "targetReceivingAddressId" VARCHAR(128),
    "expectedQuantity" VARCHAR(64) NOT NULL,
    "receivedQuantitySummary" VARCHAR(64) NOT NULL,
    "openQuantity" VARCHAR(64) NOT NULL,
    "expectedReceiptDate" VARCHAR(64),
    "status" "ProcurementReceivingExpectationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceivingExpectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivingDiscrepancy" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "receivingExpectationId" UUID NOT NULL,
    "discrepancyType" "ProcurementReceivingDiscrepancyType" NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "status" "ProcurementReceivingDiscrepancyStatus" NOT NULL,
    "resolutionCode" "ProcurementReceivingResolutionCode",
    "resolutionNote" VARCHAR(500),
    "resolutionReferences" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReceivingDiscrepancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementAuditEnvelope" (
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

    CONSTRAINT "ProcurementAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_requestNo_key" ON "PurchaseRequest"("requestNo");

-- CreateIndex
CREATE INDEX "PurchaseRequest_tenantId_requestNo_idx" ON "PurchaseRequest"("tenantId", "requestNo");

-- CreateIndex
CREATE INDEX "PurchaseRequest_tenantId_status_requestType_idx" ON "PurchaseRequest"("tenantId", "status", "requestType");

-- CreateIndex
CREATE INDEX "PurchaseRequest_tenantId_requesterOperatorId_idx" ON "PurchaseRequest"("tenantId", "requesterOperatorId");

-- CreateIndex
CREATE INDEX "PurchaseRequestLine_tenantId_itemId_idx" ON "PurchaseRequestLine"("tenantId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequestLine_purchaseRequestId_lineNo_key" ON "PurchaseRequestLine"("purchaseRequestId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequestApprovalSnapshot_purchaseRequestId_key" ON "PurchaseRequestApprovalSnapshot"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequestApprovalSnapshot_tenantId_decision_idx" ON "PurchaseRequestApprovalSnapshot"("tenantId", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNo_key" ON "PurchaseOrder"("orderNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenantId_orderNo_idx" ON "PurchaseOrder"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenantId_status_supplierId_idx" ON "PurchaseOrder"("tenantId", "status", "supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_tenantId_itemId_idx" ON "PurchaseOrderLine"("tenantId", "itemId");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_tenantId_sourcePurchaseRequestLineId_idx" ON "PurchaseOrderLine"("tenantId", "sourcePurchaseRequestLineId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderLine_purchaseOrderId_lineNo_key" ON "PurchaseOrderLine"("purchaseOrderId", "lineNo");

-- CreateIndex
CREATE INDEX "PurchaseOrderLineAllocation_tenantId_allocationType_sourceR_idx" ON "PurchaseOrderLineAllocation"("tenantId", "allocationType", "sourceReferenceId");

-- CreateIndex
CREATE INDEX "PurchaseOrderChange_tenantId_purchaseOrderId_appliedAt_idx" ON "PurchaseOrderChange"("tenantId", "purchaseOrderId", "appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivingExpectation_expectationNo_key" ON "ReceivingExpectation"("expectationNo");

-- CreateIndex
CREATE INDEX "ReceivingExpectation_tenantId_purchaseOrderLineId_idx" ON "ReceivingExpectation"("tenantId", "purchaseOrderLineId");

-- CreateIndex
CREATE INDEX "ReceivingExpectation_tenantId_purchaseOrderId_status_idx" ON "ReceivingExpectation"("tenantId", "purchaseOrderId", "status");

-- CreateIndex
CREATE INDEX "ReceivingExpectation_tenantId_supplierId_status_idx" ON "ReceivingExpectation"("tenantId", "supplierId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivingDiscrepancy_receivingExpectationId_key" ON "ReceivingDiscrepancy"("receivingExpectationId");

-- CreateIndex
CREATE INDEX "ReceivingDiscrepancy_tenantId_status_discrepancyType_idx" ON "ReceivingDiscrepancy"("tenantId", "status", "discrepancyType");

-- CreateIndex
CREATE INDEX "ProcurementAuditEnvelope_service_module_eventType_occurredA_idx" ON "ProcurementAuditEnvelope"("service", "module", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "ProcurementAuditEnvelope_tenantId_occurredAt_idx" ON "ProcurementAuditEnvelope"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "ProcurementAuditEnvelope_resourceType_resourceId_occurredAt_idx" ON "ProcurementAuditEnvelope"("resourceType", "resourceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "PurchaseRequestLine" ADD CONSTRAINT "PurchaseRequestLine_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestApprovalSnapshot" ADD CONSTRAINT "PurchaseRequestApprovalSnapshot_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLineAllocation" ADD CONSTRAINT "PurchaseOrderLineAllocation_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderChange" ADD CONSTRAINT "PurchaseOrderChange_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingExpectation" ADD CONSTRAINT "ReceivingExpectation_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingExpectation" ADD CONSTRAINT "ReceivingExpectation_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingDiscrepancy" ADD CONSTRAINT "ReceivingDiscrepancy_receivingExpectationId_fkey" FOREIGN KEY ("receivingExpectationId") REFERENCES "ReceivingExpectation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
