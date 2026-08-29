-- CreateEnum
CREATE TYPE "CrmAccountLifecycleStage" AS ENUM ('LEAD', 'PROSPECT_CUSTOMER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "CrmAccountRecordStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CrmArchiveReason" AS ENUM ('LOW_VALUE', 'INVALID_TARGET', 'NON_TARGET_ACCOUNT', 'COMPETITOR', 'DUPLICATE', 'NO_FIT', 'UNRESPONSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "CrmAccountTypeHint" AS ENUM ('UNKNOWN', 'PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "CrmPriority" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "CrmSourceType" AS ENUM ('WEBSITE_FORM', 'EXHIBITION_SCAN', 'BUSINESS_CARD', 'ADVERTISEMENT', 'AD_CAMPAIGN', 'REFERRAL', 'IMPORTED_LIST', 'BROWSER_EXTENSION', 'WEB_RESEARCH', 'PEER_TRANSFER', 'SOCIAL_MEDIA', 'COLD_EMAIL', 'CUSTOMER_RECOMMENDATION', 'MANUAL_INPUT', 'OTHER');

-- CreateEnum
CREATE TYPE "CrmOpportunityStage" AS ENUM ('NEW', 'QUALIFYING', 'QUOTING', 'SAMPLE', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CrmOpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'MESSAGE', 'SOURCE_CAPTURED', 'STATUS_CHANGED', 'OWNER_CHANGED', 'OPPORTUNITY_CREATED', 'OPPORTUNITY_STAGE_CHANGED', 'OPPORTUNITY_CLOSED', 'QUOTE_VIEWED', 'EXTERNAL_EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "CrmActivityDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CrmActivityCreatedByType" AS ENUM ('USER', 'SYSTEM', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "CrmActivityVisibility" AS ENUM ('INTERNAL', 'TEAM', 'OWNER_ONLY');

-- CreateEnum
CREATE TYPE "CrmAccountProfileItemType" AS ENUM ('DOMAIN', 'WEBSITE', 'EMAIL', 'PHONE', 'WHATSAPP', 'WECHAT', 'SOCIAL_PROFILE', 'MARKETPLACE_STORE', 'IDENTIFIER', 'ADDRESS', 'BRAND_NAME', 'COMPANY_NAME');

-- CreateEnum
CREATE TYPE "CrmAccountProfileItemStatus" AS ENUM ('ACTIVE', 'REJECTED', 'ARCHIVED', 'PROMOTED');

-- CreateTable
CREATE TABLE "CrmAccount" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "tenantPartyId" VARCHAR(128),
    "recordStatus" "CrmAccountRecordStatus" NOT NULL,
    "lifecycleStage" "CrmAccountLifecycleStage" NOT NULL,
    "partyTypeHint" "CrmAccountTypeHint" NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "leadLegalName" VARCHAR(255),
    "leadCompanyName" VARCHAR(255),
    "leadPersonName" VARCHAR(255),
    "leadDomain" VARCHAR(255),
    "leadEmail" VARCHAR(255),
    "leadPhone" VARCHAR(64),
    "leadWhatsapp" VARCHAR(64),
    "leadCountry" VARCHAR(32),
    "leadIdentifiers" JSONB NOT NULL,
    "ownerAccountId" VARCHAR(128),
    "priority" "CrmPriority" NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdBy" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "archiveReason" "CrmArchiveReason",

    CONSTRAINT "CrmAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmAccountProfileItem" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "crmAccountId" UUID NOT NULL,
    "itemType" "CrmAccountProfileItemType" NOT NULL,
    "normalizedValue" VARCHAR(255) NOT NULL,
    "rawValue" VARCHAR(255) NOT NULL,
    "label" VARCHAR(100),
    "role" VARCHAR(80),
    "status" "CrmAccountProfileItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceRecordId" UUID,
    "promotedTargetType" VARCHAR(80),
    "promotedTargetId" VARCHAR(128),
    "promotedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmAccountProfileItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmContact" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "crmAccountId" UUID NOT NULL,
    "personTenantPartyId" VARCHAR(128),
    "name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255),
    "department" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(64),
    "whatsapp" VARCHAR(64),
    "linkedin" VARCHAR(255),
    "isPrimary" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdBy" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "crmAccountId" UUID NOT NULL,
    "ownerAccountId" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "stage" "CrmOpportunityStage" NOT NULL,
    "status" "CrmOpportunityStatus" NOT NULL,
    "estimatedAmount" DECIMAL(18,2),
    "currency" VARCHAR(3) NOT NULL,
    "expectedCloseDate" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closeReason" VARCHAR(255),
    "closeNote" TEXT,
    "createdBy" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "crmAccountId" UUID NOT NULL,
    "opportunityId" UUID,
    "contactId" UUID,
    "activityType" "CrmActivityType" NOT NULL,
    "direction" "CrmActivityDirection" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdByAccountId" VARCHAR(128),
    "createdByType" "CrmActivityCreatedByType" NOT NULL,
    "externalProvider" VARCHAR(128),
    "externalReference" VARCHAR(255),
    "metadata" JSONB NOT NULL,
    "visibility" "CrmActivityVisibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmSourceRecord" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "crmAccountId" UUID NOT NULL,
    "sourceType" "CrmSourceType" NOT NULL,
    "sourceName" VARCHAR(255),
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "capturedByAccountId" VARCHAR(128),
    "externalReference" VARCHAR(255),
    "rawPayload" JSONB,
    "note" TEXT,
    "isPrimary" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmSourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmAuditEnvelope" (
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

    CONSTRAINT "CrmAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmAccount_tenantId_recordStatus_lifecycleStage_idx" ON "CrmAccount"("tenantId", "recordStatus", "lifecycleStage");

-- CreateIndex
CREATE INDEX "CrmAccount_tenantId_ownerAccountId_idx" ON "CrmAccount"("tenantId", "ownerAccountId");

-- CreateIndex
CREATE INDEX "CrmAccount_tenantId_displayName_idx" ON "CrmAccount"("tenantId", "displayName");

-- CreateIndex
CREATE INDEX "CrmAccount_tenantId_tenantPartyId_idx" ON "CrmAccount"("tenantId", "tenantPartyId");

-- CreateIndex
CREATE INDEX "CrmAccountProfileItem_tenantId_crmAccountId_status_idx" ON "CrmAccountProfileItem"("tenantId", "crmAccountId", "status");

-- CreateIndex
CREATE INDEX "CrmAccountProfileItem_tenantId_itemType_normalizedValue_idx" ON "CrmAccountProfileItem"("tenantId", "itemType", "normalizedValue");

-- CreateIndex
CREATE INDEX "CrmContact_tenantId_crmAccountId_archivedAt_idx" ON "CrmContact"("tenantId", "crmAccountId", "archivedAt");

-- CreateIndex
CREATE INDEX "CrmContact_tenantId_email_idx" ON "CrmContact"("tenantId", "email");

-- CreateIndex
CREATE INDEX "CrmContact_tenantId_phone_idx" ON "CrmContact"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_crmAccountId_status_idx" ON "Opportunity"("tenantId", "crmAccountId", "status");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_ownerAccountId_status_idx" ON "Opportunity"("tenantId", "ownerAccountId", "status");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_stage_status_idx" ON "Opportunity"("tenantId", "stage", "status");

-- CreateIndex
CREATE INDEX "Opportunity_tenantId_expectedCloseDate_idx" ON "Opportunity"("tenantId", "expectedCloseDate");

-- CreateIndex
CREATE INDEX "CrmActivity_tenantId_crmAccountId_occurredAt_idx" ON "CrmActivity"("tenantId", "crmAccountId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmActivity_tenantId_opportunityId_occurredAt_idx" ON "CrmActivity"("tenantId", "opportunityId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmActivity_tenantId_contactId_occurredAt_idx" ON "CrmActivity"("tenantId", "contactId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmActivity_tenantId_activityType_occurredAt_idx" ON "CrmActivity"("tenantId", "activityType", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmSourceRecord_tenantId_crmAccountId_capturedAt_idx" ON "CrmSourceRecord"("tenantId", "crmAccountId", "capturedAt");

-- CreateIndex
CREATE INDEX "CrmSourceRecord_tenantId_sourceType_capturedAt_idx" ON "CrmSourceRecord"("tenantId", "sourceType", "capturedAt");

-- CreateIndex
CREATE INDEX "CrmSourceRecord_tenantId_externalReference_idx" ON "CrmSourceRecord"("tenantId", "externalReference");

-- CreateIndex
CREATE INDEX "CrmAuditEnvelope_service_module_eventType_occurredAt_idx" ON "CrmAuditEnvelope"("service", "module", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmAuditEnvelope_tenantId_occurredAt_idx" ON "CrmAuditEnvelope"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "CrmAuditEnvelope_resourceType_resourceId_occurredAt_idx" ON "CrmAuditEnvelope"("resourceType", "resourceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "CrmAccountProfileItem" ADD CONSTRAINT "CrmAccountProfileItem_crmAccountId_fkey" FOREIGN KEY ("crmAccountId") REFERENCES "CrmAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_crmAccountId_fkey" FOREIGN KEY ("crmAccountId") REFERENCES "CrmAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_crmAccountId_fkey" FOREIGN KEY ("crmAccountId") REFERENCES "CrmAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_crmAccountId_fkey" FOREIGN KEY ("crmAccountId") REFERENCES "CrmAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmSourceRecord" ADD CONSTRAINT "CrmSourceRecord_crmAccountId_fkey" FOREIGN KEY ("crmAccountId") REFERENCES "CrmAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
