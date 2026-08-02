-- External API snapshots must be an explicit subset of existing BUSINESS permission metadata.
CREATE TYPE "PermissionKind" AS ENUM ('BUSINESS', 'INTERNAL');
ALTER TABLE "Permission" ADD COLUMN "kind" "PermissionKind" NOT NULL DEFAULT 'BUSINESS';
ALTER TABLE "Permission" ADD COLUMN "externalApiEligible" BOOLEAN NOT NULL DEFAULT false;
