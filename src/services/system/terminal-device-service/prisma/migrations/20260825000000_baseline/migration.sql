-- CreateEnum
CREATE TYPE "TerminalDeviceType" AS ENUM ('PDA', 'KIOSK', 'INDUSTRIAL_TABLET', 'SHARED_MOBILE_TERMINAL');

-- CreateEnum
CREATE TYPE "TerminalDeviceStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'DISABLED', 'LOST', 'MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ISSUED', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('ONLINE', 'STALE', 'OFFLINE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NetworkStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NetworkType" AS ENUM ('WIFI', 'CELLULAR', 'ETHERNET', 'NONE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AppState" AS ENUM ('FOREGROUND', 'BACKGROUND', 'CLOSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DeviceCredentialState" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateTable
CREATE TABLE "TerminalDevice" (
    "terminalDeviceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminalDeviceType" "TerminalDeviceType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "TerminalDeviceStatus" NOT NULL,
    "statusReason" TEXT,
    "enrollmentId" TEXT,
    "manufacturerSerial" TEXT,
    "androidId" TEXT,
    "appInstallationId" TEXT,
    "deviceCredentialHash" TEXT,
    "deviceCredentialPreviousHash" TEXT,
    "deviceCredentialVersion" INTEGER NOT NULL DEFAULT 1,
    "deviceCredentialPreviousVersion" INTEGER,
    "deviceCredentialExpiresAt" TIMESTAMP(3),
    "deviceCredentialPreviousExpiresAt" TIMESTAMP(3),
    "deviceCredentialState" "DeviceCredentialState" NOT NULL DEFAULT 'ACTIVE',
    "manufacturer" TEXT,
    "model" TEXT,
    "androidVersion" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "TerminalDevice_pkey" PRIMARY KEY ("terminalDeviceId")
);

-- CreateTable
CREATE TABLE "TerminalDeviceEnrollment" (
    "enrollmentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminalDeviceType" "TerminalDeviceType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL,
    "expectedManufacturerSerial" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByTerminalDeviceId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "TerminalDeviceEnrollment_pkey" PRIMARY KEY ("enrollmentId")
);

-- CreateTable
CREATE TABLE "TerminalDeviceRuntimeSnapshot" (
    "terminalDeviceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "presenceStatus" "PresenceStatus" NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
    "lastClientTime" TIMESTAMP(3),
    "appVersion" TEXT,
    "androidVersion" TEXT,
    "webViewVersion" TEXT,
    "networkStatus" "NetworkStatus" NOT NULL,
    "networkType" "NetworkType" NOT NULL,
    "batteryLevel" INTEGER,
    "appState" "AppState" NOT NULL,
    "lastReportedAccountId" TEXT,
    "lastReportedSessionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminalDeviceRuntimeSnapshot_pkey" PRIMARY KEY ("terminalDeviceId")
);

-- CreateTable
CREATE TABLE "TerminalDeviceHeartbeatRecord" (
    "heartbeatId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminalDeviceId" TEXT NOT NULL,
    "presenceStatus" "PresenceStatus" NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "clientTime" TIMESTAMP(3),
    "appVersion" TEXT,
    "androidVersion" TEXT,
    "webViewVersion" TEXT,
    "networkStatus" "NetworkStatus" NOT NULL,
    "networkType" "NetworkType" NOT NULL,
    "batteryLevel" INTEGER,
    "appState" "AppState" NOT NULL,
    "reportedAccountId" TEXT,
    "reportedSessionId" TEXT,
    "traceId" TEXT,

    CONSTRAINT "TerminalDeviceHeartbeatRecord_pkey" PRIMARY KEY ("heartbeatId")
);

-- CreateTable
CREATE TABLE "TerminalDeviceDiagnosticLog" (
    "diagnosticLogId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminalDeviceId" TEXT NOT NULL,
    "accountId" TEXT,
    "sessionId" TEXT,
    "clientTime" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "level" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "traceId" TEXT,
    "requestId" TEXT,
    "errorCode" TEXT,
    "diagnosticMode" BOOLEAN NOT NULL,
    "detailsJson" JSONB NOT NULL,

    CONSTRAINT "TerminalDeviceDiagnosticLog_pkey" PRIMARY KEY ("diagnosticLogId")
);

-- CreateTable
CREATE TABLE "TerminalDeviceVersionPolicy" (
    "versionPolicyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "terminalDeviceType" "TerminalDeviceType" NOT NULL,
    "minSupportedAppVersion" TEXT NOT NULL,
    "latestAppVersion" TEXT NOT NULL,
    "upgradeRequired" BOOLEAN NOT NULL,
    "upgradeRecommended" BOOLEAN NOT NULL,
    "apkDownloadUrl" TEXT,
    "releaseNotesUrl" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerminalDeviceVersionPolicy_pkey" PRIMARY KEY ("versionPolicyId")
);

-- CreateTable
CREATE TABLE "TerminalDeviceAuditEvent" (
    "auditEventId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "operatorAccountId" TEXT NOT NULL,
    "operatorOrgId" TEXT,
    "action" TEXT NOT NULL,
    "targetTerminalDeviceId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "reason" TEXT,
    "traceId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerminalDeviceAuditEvent_pkey" PRIMARY KEY ("auditEventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TerminalDevice_enrollmentId_key" ON "TerminalDevice"("enrollmentId");

-- CreateIndex
CREATE INDEX "TerminalDevice_tenantId_terminalDeviceType_status_idx" ON "TerminalDevice"("tenantId", "terminalDeviceType", "status");

-- CreateIndex
CREATE INDEX "TerminalDevice_tenantId_manufacturerSerial_idx" ON "TerminalDevice"("tenantId", "manufacturerSerial");

-- CreateIndex
CREATE UNIQUE INDEX "TerminalDeviceEnrollment_codeHash_key" ON "TerminalDeviceEnrollment"("codeHash");

-- CreateIndex
CREATE INDEX "TerminalDeviceEnrollment_tenantId_terminalDeviceType_status_idx" ON "TerminalDeviceEnrollment"("tenantId", "terminalDeviceType", "status");

-- CreateIndex
CREATE INDEX "TerminalDeviceRuntimeSnapshot_tenantId_presenceStatus_idx" ON "TerminalDeviceRuntimeSnapshot"("tenantId", "presenceStatus");

-- CreateIndex
CREATE INDEX "TerminalDeviceHeartbeatRecord_tenantId_terminalDeviceId_rec_idx" ON "TerminalDeviceHeartbeatRecord"("tenantId", "terminalDeviceId", "receivedAt");

-- CreateIndex
CREATE INDEX "TerminalDeviceDiagnosticLog_tenantId_terminalDeviceId_recei_idx" ON "TerminalDeviceDiagnosticLog"("tenantId", "terminalDeviceId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TerminalDeviceVersionPolicy_tenantId_terminalDeviceType_key" ON "TerminalDeviceVersionPolicy"("tenantId", "terminalDeviceType");

-- CreateIndex
CREATE INDEX "TerminalDeviceAuditEvent_tenantId_targetTerminalDeviceId_oc_idx" ON "TerminalDeviceAuditEvent"("tenantId", "targetTerminalDeviceId", "occurredAt");

-- CreateIndex
CREATE INDEX "TerminalDeviceAuditEvent_tenantId_action_occurredAt_idx" ON "TerminalDeviceAuditEvent"("tenantId", "action", "occurredAt");

-- AddForeignKey
ALTER TABLE "TerminalDevice" ADD CONSTRAINT "TerminalDevice_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TerminalDeviceEnrollment"("enrollmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminalDeviceRuntimeSnapshot" ADD CONSTRAINT "TerminalDeviceRuntimeSnapshot_terminalDeviceId_fkey" FOREIGN KEY ("terminalDeviceId") REFERENCES "TerminalDevice"("terminalDeviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminalDeviceHeartbeatRecord" ADD CONSTRAINT "TerminalDeviceHeartbeatRecord_terminalDeviceId_fkey" FOREIGN KEY ("terminalDeviceId") REFERENCES "TerminalDevice"("terminalDeviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminalDeviceDiagnosticLog" ADD CONSTRAINT "TerminalDeviceDiagnosticLog_terminalDeviceId_fkey" FOREIGN KEY ("terminalDeviceId") REFERENCES "TerminalDevice"("terminalDeviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerminalDeviceAuditEvent" ADD CONSTRAINT "TerminalDeviceAuditEvent_targetTerminalDeviceId_fkey" FOREIGN KEY ("targetTerminalDeviceId") REFERENCES "TerminalDevice"("terminalDeviceId") ON DELETE SET NULL ON UPDATE CASCADE;
