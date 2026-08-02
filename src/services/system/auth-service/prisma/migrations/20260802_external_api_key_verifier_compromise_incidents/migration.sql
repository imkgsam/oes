CREATE TABLE "ExternalApiKeyVerifierCompromiseIncident" (
 "incidentReference" TEXT PRIMARY KEY,
 "verifierKeyVersion" TEXT NOT NULL UNIQUE,
 "occurredAt" TIMESTAMP(3) NOT NULL,
 "processedAt" TIMESTAMP(3) NOT NULL,
 "stateRevision" TEXT NOT NULL,
 "workloadSubject" TEXT NOT NULL,
 "workloadClientId" TEXT NOT NULL,
 "requestId" TEXT,
 "traceId" TEXT,
 "matchedCredentialCount" INTEGER NOT NULL,
 "newlyRevokedCredentialCount" INTEGER NOT NULL,
 "alreadyRevokedCredentialCount" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
