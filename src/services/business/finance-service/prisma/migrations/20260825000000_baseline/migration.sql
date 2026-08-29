-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('BANK', 'CASH', 'WECHAT', 'ALIPAY', 'PAYPAL', 'STRIPE', 'OTHER_PSP');

-- CreateEnum
CREATE TYPE "FinancialAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AccountTransactionDirection" AS ENUM ('INFLOW', 'OUTFLOW');

-- CreateEnum
CREATE TYPE "AccountTransactionSourceType" AS ENUM ('MANUAL', 'CSV_IMPORT', 'FUTURE_API');

-- CreateEnum
CREATE TYPE "AccountTransactionStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'VOIDED');

-- CreateEnum
CREATE TYPE "AccountTransactionAllocationStatus" AS ENUM ('UNALLOCATED', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED');

-- CreateEnum
CREATE TYPE "CustomerFinancialAccountVerifiedStatus" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ReceivableScheduleStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ReceivableScheduleLineStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "FinanceReleaseSignalStatus" AS ENUM ('RELEASED', 'HELD', 'REVIEW_REQUIRED');

-- CreateTable
CREATE TABLE "FinanceSequenceCounter" (
    "tenantId" VARCHAR(128) NOT NULL,
    "nextFinancialAccountNo" INTEGER NOT NULL DEFAULT 1,
    "nextReceivableScheduleNo" INTEGER NOT NULL DEFAULT 1,
    "nextPayableScheduleNo" INTEGER NOT NULL DEFAULT 1,
    "nextPaymentRequestNo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSequenceCounter_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" UUID NOT NULL,
    "accountNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "accountType" "FinancialAccountType" NOT NULL,
    "accountName" VARCHAR(255) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "institutionName" VARCHAR(255),
    "accountIdentifierMasked" VARCHAR(255) NOT NULL,
    "status" "FinancialAccountStatus" NOT NULL,
    "lastTransactionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAccountBalanceSnapshot" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "financialAccountId" UUID NOT NULL,
    "snapshotBalance" DECIMAL(18,6) NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAccountBalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTransactionImportBatch" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "financialAccountId" UUID NOT NULL,
    "sourceType" VARCHAR(64) NOT NULL,
    "sourceBatchReference" VARCHAR(255),
    "fileAssetId" VARCHAR(128),
    "attachmentRef" VARCHAR(255),
    "importedBy" VARCHAR(128) NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "acceptedCount" INTEGER NOT NULL,
    "duplicateCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountTransactionImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTransaction" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "financialAccountId" UUID NOT NULL,
    "importBatchId" UUID,
    "direction" "AccountTransactionDirection" NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "transactionTime" TIMESTAMP(3) NOT NULL,
    "valueDate" VARCHAR(32),
    "sourceType" "AccountTransactionSourceType" NOT NULL,
    "status" "AccountTransactionStatus" NOT NULL,
    "externalReference" VARCHAR(255),
    "counterpartyName" VARCHAR(255),
    "counterpartyAccountSnapshot" VARCHAR(255),
    "memo" VARCHAR(1000),
    "paymentExecutionId" VARCHAR(128),
    "allocationStatus" "AccountTransactionAllocationStatus" NOT NULL,
    "allocatedAmount" DECIMAL(18,6) NOT NULL,
    "unallocatedAmount" DECIMAL(18,6) NOT NULL,
    "fileAssetId" VARCHAR(128),
    "attachmentRef" VARCHAR(255),
    "dedupeKey" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFinancialAccount" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "customerTenantPartyId" VARCHAR(128) NOT NULL,
    "accountHolderName" VARCHAR(255) NOT NULL,
    "accountProviderType" VARCHAR(64) NOT NULL,
    "accountIdentifierMasked" VARCHAR(255) NOT NULL,
    "currencyCode" VARCHAR(16),
    "isDefault" BOOLEAN NOT NULL,
    "verifiedStatus" "CustomerFinancialAccountVerifiedStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierFinancialAccount" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "supplierTenantPartyId" VARCHAR(128) NOT NULL,
    "accountHolderName" VARCHAR(255) NOT NULL,
    "accountProviderType" VARCHAR(64) NOT NULL,
    "accountIdentifierMasked" VARCHAR(255) NOT NULL,
    "currencyCode" VARCHAR(16),
    "isDefault" BOOLEAN NOT NULL,
    "verifiedStatus" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierFinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivableSchedule" (
    "id" UUID NOT NULL,
    "scheduleNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "sourceSalesOrderId" VARCHAR(128) NOT NULL,
    "customerTenantPartyId" VARCHAR(128) NOT NULL,
    "customerSnapshot" VARCHAR(255) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "status" "ReceivableScheduleStatus" NOT NULL,
    "totalScheduledAmount" DECIMAL(18,6) NOT NULL,
    "totalAllocatedAmount" DECIMAL(18,6) NOT NULL,
    "outstandingAmount" DECIMAL(18,6) NOT NULL,
    "salesExchangeRateSnapshot" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceivableSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayableSchedule" (
    "id" UUID NOT NULL,
    "scheduleNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "sourceType" VARCHAR(64) NOT NULL,
    "sourcePurchaseOrderId" VARCHAR(128) NOT NULL,
    "sourcePurchaseOrderNo" VARCHAR(128),
    "procurementSnapshotReference" VARCHAR(255),
    "supplierTenantPartyId" VARCHAR(128) NOT NULL,
    "supplierSnapshot" VARCHAR(255) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "totalScheduledAmount" DECIMAL(18,6) NOT NULL,
    "totalRequestedAmount" DECIMAL(18,6) NOT NULL,
    "totalExecutedAmount" DECIMAL(18,6) NOT NULL,
    "totalAllocatedAmount" DECIMAL(18,6) NOT NULL,
    "outstandingAmount" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayableSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayableScheduleLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "payableScheduleId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "lineType" VARCHAR(64) NOT NULL,
    "sourceRef" VARCHAR(255) NOT NULL,
    "dueDate" VARCHAR(32) NOT NULL,
    "scheduledAmount" DECIMAL(18,6) NOT NULL,
    "requestedAmount" DECIMAL(18,6) NOT NULL,
    "executedAmount" DECIMAL(18,6) NOT NULL,
    "allocatedAmount" DECIMAL(18,6) NOT NULL,
    "outstandingAmount" DECIMAL(18,6) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "requestGovernanceStatus" VARCHAR(64) NOT NULL,
    "sourcePurchaseOrderLineId" VARCHAR(128),
    "supersedesSourceRef" VARCHAR(255),
    "memo" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayableScheduleLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivableScheduleLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "receivableScheduleId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "dueDate" VARCHAR(32) NOT NULL,
    "scheduledAmount" DECIMAL(18,6) NOT NULL,
    "allocatedAmount" DECIMAL(18,6) NOT NULL,
    "outstandingAmount" DECIMAL(18,6) NOT NULL,
    "status" "ReceivableScheduleLineStatus" NOT NULL,
    "sourceSalesOrderLineId" VARCHAR(128),
    "memo" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceivableScheduleLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "accountTransactionId" UUID NOT NULL,
    "paymentExecutionId" VARCHAR(128),
    "paymentRequestId" VARCHAR(128),
    "targetType" VARCHAR(64) NOT NULL,
    "targetScheduleId" UUID NOT NULL,
    "targetScheduleLineId" UUID NOT NULL,
    "allocatedAmount" DECIMAL(18,6) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" UUID NOT NULL,
    "requestNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "requestSource" VARCHAR(64) NOT NULL,
    "sourcePurchaseOrderId" VARCHAR(128),
    "supplierTenantPartyId" VARCHAR(128) NOT NULL,
    "supplierSnapshot" VARCHAR(255) NOT NULL,
    "beneficiarySupplierFinancialAccountId" VARCHAR(128) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "requestedAmount" DECIMAL(18,6) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "reason" VARCHAR(1000),
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequestLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "paymentRequestId" UUID NOT NULL,
    "payableScheduleId" UUID NOT NULL,
    "payableScheduleLineId" UUID NOT NULL,
    "scheduleDueDate" VARCHAR(32) NOT NULL,
    "requestedAmount" DECIMAL(18,6) NOT NULL,
    "executedAmount" DECIMAL(18,6) NOT NULL,
    "isEarlyRequest" BOOLEAN NOT NULL,
    "lineStatus" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierBillEvidenceSnapshot" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "paymentRequestId" UUID NOT NULL,
    "evidenceType" VARCHAR(64) NOT NULL,
    "externalDocumentNo" VARCHAR(255),
    "documentDate" VARCHAR(32),
    "currencyCode" VARCHAR(16),
    "documentAmount" DECIMAL(18,6),
    "attachmentRef" VARCHAR(255),
    "note" VARCHAR(1000),
    "capturedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierBillEvidenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentExecution" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "paymentRequestId" UUID NOT NULL,
    "supplierTenantPartyId" VARCHAR(128) NOT NULL,
    "sourceFinancialAccountId" UUID NOT NULL,
    "beneficiarySupplierFinancialAccountId" VARCHAR(128),
    "beneficiaryAccountSnapshot" VARCHAR(255),
    "executedAmount" DECIMAL(18,6) NOT NULL,
    "currencyCode" VARCHAR(16) NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "executionReference" VARCHAR(255),
    "attachmentRefs" JSONB NOT NULL,
    "linkedAccountTransactionId" VARCHAR(128),
    "status" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceReleaseSignal" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "salesOrderId" VARCHAR(128) NOT NULL,
    "customerTenantPartyId" VARCHAR(128) NOT NULL,
    "signalStatus" "FinanceReleaseSignalStatus" NOT NULL,
    "reasonCode" VARCHAR(128),
    "reasonSummary" VARCHAR(1000),
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "basedOnSummary" VARCHAR(1000),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceReleaseSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "baseCurrencyCode" VARCHAR(16) NOT NULL,
    "quoteCurrencyCode" VARCHAR(16) NOT NULL,
    "rateValue" DECIMAL(18,6) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "setBy" VARCHAR(128) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceAuditEnvelope" (
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

    CONSTRAINT "FinanceAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialAccount_tenantId_accountNo_idx" ON "FinancialAccount"("tenantId", "accountNo");

-- CreateIndex
CREATE INDEX "FinancialAccount_tenantId_status_accountType_idx" ON "FinancialAccount"("tenantId", "status", "accountType");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_tenantId_accountNo_key" ON "FinancialAccount"("tenantId", "accountNo");

-- CreateIndex
CREATE INDEX "FinancialAccountBalanceSnapshot_tenantId_financialAccountId_idx" ON "FinancialAccountBalanceSnapshot"("tenantId", "financialAccountId", "snapshotAt");

-- CreateIndex
CREATE INDEX "AccountTransactionImportBatch_tenantId_financialAccountId_c_idx" ON "AccountTransactionImportBatch"("tenantId", "financialAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "AccountTransaction_tenantId_financialAccountId_transactionT_idx" ON "AccountTransaction"("tenantId", "financialAccountId", "transactionTime");

-- CreateIndex
CREATE INDEX "AccountTransaction_tenantId_externalReference_idx" ON "AccountTransaction"("tenantId", "externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "AccountTransaction_tenantId_financialAccountId_dedupeKey_key" ON "AccountTransaction"("tenantId", "financialAccountId", "dedupeKey");

-- CreateIndex
CREATE INDEX "CustomerFinancialAccount_tenantId_customerTenantPartyId_isD_idx" ON "CustomerFinancialAccount"("tenantId", "customerTenantPartyId", "isDefault");

-- CreateIndex
CREATE INDEX "SupplierFinancialAccount_tenantId_supplierTenantPartyId_isD_idx" ON "SupplierFinancialAccount"("tenantId", "supplierTenantPartyId", "isDefault");

-- CreateIndex
CREATE INDEX "ReceivableSchedule_tenantId_sourceSalesOrderId_status_idx" ON "ReceivableSchedule"("tenantId", "sourceSalesOrderId", "status");

-- CreateIndex
CREATE INDEX "ReceivableSchedule_tenantId_customerTenantPartyId_scheduleN_idx" ON "ReceivableSchedule"("tenantId", "customerTenantPartyId", "scheduleNo");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivableSchedule_tenantId_scheduleNo_key" ON "ReceivableSchedule"("tenantId", "scheduleNo");

-- CreateIndex
CREATE INDEX "PayableSchedule_tenantId_sourcePurchaseOrderId_status_idx" ON "PayableSchedule"("tenantId", "sourcePurchaseOrderId", "status");

-- CreateIndex
CREATE INDEX "PayableSchedule_tenantId_supplierTenantPartyId_scheduleNo_idx" ON "PayableSchedule"("tenantId", "supplierTenantPartyId", "scheduleNo");

-- CreateIndex
CREATE UNIQUE INDEX "PayableSchedule_tenantId_scheduleNo_key" ON "PayableSchedule"("tenantId", "scheduleNo");

-- CreateIndex
CREATE INDEX "PayableScheduleLine_tenantId_payableScheduleId_dueDate_idx" ON "PayableScheduleLine"("tenantId", "payableScheduleId", "dueDate");

-- CreateIndex
CREATE INDEX "PayableScheduleLine_tenantId_sourceRef_idx" ON "PayableScheduleLine"("tenantId", "sourceRef");

-- CreateIndex
CREATE UNIQUE INDEX "PayableScheduleLine_payableScheduleId_lineNo_key" ON "PayableScheduleLine"("payableScheduleId", "lineNo");

-- CreateIndex
CREATE INDEX "ReceivableScheduleLine_tenantId_receivableScheduleId_dueDat_idx" ON "ReceivableScheduleLine"("tenantId", "receivableScheduleId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivableScheduleLine_receivableScheduleId_lineNo_key" ON "ReceivableScheduleLine"("receivableScheduleId", "lineNo");

-- CreateIndex
CREATE INDEX "PaymentAllocation_tenantId_accountTransactionId_allocatedAt_idx" ON "PaymentAllocation"("tenantId", "accountTransactionId", "allocatedAt");

-- CreateIndex
CREATE INDEX "PaymentAllocation_tenantId_paymentExecutionId_allocatedAt_idx" ON "PaymentAllocation"("tenantId", "paymentExecutionId", "allocatedAt");

-- CreateIndex
CREATE INDEX "PaymentAllocation_tenantId_targetScheduleId_targetScheduleL_idx" ON "PaymentAllocation"("tenantId", "targetScheduleId", "targetScheduleLineId");

-- CreateIndex
CREATE INDEX "PaymentRequest_tenantId_sourcePurchaseOrderId_status_idx" ON "PaymentRequest"("tenantId", "sourcePurchaseOrderId", "status");

-- CreateIndex
CREATE INDEX "PaymentRequest_tenantId_supplierTenantPartyId_requestedAt_idx" ON "PaymentRequest"("tenantId", "supplierTenantPartyId", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRequest_tenantId_requestNo_key" ON "PaymentRequest"("tenantId", "requestNo");

-- CreateIndex
CREATE INDEX "PaymentRequestLine_tenantId_paymentRequestId_idx" ON "PaymentRequestLine"("tenantId", "paymentRequestId");

-- CreateIndex
CREATE INDEX "PaymentRequestLine_tenantId_payableScheduleId_payableSchedu_idx" ON "PaymentRequestLine"("tenantId", "payableScheduleId", "payableScheduleLineId");

-- CreateIndex
CREATE INDEX "SupplierBillEvidenceSnapshot_tenantId_paymentRequestId_capt_idx" ON "SupplierBillEvidenceSnapshot"("tenantId", "paymentRequestId", "capturedAt");

-- CreateIndex
CREATE INDEX "PaymentExecution_tenantId_paymentRequestId_executedAt_idx" ON "PaymentExecution"("tenantId", "paymentRequestId", "executedAt");

-- CreateIndex
CREATE INDEX "PaymentExecution_tenantId_supplierTenantPartyId_executedAt_idx" ON "PaymentExecution"("tenantId", "supplierTenantPartyId", "executedAt");

-- CreateIndex
CREATE INDEX "FinanceReleaseSignal_tenantId_salesOrderId_effectiveAt_idx" ON "FinanceReleaseSignal"("tenantId", "salesOrderId", "effectiveAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_tenantId_baseCurrencyCode_quoteCurrencyCode_ef_idx" ON "ExchangeRate"("tenantId", "baseCurrencyCode", "quoteCurrencyCode", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_tenantId_baseCurrencyCode_quoteCurrencyCode_ef_key" ON "ExchangeRate"("tenantId", "baseCurrencyCode", "quoteCurrencyCode", "effectiveAt");

-- CreateIndex
CREATE INDEX "FinanceAuditEnvelope_service_module_eventType_occurredAt_idx" ON "FinanceAuditEnvelope"("service", "module", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "FinanceAuditEnvelope_tenantId_occurredAt_idx" ON "FinanceAuditEnvelope"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "FinanceAuditEnvelope_resourceType_resourceId_occurredAt_idx" ON "FinanceAuditEnvelope"("resourceType", "resourceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "FinancialAccountBalanceSnapshot" ADD CONSTRAINT "FinancialAccountBalanceSnapshot_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransactionImportBatch" ADD CONSTRAINT "AccountTransactionImportBatch_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "AccountTransactionImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableScheduleLine" ADD CONSTRAINT "PayableScheduleLine_payableScheduleId_fkey" FOREIGN KEY ("payableScheduleId") REFERENCES "PayableSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivableScheduleLine" ADD CONSTRAINT "ReceivableScheduleLine_receivableScheduleId_fkey" FOREIGN KEY ("receivableScheduleId") REFERENCES "ReceivableSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_accountTransactionId_fkey" FOREIGN KEY ("accountTransactionId") REFERENCES "AccountTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequestLine" ADD CONSTRAINT "PaymentRequestLine_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBillEvidenceSnapshot" ADD CONSTRAINT "SupplierBillEvidenceSnapshot_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentExecution" ADD CONSTRAINT "PaymentExecution_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
