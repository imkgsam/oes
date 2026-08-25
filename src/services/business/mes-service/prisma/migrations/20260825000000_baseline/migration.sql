-- CreateTable
CREATE TABLE "ProductionSpec" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "orgScope" VARCHAR(128) NOT NULL DEFAULT '',
    "specCode" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "revisionCode" VARCHAR(128),
    "supersedesProductionSpecId" VARCHAR(128),
    "itemRef" JSONB NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "effectiveFrom" VARCHAR(64),
    "effectiveTo" VARCHAR(64),
    "retiredAt" VARCHAR(64),
    "replacementProductionSpecId" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "ProductionSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoldDesign" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "orgScope" VARCHAR(128) NOT NULL DEFAULT '',
    "designCode" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "revisionCode" VARCHAR(128),
    "supersedesMoldDesignId" VARCHAR(128),
    "primaryItemModelRef" JSONB NOT NULL,
    "productionSpecRefs" JSONB NOT NULL,
    "materialType" VARCHAR(128) NOT NULL,
    "functionRole" VARCHAR(64) NOT NULL,
    "productionMethodTags" TEXT[],
    "outputStructureType" VARCHAR(64) NOT NULL,
    "defaultLifeLimit" VARCHAR(64),
    "defaultLifeUnit" VARCHAR(64),
    "status" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoldDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoldDesignOutput" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "moldDesignId" VARCHAR(128) NOT NULL,
    "sequenceNo" INTEGER NOT NULL,
    "outputCode" VARCHAR(128) NOT NULL,
    "outputKind" VARCHAR(64) NOT NULL,
    "productionSpecRef" JSONB,
    "itemModelRef" JSONB,
    "quantityPerUse" VARCHAR(64) NOT NULL,
    "componentRole" VARCHAR(128),
    "assemblyHint" VARCHAR(255),
    "isPrimaryOutput" BOOLEAN NOT NULL,
    "options" JSONB NOT NULL,

    CONSTRAINT "MoldDesignOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterMold" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "orgScope" VARCHAR(128) NOT NULL DEFAULT '',
    "masterMoldCode" VARCHAR(128) NOT NULL,
    "moldDesignId" VARCHAR(128) NOT NULL,
    "supplierRef" JSONB,
    "purchaseRef" JSONB,
    "receivedAt" VARCHAR(64),
    "currentStatus" VARCHAR(64) NOT NULL,
    "currentStorageResourceRef" JSONB,
    "currentCarrierResourceRef" JSONB,
    "qualitySummary" VARCHAR(1000),
    "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterMold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionMold" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "orgScope" VARCHAR(128) NOT NULL DEFAULT '',
    "moldCode" VARCHAR(128) NOT NULL,
    "moldDesignId" VARCHAR(128) NOT NULL,
    "sourceMasterMoldId" VARCHAR(128),
    "supplierRef" JSONB,
    "purchaseRef" JSONB,
    "receivedAt" VARCHAR(64),
    "acceptedAt" VARCHAR(64),
    "currentStatus" VARCHAR(64) NOT NULL,
    "currentStorageResourceRef" JSONB,
    "currentCarrierResourceRef" JSONB,
    "currentInstallationSummary" JSONB,
    "lifeCounterSummary" JSONB,
    "scrappedAt" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionMold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageResource" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "orgScope" VARCHAR(128) NOT NULL DEFAULT '',
    "resourceCode" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierResource" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "orgScope" VARCHAR(128) NOT NULL DEFAULT '',
    "resourceCode" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCenter" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "orgScope" VARCHAR(128) NOT NULL DEFAULT '',
    "workCenterCode" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "workCenterType" VARCHAR(128),
    "areaId" VARCHAR(128),
    "status" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkUnit" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "workCenterId" VARCHAR(128) NOT NULL,
    "workUnitCode" VARCHAR(128) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoldMovement" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "toolingType" VARCHAR(64) NOT NULL,
    "toolingId" VARCHAR(128) NOT NULL,
    "fromStorageResourceRef" JSONB,
    "fromCarrierResourceRef" JSONB,
    "toStorageResourceRef" JSONB,
    "toCarrierResourceRef" JSONB,
    "movementReason" VARCHAR(500),
    "movedAt" TIMESTAMP(3) NOT NULL,
    "operatorRef" JSONB NOT NULL,
    "auditRef" JSONB NOT NULL,

    CONSTRAINT "MoldMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolingInstallation" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "toolingType" VARCHAR(64) NOT NULL,
    "toolingId" VARCHAR(128) NOT NULL,
    "workCenterRef" JSONB NOT NULL,
    "workUnitRef" JSONB,
    "installedAt" TIMESTAMP(3) NOT NULL,
    "unmountedAt" TIMESTAMP(3),
    "installedByRef" JSONB,
    "unmountedByRef" JSONB,
    "status" VARCHAR(64) NOT NULL,
    "auditRef" JSONB NOT NULL,

    CONSTRAINT "ToolingInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoldInstallationDetail" (
    "toolingInstallationId" VARCHAR(128) NOT NULL,
    "moldPositionIndex" INTEGER NOT NULL,
    "cavityPosition" VARCHAR(128),
    "cavityMapping" VARCHAR(1000),
    "setupParameters" VARCHAR(1000),

    CONSTRAINT "MoldInstallationDetail_pkey" PRIMARY KEY ("toolingInstallationId")
);

