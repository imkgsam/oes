CREATE TABLE "CollaborationTaskCommandReceipt" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" VARCHAR(100) NOT NULL,
  "operatorAccountId" VARCHAR(100) NOT NULL,
  "operationKey" VARCHAR(180) NOT NULL,
  "idempotencyKey" VARCHAR(180) NOT NULL,
  "descriptorDigest" VARCHAR(43) NOT NULL,
  "actionGrantJti" UUID,
  "taskId" UUID NOT NULL,
  "resultReference" VARCHAR(100) NOT NULL,
  "delegationReference" VARCHAR(100) NOT NULL,
  "agentPrincipalId" VARCHAR(100) NOT NULL,
  "toolContractId" VARCHAR(180) NOT NULL,
  "toolContractVersion" VARCHAR(40) NOT NULL,
  "authorizationDecisionReference" VARCHAR(100) NOT NULL,
  "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollaborationTaskCommandReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CollaborationTaskCommandReceipt_actionGrantJti_key" ON "CollaborationTaskCommandReceipt"("actionGrantJti");
CREATE UNIQUE INDEX "collab_task_receipt_idempotency_key" ON "CollaborationTaskCommandReceipt"("tenantId", "operatorAccountId", "operationKey", "idempotencyKey");
CREATE INDEX "CollaborationTaskCommandReceipt_tenantId_taskId_idx" ON "CollaborationTaskCommandReceipt"("tenantId", "taskId");
