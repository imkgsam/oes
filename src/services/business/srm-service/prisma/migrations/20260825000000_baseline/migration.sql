-- CreateEnum
CREATE TYPE "SrmSupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SrmSupplierPartyBindingStatus" AS ENUM ('ACTIVE');

-- CreateEnum
CREATE TYPE "SrmSupplierOfferingStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "SrmSequenceCounter" (
    "tenantId" VARCHAR(128) NOT NULL,
    "nextSupplierProfileNo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SrmSequenceCounter_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "SupplierProfile" (
    "id" UUID NOT NULL,
    "supplierNo" VARCHAR(64) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "status" "SrmSupplierStatus" NOT NULL,
    "supplierCategory" VARCHAR(128),
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPartyBinding" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "supplierId" UUID NOT NULL,
    "tenantPartyId" VARCHAR(128) NOT NULL,
    "bindingStatus" "SrmSupplierPartyBindingStatus" NOT NULL,
    "partyDisplayName" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPartyBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierContact" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "supplierId" UUID NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "roleTitle" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(64),
    "isPrimaryContact" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierAddress" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "supplierId" UUID NOT NULL,
    "label" VARCHAR(128) NOT NULL,
    "countryCode" VARCHAR(32) NOT NULL,
    "region" VARCHAR(128),
    "locality" VARCHAR(128),
    "addressLine1" VARCHAR(255) NOT NULL,
    "addressLine2" VARCHAR(255),
    "postalCode" VARCHAR(64),
    "isPrimaryAddress" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierOffering" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "supplierId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "itemCode" VARCHAR(128),
    "itemName" VARCHAR(255),
    "status" "SrmSupplierOfferingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SrmAuditEnvelope" (
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

    CONSTRAINT "SrmAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_supplierNo_key" ON "SupplierProfile"("supplierNo");

-- CreateIndex
CREATE INDEX "SupplierProfile_tenantId_status_supplierNo_idx" ON "SupplierProfile"("tenantId", "status", "supplierNo");

-- CreateIndex
CREATE INDEX "SupplierProfile_tenantId_displayName_idx" ON "SupplierProfile"("tenantId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPartyBinding_supplierId_key" ON "SupplierPartyBinding"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPartyBinding_tenantId_tenantPartyId_idx" ON "SupplierPartyBinding"("tenantId", "tenantPartyId");

-- CreateIndex
CREATE INDEX "SupplierPartyBinding_tenantId_bindingStatus_idx" ON "SupplierPartyBinding"("tenantId", "bindingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPartyBinding_tenantId_tenantPartyId_key" ON "SupplierPartyBinding"("tenantId", "tenantPartyId");

-- CreateIndex
CREATE INDEX "SupplierContact_tenantId_supplierId_displayName_idx" ON "SupplierContact"("tenantId", "supplierId", "displayName");

-- CreateIndex
CREATE INDEX "SupplierAddress_tenantId_supplierId_label_idx" ON "SupplierAddress"("tenantId", "supplierId", "label");

-- CreateIndex
CREATE INDEX "SupplierOffering_tenantId_supplierId_status_idx" ON "SupplierOffering"("tenantId", "supplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierOffering_tenantId_itemId_status_idx" ON "SupplierOffering"("tenantId", "itemId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOffering_tenantId_supplierId_itemId_key" ON "SupplierOffering"("tenantId", "supplierId", "itemId");

-- CreateIndex
CREATE INDEX "SrmAuditEnvelope_service_module_eventType_occurredAt_idx" ON "SrmAuditEnvelope"("service", "module", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "SrmAuditEnvelope_tenantId_occurredAt_idx" ON "SrmAuditEnvelope"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "SrmAuditEnvelope_resourceType_resourceId_occurredAt_idx" ON "SrmAuditEnvelope"("resourceType", "resourceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "SupplierPartyBinding" ADD CONSTRAINT "SupplierPartyBinding_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierAddress" ADD CONSTRAINT "SupplierAddress_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOffering" ADD CONSTRAINT "SupplierOffering_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