-- CreateTable
CREATE TABLE "MoldUsageRecord" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "productionMoldId" VARCHAR(128) NOT NULL,
    "toolingInstallationId" VARCHAR(128),
    "workCenterRef" JSONB NOT NULL,
    "workUnitRef" JSONB,
    "usedAt" TIMESTAMP(3) NOT NULL,
    "usageQuantity" VARCHAR(64) NOT NULL,
    "lifeDelta" VARCHAR(64) NOT NULL,
    "lifeUnit" VARCHAR(64) NOT NULL,
    "productionSpecRef" JSONB,
    "productionUnitRef" JSONB,
    "traceSubjectRef" JSONB,
    "operatorRef" JSONB NOT NULL,
    "captureSource" VARCHAR(128),
    "auditRef" JSONB NOT NULL,
    "moldDesignOutputId" VARCHAR(128),
    "moldDesignOutputOptionId" VARCHAR(128),

    CONSTRAINT "MoldUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoldLifeCounter" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "productionMoldId" VARCHAR(128) NOT NULL,
    "lifeUnit" VARCHAR(64) NOT NULL,
    "usedValue" VARCHAR(64) NOT NULL,
    "limitValue" VARCHAR(64),
    "warningThresholdValue" VARCHAR(64),
    "lastUsageRecordId" VARCHAR(128),
    "lastAdjustedAt" TIMESTAMP(3),
    "lastAdjustedByRef" JSONB,
    "adjustmentReason" VARCHAR(500),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoldLifeCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MesAuditEnvelope" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "service" VARCHAR(128) NOT NULL,
    "module" VARCHAR(128) NOT NULL,
    "eventType" VARCHAR(128) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" VARCHAR(64) NOT NULL,
    "operatorId" VARCHAR(128) NOT NULL,
    "operatorType" VARCHAR(64) NOT NULL,
    "traceId" VARCHAR(128) NOT NULL,
    "commandId" VARCHAR(128) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "resourceType" VARCHAR(128),
    "resourceId" VARCHAR(128),
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MesAuditEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MesOutboxEvent" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "eventType" VARCHAR(128) NOT NULL,
    "aggregateType" VARCHAR(128) NOT NULL,
    "aggregateId" VARCHAR(128) NOT NULL,
    "payload" JSONB NOT NULL,
    "traceId" VARCHAR(128) NOT NULL,
    "commandId" VARCHAR(128) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "status" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MesOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MesCommandIdempotency" (
    "id" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "orgId" VARCHAR(128),
    "commandId" VARCHAR(128) NOT NULL,
    "commandName" VARCHAR(128) NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "responseSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MesCommandIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionSpec_tenantId_orgId_status_idx" ON "ProductionSpec"("tenantId", "orgId", "status");

