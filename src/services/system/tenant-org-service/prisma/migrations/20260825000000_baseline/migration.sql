-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrgUnitStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrgUnitType" AS ENUM ('ROOT', 'DEPARTMENT', 'TEAM', 'BRANCH', 'OTHER');

-- CreateEnum
CREATE TYPE "TenantOnboardingRunStatus" AS ENUM ('PENDING', 'RUNNING', 'FAILED_RETRYABLE', 'FAILED_NEEDS_MANUAL_REVIEW', 'SUCCEEDED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "employeeCodePrefix" VARCHAR(3) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "websiteUrl" VARCHAR(2048),
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "rootOrgId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUnit" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "parentOrgId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "type" "OrgUnitType" NOT NULL,
    "status" "OrgUnitStatus" NOT NULL DEFAULT 'ACTIVE',
    "path" VARCHAR(2048) NOT NULL,
    "depth" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "organizationTenantPartyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantOnboardingRun" (
    "id" UUID NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "status" "TenantOnboardingRunStatus" NOT NULL DEFAULT 'PENDING',
    "requestPayload" JSONB NOT NULL,
    "externalRefs" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "failure" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantOnboardingRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_employeeCodePrefix_key" ON "Tenant"("employeeCodePrefix");

-- CreateIndex
CREATE INDEX "OrgUnit_tenantId_idx" ON "OrgUnit"("tenantId");

-- CreateIndex
CREATE INDEX "OrgUnit_parentOrgId_idx" ON "OrgUnit"("parentOrgId");

-- CreateIndex
CREATE INDEX "OrgUnit_path_idx" ON "OrgUnit"("path");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUnit_tenantId_parentOrgId_name_key" ON "OrgUnit"("tenantId", "parentOrgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOnboardingRun_idempotencyKey_key" ON "TenantOnboardingRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TenantOnboardingRun_status_idx" ON "TenantOnboardingRun"("status");

-- CreateIndex
CREATE INDEX "TenantOnboardingRun_createdAt_idx" ON "TenantOnboardingRun"("createdAt");

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_parentOrgId_fkey" FOREIGN KEY ("parentOrgId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
