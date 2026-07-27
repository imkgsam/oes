-- Fence complete capability manifests with one monotonic registration stream per signed site and client.
CREATE TABLE "SiteCapabilityRegistrationStream" (
    "siteId" VARCHAR(128) NOT NULL,
    "clientId" VARCHAR(128) NOT NULL,
    "currentGeneration" DECIMAL(20,0) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteCapabilityRegistrationStream_pkey" PRIMARY KEY ("siteId", "clientId")
);

ALTER TABLE "SiteCapabilityRegistration"
    ADD COLUMN "expectedRegistrationGeneration" DECIMAL(20,0) NOT NULL DEFAULT 0,
    ADD COLUMN "registrationGeneration" DECIMAL(20,0) NOT NULL DEFAULT 0,
    ADD COLUMN "accepted" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "resultPayload" JSONB NOT NULL DEFAULT '{}';

WITH ranked AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "siteId", "clientId"
            ORDER BY "createdAt" ASC, "id" ASC
        ) AS generation
    FROM "SiteCapabilityRegistration"
)
UPDATE "SiteCapabilityRegistration" AS registration
SET
    "expectedRegistrationGeneration" = ranked.generation - 1,
    "registrationGeneration" = ranked.generation,
    "resultPayload" = jsonb_build_object(
        'accepted', true,
        'idempotentReplay', false,
        'manifestHash', registration."manifestHash",
        'discoveredCount', 0,
        'unavailablePageKeys', jsonb_build_array(),
        'driftPageKeys', jsonb_build_array(),
        'recoveredPageKeys', jsonb_build_array(),
        'registrationGeneration', ranked.generation::text
    )
FROM ranked
WHERE registration."id" = ranked."id";

INSERT INTO "SiteCapabilityRegistrationStream" (
    "siteId",
    "clientId",
    "currentGeneration",
    "createdAt",
    "updatedAt"
)
SELECT
    "siteId",
    "clientId",
    MAX("registrationGeneration"),
    MIN("createdAt"),
    CURRENT_TIMESTAMP
FROM "SiteCapabilityRegistration"
GROUP BY "siteId", "clientId";

DROP INDEX "SiteCapabilityRegistration_siteId_idempotencyKey_key";
DROP INDEX "SiteCapabilityRegistration_siteId_createdAt_idx";

CREATE UNIQUE INDEX "SiteCapabilityRegistration_siteId_clientId_idempotencyKey_key"
    ON "SiteCapabilityRegistration"("siteId", "clientId", "idempotencyKey");
CREATE INDEX "SiteCapabilityRegistration_siteId_clientId_createdAt_idx"
    ON "SiteCapabilityRegistration"("siteId", "clientId", "createdAt");
CREATE INDEX "SiteCapabilityRegistrationStream_siteId_updatedAt_idx"
    ON "SiteCapabilityRegistrationStream"("siteId", "updatedAt");

ALTER TABLE "SiteCapabilityRegistrationStream"
    ADD CONSTRAINT "SiteCapabilityRegistrationStream_siteId_fkey"
    FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
