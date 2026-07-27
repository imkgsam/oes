-- Give each pending Site resource a database-owned monotonic revision for Sync snapshot CAS.
ALTER TABLE "SiteProductPublication"
ADD COLUMN "syncRevision" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SiteCategoryPublication"
ADD COLUMN "syncRevision" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SiteContentLocaleVersion"
ADD COLUMN "syncRevision" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SiteContentCategoryLocaleVersion"
ADD COLUMN "syncRevision" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SiteExposureDraft"
ADD COLUMN "syncRevision" INTEGER NOT NULL DEFAULT 1;
