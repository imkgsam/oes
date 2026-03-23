DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountOrgRelationType') THEN
    CREATE TYPE "AccountOrgRelationType" AS ENUM ('PRIMARY', 'SECONDARY');
  END IF;
END $$;

ALTER TABLE "UserAccountOrgMembership"
ADD COLUMN IF NOT EXISTS "relationType" "AccountOrgRelationType";

UPDATE "UserAccountOrgMembership"
SET "relationType" = CASE
  WHEN "isPrimary" = true THEN 'PRIMARY'::"AccountOrgRelationType"
  ELSE 'SECONDARY'::"AccountOrgRelationType"
END
WHERE "relationType" IS NULL;

ALTER TABLE "UserAccountOrgMembership"
ALTER COLUMN "relationType" SET NOT NULL;
