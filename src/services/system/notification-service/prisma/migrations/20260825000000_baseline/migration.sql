-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationInboxChannel" AS ENUM ('IN_APP');

-- CreateEnum
CREATE TYPE "NotificationInboxType" AS ENUM ('COLLABORATION_TASK_ASSIGNED', 'COLLABORATION_TASK_COMPLETED', 'COLLABORATION_TASK_CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationInboxEventResult" AS ENUM ('APPLIED', 'NO_RECIPIENT');

-- CreateEnum
CREATE TYPE "NotificationAdvisoryRecoveryStatus" AS ENUM ('UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED', 'EXPIRED_UNRESOLVED');

-- CreateEnum
CREATE TYPE "NotificationSourceTermination" AS ENUM ('AUTHORITY_UNAVAILABLE', 'NOT_PERFORMED');

-- CreateEnum
CREATE TYPE "NotificationAdvisoryAuditAction" AS ENUM ('ADVISORY_RECORDED', 'OWNER_ALERTED', 'PRE_EXPIRY_ESCALATED', 'EXPIRED_UNRESOLVED');

-- CreateEnum
CREATE TYPE "NotificationReplayRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationReplayAuditAction" AS ENUM ('REPLAY_STARTED', 'REPLAY_RESUMED', 'PULL_EMPTY', 'PULL_SKIPPED', 'PULL_ACKED', 'PULL_RETRY_SCHEDULED', 'PULL_REQUIRES_DLQ', 'REPLAY_COMPLETED', 'REPLAY_FAILED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('AUTH_OTP', 'AUTH_SECURITY_ALERT', 'WORKFLOW_REMINDER', 'BUSINESS_STATUS');

-- CreateEnum
CREATE TYPE "NotificationDispatchStatus" AS ENUM ('ACCEPTED', 'QUEUED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationProviderOutboxStatus" AS ENUM ('PENDING', 'RETRYING', 'DELIVERED', 'TERMINAL', 'EXPIRED');

-- CreateTable
CREATE TABLE "NotificationDispatch" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "sourceService" TEXT NOT NULL,
    "machinePrincipal" TEXT NOT NULL,
    "tenantId" TEXT,
    "orgId" TEXT,
    "traceId" TEXT,
    "requestId" TEXT,
    "recipientAddress" TEXT NOT NULL,
    "recipientDisplayName" TEXT,
    "templateKey" TEXT NOT NULL,
    "variablePayload" JSONB NOT NULL,
    "commandDigest" TEXT NOT NULL,
    "protectedPayload" TEXT NOT NULL,
    "protectedPayloadExpiresAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "NotificationDispatchStatus" NOT NULL,
    "rejectionReason" TEXT,
    "subjectOverride" TEXT,
    "providerRoute" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDispatchAudit" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "sourceService" TEXT NOT NULL,
    "machinePrincipal" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "idempotencyRef" TEXT NOT NULL,
    "recipientFingerprint" TEXT NOT NULL,
    "traceId" TEXT,
    "requestId" TEXT,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDispatchAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationProviderOutbox" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "payloadExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" "NotificationProviderOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminalReason" TEXT,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationProviderOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationInboxEvent" (
    "id" TEXT NOT NULL,
    "consumerName" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orgId" TEXT,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "canonicalBodyDigest" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "result" "NotificationInboxEventResult" NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationInboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationInboxItem" (
    "id" TEXT NOT NULL,
    "inboxEventId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orgId" TEXT,
    "recipientAccountId" TEXT NOT NULL,
    "notificationType" "NotificationInboxType" NOT NULL,
    "channel" "NotificationInboxChannel" NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "sourceObjectRef" TEXT NOT NULL,
    "deepLinkRef" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "bodySnapshot" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationInboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEventAdvisoryRecovery" (
    "id" TEXT NOT NULL,
    "consumerName" TEXT NOT NULL,
    "sourceStream" TEXT NOT NULL,
    "sourceStreamSequence" BIGINT NOT NULL,
    "sourceConsumerSequence" BIGINT NOT NULL,
    "deliveryAttempts" INTEGER NOT NULL,
    "sourceExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" "NotificationAdvisoryRecoveryStatus" NOT NULL,
    "originalSourceTermination" "NotificationSourceTermination" NOT NULL,
    "ownerAlertedAt" TIMESTAMP(3),
    "preExpiryEscalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEventAdvisoryRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEventAdvisoryAudit" (
    "id" TEXT NOT NULL,
    "recoveryId" TEXT NOT NULL,
    "action" "NotificationAdvisoryAuditAction" NOT NULL,
    "evidence" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEventAdvisoryAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEventReplayRun" (
    "id" TEXT NOT NULL,
    "replayRunId" TEXT NOT NULL,
    "consumerName" TEXT NOT NULL,
    "tenantScope" JSONB NOT NULL,
    "eventFilter" JSONB NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedByConsumerOwner" TEXT NOT NULL,
    "approvedByPlatformOperator" TEXT NOT NULL,
    "platformApprovalRef" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "NotificationReplayRunStatus" NOT NULL,
    "originalSourceTermination" "NotificationSourceTermination" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationEventReplayRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEventReplayAudit" (
    "id" TEXT NOT NULL,
    "replayRunId" TEXT NOT NULL,
    "action" "NotificationReplayAuditAction" NOT NULL,
    "evidence" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEventReplayAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationDispatch_tenantId_channel_createdAt_idx" ON "NotificationDispatch"("tenantId", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDispatch_sourceService_createdAt_idx" ON "NotificationDispatch"("sourceService", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDispatch_sourceService_machinePrincipal_channel_key" ON "NotificationDispatch"("sourceService", "machinePrincipal", "channel", "idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationDispatchAudit_dispatchId_createdAt_idx" ON "NotificationDispatchAudit"("dispatchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationProviderOutbox_dispatchId_key" ON "NotificationProviderOutbox"("dispatchId");

-- CreateIndex
CREATE INDEX "NotificationProviderOutbox_status_nextAttemptAt_idx" ON "NotificationProviderOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "NotificationInboxEvent_tenantId_eventId_idx" ON "NotificationInboxEvent"("tenantId", "eventId");

-- CreateIndex
CREATE INDEX "NotificationInboxEvent_tenantId_processedAt_idx" ON "NotificationInboxEvent"("tenantId", "processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationInboxEvent_consumerName_eventId_key" ON "NotificationInboxEvent"("consumerName", "eventId");

-- CreateIndex
CREATE INDEX "NotificationInboxItem_tenantId_recipientAccountId_createdAt_idx" ON "NotificationInboxItem"("tenantId", "recipientAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationInboxItem_tenantId_sourceEventId_idx" ON "NotificationInboxItem"("tenantId", "sourceEventId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationInboxItem_inboxEventId_recipientAccountId_key" ON "NotificationInboxItem"("inboxEventId", "recipientAccountId");

-- CreateIndex
CREATE INDEX "NotificationEventAdvisoryRecovery_status_sourceExpiresAt_idx" ON "NotificationEventAdvisoryRecovery"("status", "sourceExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEventAdvisoryRecovery_consumerName_sourceStream_key" ON "NotificationEventAdvisoryRecovery"("consumerName", "sourceStream", "sourceStreamSequence");

-- CreateIndex
CREATE INDEX "NotificationEventAdvisoryAudit_recoveryId_occurredAt_idx" ON "NotificationEventAdvisoryAudit"("recoveryId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEventReplayRun_replayRunId_key" ON "NotificationEventReplayRun"("replayRunId");

-- CreateIndex
CREATE INDEX "NotificationEventReplayRun_consumerName_status_startedAt_idx" ON "NotificationEventReplayRun"("consumerName", "status", "startedAt");

-- CreateIndex
CREATE INDEX "NotificationEventReplayAudit_replayRunId_occurredAt_idx" ON "NotificationEventReplayAudit"("replayRunId", "occurredAt");

-- AddForeignKey
ALTER TABLE "NotificationDispatchAudit" ADD CONSTRAINT "NotificationDispatchAudit_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "NotificationDispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationProviderOutbox" ADD CONSTRAINT "NotificationProviderOutbox_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "NotificationDispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationInboxItem" ADD CONSTRAINT "NotificationInboxItem_inboxEventId_fkey" FOREIGN KEY ("inboxEventId") REFERENCES "NotificationInboxEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEventAdvisoryAudit" ADD CONSTRAINT "NotificationEventAdvisoryAudit_recoveryId_fkey" FOREIGN KEY ("recoveryId") REFERENCES "NotificationEventAdvisoryRecovery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEventReplayAudit" ADD CONSTRAINT "NotificationEventReplayAudit_replayRunId_fkey" FOREIGN KEY ("replayRunId") REFERENCES "NotificationEventReplayRun"("replayRunId") ON DELETE RESTRICT ON UPDATE CASCADE;
