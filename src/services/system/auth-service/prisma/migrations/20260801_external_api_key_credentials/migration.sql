CREATE TABLE "ExternalApiKeyCredential" (
 "id" TEXT PRIMARY KEY, "integrationMachineId" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
 "keyIdentifier" TEXT NOT NULL UNIQUE, "verifier" TEXT NOT NULL, "pepperVersion" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'ACTIVE', "expiresAt" TIMESTAMP(3) NOT NULL,
 "supersedesCredentialId" TEXT, "revokedAt" TIMESTAMP(3), "lastUsedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "ExternalApiKeyCredential_integrationMachineId_tenantId_idx" ON "ExternalApiKeyCredential"("integrationMachineId", "tenantId");
