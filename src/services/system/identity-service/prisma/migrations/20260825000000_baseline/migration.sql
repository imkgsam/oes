-- CreateEnum
CREATE TYPE "UserAccountScopeLevel" AS ENUM ('SYSTEM', 'TENANT');

-- CreateEnum
CREATE TYPE "AccountContactAssetType" AS ENUM ('WORK_EMAIL', 'WORK_PHONE', 'WECHAT', 'WHATSAPP', 'EXTERNAL_COMMUNICATION_ACCOUNT', 'OTHER_SOCIAL');

-- CreateEnum
CREATE TYPE "AccountContactAssetOwnership" AS ENUM ('COMPANY_CONTROLLED', 'EMPLOYEE_OWNED');

-- CreateEnum
CREATE TYPE "AccountContactAssetStatus" AS ENUM ('ACTIVE', 'PENDING_HANDOVER', 'DISABLED', 'RELEASED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MachinePrincipalScopeLevel" AS ENUM ('SYSTEM', 'TENANT');

-- CreateEnum
CREATE TYPE "MachinePrincipalType" AS ENUM ('INTERNAL_SERVICE', 'EXTERNAL_INTEGRATION', 'AI_AGENT', 'AUTOMATION_BOT');

-- CreateEnum
CREATE TYPE "MachinePrincipalStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "APIKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuditEventResult" AS ENUM ('SUCCEEDED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditOperatorType" AS ENUM ('HUMAN', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantPartyId" UUID,
    "userId" TEXT NOT NULL,
    "scopeLevel" "UserAccountScopeLevel" NOT NULL DEFAULT 'TENANT',
    "contextKey" TEXT NOT NULL,
    "displayName" TEXT,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "avatarAssetId" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccountEmployeeBinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccountEmployeeBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountContactAsset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeId" TEXT,
    "type" "AccountContactAssetType" NOT NULL,
    "provider" TEXT,
    "value" TEXT NOT NULL,
    "displayName" TEXT,
    "ownership" "AccountContactAssetOwnership" NOT NULL DEFAULT 'COMPANY_CONTROLLED',
    "usage" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "AccountContactAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "assignedBy" TEXT NOT NULL,
    "revokedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountContactAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "scopeLevel" "MachinePrincipalScopeLevel" NOT NULL,
    "type" "MachinePrincipalType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "MachinePrincipalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "disabledAt" TIMESTAMP(3),
    "disabledBy" TEXT,

    CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineWorkloadBinding" (
    "id" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "workloadSpiffeId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" BIGINT NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "disabledAt" TIMESTAMP(3),
    "disabledBy" TEXT,
    "disableReasonCode" TEXT,
    "enrollmentAuditRef" TEXT NOT NULL,
    "disableAuditRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineWorkloadBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "keyCode" TEXT NOT NULL,
    "hashedValue" TEXT NOT NULL,
    "status" "APIKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "eventId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" "AuditEventResult" NOT NULL,
    "operatorId" TEXT,
    "operatorType" "AuditOperatorType" NOT NULL,
    "tenantId" TEXT,
    "orgId" TEXT,
    "traceId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "UserAccount_scopeLevel_idx" ON "UserAccount"("scopeLevel");

-- CreateIndex
CREATE INDEX "UserAccount_tenantId_idx" ON "UserAccount"("tenantId");

-- CreateIndex
CREATE INDEX "UserAccount_tenantId_tenantPartyId_idx" ON "UserAccount"("tenantId", "tenantPartyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_userId_scopeLevel_contextKey_key" ON "UserAccount"("userId", "scopeLevel", "contextKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccountEmployeeBinding_accountId_key" ON "UserAccountEmployeeBinding"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccountEmployeeBinding_employeeId_key" ON "UserAccountEmployeeBinding"("employeeId");

-- CreateIndex
CREATE INDEX "UserAccountEmployeeBinding_tenantId_idx" ON "UserAccountEmployeeBinding"("tenantId");

-- CreateIndex
CREATE INDEX "AccountContactAsset_accountId_type_status_idx" ON "AccountContactAsset"("accountId", "type", "status");

-- CreateIndex
CREATE INDEX "AccountContactAsset_tenantId_type_value_idx" ON "AccountContactAsset"("tenantId", "type", "value");

-- CreateIndex
CREATE INDEX "AccountContactAsset_accountId_type_isPrimary_idx" ON "AccountContactAsset"("accountId", "type", "isPrimary");

-- CreateIndex
CREATE INDEX "AccountContactAsset_tenantId_accountId_idx" ON "AccountContactAsset"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "AccountContactAsset_employeeId_idx" ON "AccountContactAsset"("employeeId");

-- CreateIndex
CREATE INDEX "ServiceAccount_tenantId_idx" ON "ServiceAccount"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceAccount_scopeLevel_idx" ON "ServiceAccount"("scopeLevel");

-- CreateIndex
CREATE INDEX "ServiceAccount_type_idx" ON "ServiceAccount"("type");

-- CreateIndex
CREATE INDEX "ServiceAccount_status_idx" ON "ServiceAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MachineWorkloadBinding_idempotencyKey_key" ON "MachineWorkloadBinding"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "MachineWorkloadBinding_enrollmentAuditRef_key" ON "MachineWorkloadBinding"("enrollmentAuditRef");

-- CreateIndex
CREATE UNIQUE INDEX "MachineWorkloadBinding_disableAuditRef_key" ON "MachineWorkloadBinding"("disableAuditRef");

-- CreateIndex
CREATE INDEX "MachineWorkloadBinding_serviceAccountId_status_idx" ON "MachineWorkloadBinding"("serviceAccountId", "status");

-- CreateIndex
CREATE INDEX "MachineWorkloadBinding_workloadSpiffeId_status_idx" ON "MachineWorkloadBinding"("workloadSpiffeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_keyCode_key" ON "APIKey"("keyCode");

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_hashedValue_key" ON "APIKey"("hashedValue");

-- CreateIndex
CREATE INDEX "APIKey_serviceAccountId_status_idx" ON "APIKey"("serviceAccountId", "status");

-- CreateIndex
CREATE INDEX "APIKey_expiresAt_idx" ON "APIKey"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_service_occurredAt_idx" ON "AuditEvent"("service", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_module_occurredAt_idx" ON "AuditEvent"("module", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_occurredAt_idx" ON "AuditEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_occurredAt_idx" ON "AuditEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAccountEmployeeBinding" ADD CONSTRAINT "UserAccountEmployeeBinding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountContactAsset" ADD CONSTRAINT "AccountContactAsset_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineWorkloadBinding" ADD CONSTRAINT "MachineWorkloadBinding_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineWorkloadBinding" ADD CONSTRAINT "MachineWorkloadBinding_enrollmentAuditRef_fkey" FOREIGN KEY ("enrollmentAuditRef") REFERENCES "AuditEvent"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineWorkloadBinding" ADD CONSTRAINT "MachineWorkloadBinding_disableAuditRef_fkey" FOREIGN KEY ("disableAuditRef") REFERENCES "AuditEvent"("eventId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prisma cannot express this active-binding invariant; retain the canonical partial uniqueness constraint.
CREATE UNIQUE INDEX "MachineWorkloadBinding_one_active_per_principal_spiffe"
ON "MachineWorkloadBinding"("serviceAccountId", "workloadSpiffeId")
WHERE "status" = 'ACTIVE';
