-- CreateEnum
CREATE TYPE "ShortLinkTargetKind" AS ENUM ('INTERNAL_REF', 'EXTERNAL_URL');

-- CreateEnum
CREATE TYPE "ShortLinkStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VisitResultStatus" AS ENUM ('REDIRECTED', 'DISABLED', 'EXPIRED', 'ARCHIVED', 'INVALID_TARGET');

-- CreateEnum
CREATE TYPE "BusinessCardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ShortLink" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "shortCode" VARCHAR(32) NOT NULL,
    "targetKind" "ShortLinkTargetKind" NOT NULL,
    "targetType" VARCHAR(100),
    "targetResourceId" VARCHAR(100),
    "targetUrl" VARCHAR(2048),
    "entryPurpose" VARCHAR(100) NOT NULL,
    "sourcePlacement" VARCHAR(100) NOT NULL,
    "campaignRef" VARCHAR(200),
    "status" "ShortLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdBy" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" VARCHAR(100) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitEvent" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "shortLinkId" UUID NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" VARCHAR(512) NOT NULL,
    "ipAddress" VARCHAR(128) NOT NULL,
    "detectedChannel" VARCHAR(32) NOT NULL,
    "deviceType" VARCHAR(32) NOT NULL,
    "locale" VARCHAR(64) NOT NULL,
    "referrer" VARCHAR(512) NOT NULL,
    "resultStatus" "VisitResultStatus" NOT NULL,

    CONSTRAINT "VisitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLinkAuditLog" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "shortLinkId" UUID NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" VARCHAR(500),
    "operatorAccountId" VARCHAR(100) NOT NULL,
    "operatorOrgId" VARCHAR(100),
    "traceId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLinkAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCard" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "employeeId" VARCHAR(100) NOT NULL,
    "status" "BusinessCardStatus" NOT NULL DEFAULT 'DRAFT',
    "templateKey" VARCHAR(100) NOT NULL,
    "publicEntryRefJson" JSONB,
    "contactActionsJson" JSONB NOT NULL,
    "visibilityConfigJson" JSONB NOT NULL,
    "createdBy" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" VARCHAR(100) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCardAuditLog" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "businessCardId" UUID NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "operatorAccountId" VARCHAR(100) NOT NULL,
    "operatorOrgId" VARCHAR(100),
    "traceId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessCardAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_shortCode_key" ON "ShortLink"("shortCode");

-- CreateIndex
CREATE INDEX "ShortLink_tenantId_idx" ON "ShortLink"("tenantId");

-- CreateIndex
CREATE INDEX "ShortLink_tenantId_targetType_targetResourceId_idx" ON "ShortLink"("tenantId", "targetType", "targetResourceId");

-- CreateIndex
CREATE INDEX "ShortLink_tenantId_status_idx" ON "ShortLink"("tenantId", "status");

-- CreateIndex
CREATE INDEX "VisitEvent_tenantId_shortLinkId_visitedAt_idx" ON "VisitEvent"("tenantId", "shortLinkId", "visitedAt");

-- CreateIndex
CREATE INDEX "VisitEvent_tenantId_resultStatus_idx" ON "VisitEvent"("tenantId", "resultStatus");

-- CreateIndex
CREATE INDEX "ShortLinkAuditLog_tenantId_shortLinkId_createdAt_idx" ON "ShortLinkAuditLog"("tenantId", "shortLinkId", "createdAt");

-- CreateIndex
CREATE INDEX "ShortLinkAuditLog_tenantId_action_idx" ON "ShortLinkAuditLog"("tenantId", "action");

-- CreateIndex
CREATE INDEX "BusinessCard_tenantId_idx" ON "BusinessCard"("tenantId");

-- CreateIndex
CREATE INDEX "BusinessCard_tenantId_status_idx" ON "BusinessCard"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCard_tenantId_employeeId_key" ON "BusinessCard"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "BusinessCardAuditLog_tenantId_businessCardId_createdAt_idx" ON "BusinessCardAuditLog"("tenantId", "businessCardId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessCardAuditLog_tenantId_action_idx" ON "BusinessCardAuditLog"("tenantId", "action");

-- AddForeignKey
ALTER TABLE "VisitEvent" ADD CONSTRAINT "VisitEvent_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLinkAuditLog" ADD CONSTRAINT "ShortLinkAuditLog_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessCardAuditLog" ADD CONSTRAINT "BusinessCardAuditLog_businessCardId_fkey" FOREIGN KEY ("businessCardId") REFERENCES "BusinessCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
