-- Preserves the exact Structured CloudEvent bytes written by the command transaction.
ALTER TABLE "CollaborationTaskOutbox"
  RENAME COLUMN "cloudEventBody" TO "legacyCloudEventJson";

ALTER TABLE "CollaborationTaskOutbox"
  ADD COLUMN "cloudEventBody" BYTEA;

-- Existing JSONB rows have already lost their original serialization; retain their current
-- PostgreSQL JSON rendering exactly so subsequent relays never rewrite those migrated bytes.
UPDATE "CollaborationTaskOutbox"
SET "cloudEventBody" = convert_to("legacyCloudEventJson"::text, 'UTF8');

ALTER TABLE "CollaborationTaskOutbox"
  ALTER COLUMN "cloudEventBody" SET NOT NULL,
  DROP COLUMN "legacyCloudEventJson";
