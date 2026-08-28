-- CreateEnum
CREATE TYPE "CollaborationTaskVisibility" AS ENUM ('PRIVATE', 'ASSIGNMENT_PARTICIPANTS');

-- CreateEnum
CREATE TYPE "CollaborationTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CollaborationTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CollaborationAnnotationVisibility" AS ENUM ('PRIVATE', 'OBJECT_VISIBLE');

-- CreateTable
CREATE TABLE "CollaborationTask" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(4000),
    "createdByAccountId" VARCHAR(100) NOT NULL,
    "assigneeAccountId" VARCHAR(100) NOT NULL,
    "visibility" "CollaborationTaskVisibility" NOT NULL,
    "status" "CollaborationTaskStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CollaborationTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "dueAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedByAccountId" VARCHAR(100),
    "completionNote" VARCHAR(4000),
    "cancelledAt" TIMESTAMP(3),
    "cancelledByAccountId" VARCHAR(100),
    "cancelReason" VARCHAR(1000),
    "archivedAt" TIMESTAMP(3),
    "archivedByAccountId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationTaskAuditEnvelope" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "taskId" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "result" VARCHAR(40) NOT NULL,
    "operatorAccountId" VARCHAR(100) NOT NULL,
    "createdByAccountId" VARCHAR(100) NOT NULL,
    "assigneeAccountId" VARCHAR(100) NOT NULL,
    "traceId" VARCHAR(100),
    "auditId" VARCHAR(100),
    "reasonSnapshot" VARCHAR(1000),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,

    CONSTRAINT "CollaborationTaskAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationTaskEventEnvelope" (
    "id" UUID NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "taskId" UUID NOT NULL,
    "actorAccountId" VARCHAR(100) NOT NULL,
    "createdByAccountId" VARCHAR(100) NOT NULL,
    "assigneeAccountId" VARCHAR(100) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "previousStatus" VARCHAR(40),
    "priority" VARCHAR(40) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "titleSnapshot" VARCHAR(255) NOT NULL,
    "traceId" VARCHAR(100),
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationTaskEventEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationAnnotation" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "objectOwnerService" VARCHAR(80) NOT NULL,
    "objectType" VARCHAR(80) NOT NULL,
    "objectId" VARCHAR(100) NOT NULL,
    "objectDisplayTitle" VARCHAR(255),
    "objectDisplaySubtitle" VARCHAR(255),
    "objectDisplayStatus" VARCHAR(80),
    "authorAccountId" VARCHAR(100) NOT NULL,
    "authorDisplayNameSnapshot" VARCHAR(255) NOT NULL,
    "bodyText" VARCHAR(4000) NOT NULL,
    "visibility" "CollaborationAnnotationVisibility" NOT NULL DEFAULT 'OBJECT_VISIBLE',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedByAccountId" VARCHAR(100),
    "deleteReason" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationAnnotationAuditEnvelope" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(100) NOT NULL,
    "annotationId" UUID NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "result" VARCHAR(40) NOT NULL,
    "operatorAccountId" VARCHAR(100) NOT NULL,
    "authorAccountId" VARCHAR(100) NOT NULL,
    "objectOwnerService" VARCHAR(80) NOT NULL,
    "objectType" VARCHAR(80) NOT NULL,
    "objectId" VARCHAR(100) NOT NULL,
    "traceId" VARCHAR(100),
    "auditId" VARCHAR(100),
    "reasonSnapshot" VARCHAR(1000),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,

    CONSTRAINT "CollaborationAnnotationAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollaborationTask_tenantId_assigneeAccountId_status_idx" ON "CollaborationTask"("tenantId", "assigneeAccountId", "status");

-- CreateIndex
CREATE INDEX "CollaborationTask_tenantId_createdByAccountId_status_idx" ON "CollaborationTask"("tenantId", "createdByAccountId", "status");

-- CreateIndex
CREATE INDEX "CollaborationTask_tenantId_dueAt_idx" ON "CollaborationTask"("tenantId", "dueAt");

-- CreateIndex
CREATE INDEX "CollaborationTask_tenantId_archivedAt_idx" ON "CollaborationTask"("tenantId", "archivedAt");

-- CreateIndex
CREATE INDEX "CollaborationTaskAuditEnvelope_tenantId_taskId_idx" ON "CollaborationTaskAuditEnvelope"("tenantId", "taskId");

-- CreateIndex
CREATE INDEX "CollaborationTaskAuditEnvelope_tenantId_occurredAt_idx" ON "CollaborationTaskAuditEnvelope"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "CollaborationTaskEventEnvelope_tenantId_taskId_idx" ON "CollaborationTaskEventEnvelope"("tenantId", "taskId");

-- CreateIndex
CREATE INDEX "CollaborationTaskEventEnvelope_tenantId_eventType_occurredA_idx" ON "CollaborationTaskEventEnvelope"("tenantId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "CollaborationTaskEventEnvelope_publishedAt_idx" ON "CollaborationTaskEventEnvelope"("publishedAt");

-- CreateIndex
CREATE INDEX "collab_annotation_object_visible_idx" ON "CollaborationAnnotation"("tenantId", "objectOwnerService", "objectType", "objectId", "deletedAt");

-- CreateIndex
CREATE INDEX "collab_annotation_object_sort_idx" ON "CollaborationAnnotation"("tenantId", "objectOwnerService", "objectType", "objectId", "pinned", "createdAt");

-- CreateIndex
CREATE INDEX "CollaborationAnnotation_tenantId_authorAccountId_createdAt_idx" ON "CollaborationAnnotation"("tenantId", "authorAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "CollaborationAnnotationAuditEnvelope_tenantId_annotationId_idx" ON "CollaborationAnnotationAuditEnvelope"("tenantId", "annotationId");

-- CreateIndex
CREATE INDEX "CollaborationAnnotationAuditEnvelope_tenantId_objectOwnerSe_idx" ON "CollaborationAnnotationAuditEnvelope"("tenantId", "objectOwnerService", "objectType", "objectId");

-- CreateIndex
CREATE INDEX "CollaborationAnnotationAuditEnvelope_tenantId_occurredAt_idx" ON "CollaborationAnnotationAuditEnvelope"("tenantId", "occurredAt");