-- CreateIndex
CREATE INDEX "ProductionSpec_tenantId_specCode_idx" ON "ProductionSpec"("tenantId", "specCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionSpec_tenantId_orgScope_specCode_key" ON "ProductionSpec"("tenantId", "orgScope", "specCode");

-- CreateIndex
CREATE INDEX "MoldDesign_tenantId_orgId_status_idx" ON "MoldDesign"("tenantId", "orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MoldDesign_tenantId_orgScope_designCode_key" ON "MoldDesign"("tenantId", "orgScope", "designCode");

-- CreateIndex
CREATE INDEX "MoldDesignOutput_tenantId_moldDesignId_idx" ON "MoldDesignOutput"("tenantId", "moldDesignId");

-- CreateIndex
CREATE INDEX "MasterMold_tenantId_moldDesignId_idx" ON "MasterMold"("tenantId", "moldDesignId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterMold_tenantId_orgScope_masterMoldCode_key" ON "MasterMold"("tenantId", "orgScope", "masterMoldCode");

-- CreateIndex
CREATE INDEX "ProductionMold_tenantId_moldDesignId_currentStatus_idx" ON "ProductionMold"("tenantId", "moldDesignId", "currentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionMold_tenantId_orgScope_moldCode_key" ON "ProductionMold"("tenantId", "orgScope", "moldCode");

-- CreateIndex
CREATE INDEX "StorageResource_tenantId_orgId_status_idx" ON "StorageResource"("tenantId", "orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StorageResource_tenantId_orgScope_resourceCode_key" ON "StorageResource"("tenantId", "orgScope", "resourceCode");

-- CreateIndex
CREATE INDEX "CarrierResource_tenantId_orgId_status_idx" ON "CarrierResource"("tenantId", "orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CarrierResource_tenantId_orgScope_resourceCode_key" ON "CarrierResource"("tenantId", "orgScope", "resourceCode");

-- CreateIndex
CREATE INDEX "WorkCenter_tenantId_orgId_status_idx" ON "WorkCenter"("tenantId", "orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenter_tenantId_orgScope_workCenterCode_key" ON "WorkCenter"("tenantId", "orgScope", "workCenterCode");

-- CreateIndex
CREATE INDEX "WorkUnit_tenantId_workCenterId_status_idx" ON "WorkUnit"("tenantId", "workCenterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkUnit_tenantId_workCenterId_workUnitCode_key" ON "WorkUnit"("tenantId", "workCenterId", "workUnitCode");

-- CreateIndex
CREATE INDEX "MoldMovement_tenantId_toolingType_toolingId_movedAt_idx" ON "MoldMovement"("tenantId", "toolingType", "toolingId", "movedAt");

-- CreateIndex
CREATE INDEX "ToolingInstallation_tenantId_toolingType_toolingId_status_idx" ON "ToolingInstallation"("tenantId", "toolingType", "toolingId", "status");

-- CreateIndex
CREATE INDEX "ToolingInstallation_tenantId_status_idx" ON "ToolingInstallation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MoldUsageRecord_tenantId_productionMoldId_usedAt_idx" ON "MoldUsageRecord"("tenantId", "productionMoldId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MoldLifeCounter_productionMoldId_key" ON "MoldLifeCounter"("productionMoldId");

-- CreateIndex
CREATE INDEX "MoldLifeCounter_tenantId_productionMoldId_idx" ON "MoldLifeCounter"("tenantId", "productionMoldId");

-- CreateIndex
CREATE INDEX "MesAuditEnvelope_tenantId_occurredAt_idx" ON "MesAuditEnvelope"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "MesAuditEnvelope_tenantId_commandId_idx" ON "MesAuditEnvelope"("tenantId", "commandId");

-- CreateIndex
CREATE INDEX "MesOutboxEvent_tenantId_eventType_status_idx" ON "MesOutboxEvent"("tenantId", "eventType", "status");

-- CreateIndex
CREATE INDEX "MesOutboxEvent_tenantId_aggregateType_aggregateId_idx" ON "MesOutboxEvent"("tenantId", "aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "MesCommandIdempotency_tenantId_status_updatedAt_idx" ON "MesCommandIdempotency"("tenantId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MesCommandIdempotency_tenantId_commandId_key" ON "MesCommandIdempotency"("tenantId", "commandId");

-- AddForeignKey
ALTER TABLE "MoldDesignOutput" ADD CONSTRAINT "MoldDesignOutput_moldDesignId_fkey" FOREIGN KEY ("moldDesignId") REFERENCES "MoldDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoldInstallationDetail" ADD CONSTRAINT "MoldInstallationDetail_toolingInstallationId_fkey" FOREIGN KEY ("toolingInstallationId") REFERENCES "ToolingInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
