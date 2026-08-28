-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "TenantPartyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "IdentifierStatus" AS ENUM ('DECLARED', 'VERIFIED', 'INVALID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TenantPartyProfileItemType" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'WECHAT', 'DOMAIN', 'WEBSITE', 'SOCIAL_PROFILE', 'MARKETPLACE_STORE');

-- CreateTable
CREATE TABLE "TenantParty" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "type" "PartyType" NOT NULL,
    "legalName" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    "localCode" VARCHAR(100),
    "registeredCountry" VARCHAR(50),
    "tags" JSONB,
    "status" "TenantPartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPartyProfileItem" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "tenantPartyId" UUID NOT NULL,
    "itemType" "TenantPartyProfileItemType" NOT NULL,
    "normalizedValue" VARCHAR(255) NOT NULL,
    "rawValue" VARCHAR(255) NOT NULL,
    "label" VARCHAR(100),
    "role" VARCHAR(80),
    "status" VARCHAR(40) NOT NULL DEFAULT 'ASSERTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPartyProfileItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPartyIdentifier" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "tenantPartyId" UUID NOT NULL,
    "identifierType" VARCHAR(100) NOT NULL,
    "normalizedValue" VARCHAR(255) NOT NULL,
    "rawValue" VARCHAR(255) NOT NULL,
    "issuerCountryOrRegion" VARCHAR(50) NOT NULL DEFAULT '',
    "status" "IdentifierStatus" NOT NULL DEFAULT 'DECLARED',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPartyIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartyRegistrationIdempotency" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "operation" VARCHAR(80) NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "tenantPartyId" UUID NOT NULL,
    "matchResult" VARCHAR(80),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartyRegistrationIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantParty_tenantId_idx" ON "TenantParty"("tenantId");

-- CreateIndex
CREATE INDEX "TenantParty_tenantId_type_idx" ON "TenantParty"("tenantId", "type");

-- CreateIndex
CREATE INDEX "TenantParty_tenantId_status_idx" ON "TenantParty"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TenantParty_tenantId_legalName_idx" ON "TenantParty"("tenantId", "legalName");

-- CreateIndex
CREATE INDEX "TenantPartyProfileItem_tenantId_itemType_normalizedValue_idx" ON "TenantPartyProfileItem"("tenantId", "itemType", "normalizedValue");

-- CreateIndex
CREATE INDEX "TenantPartyProfileItem_tenantId_tenantPartyId_idx" ON "TenantPartyProfileItem"("tenantId", "tenantPartyId");

-- CreateIndex
CREATE INDEX "TenantPartyIdentifier_tenantId_tenantPartyId_idx" ON "TenantPartyIdentifier"("tenantId", "tenantPartyId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantPartyIdentifier_tenantId_identifierType_issuerCountry_key" ON "TenantPartyIdentifier"("tenantId", "identifierType", "issuerCountryOrRegion", "normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "PartyRegistrationIdempotency_idempotencyKey_key" ON "PartyRegistrationIdempotency"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PartyRegistrationIdempotency_operation_idx" ON "PartyRegistrationIdempotency"("operation");

-- CreateIndex
CREATE INDEX "PartyRegistrationIdempotency_tenantPartyId_idx" ON "PartyRegistrationIdempotency"("tenantPartyId");

-- AddForeignKey
ALTER TABLE "TenantPartyProfileItem" ADD CONSTRAINT "TenantPartyProfileItem_tenantPartyId_fkey" FOREIGN KEY ("tenantPartyId") REFERENCES "TenantParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPartyIdentifier" ADD CONSTRAINT "TenantPartyIdentifier_tenantPartyId_fkey" FOREIGN KEY ("tenantPartyId") REFERENCES "TenantParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyRegistrationIdempotency" ADD CONSTRAINT "PartyRegistrationIdempotency_tenantPartyId_fkey" FOREIGN KEY ("tenantPartyId") REFERENCES "TenantParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
