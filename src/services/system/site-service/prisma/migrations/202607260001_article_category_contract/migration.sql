-- Freeze Article Category as a neutral, revisioned site-scoped taxonomy.
ALTER TABLE "SiteContentCategory"
  DROP COLUMN "appliesTo",
  DROP COLUMN "status",
  DROP COLUMN "isVisibleInBlogArchive",
  DROP COLUMN "isVisibleInNewsArchive",
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "SiteContentCategoryLocaleVersion"
  ALTER COLUMN "seoTitle" DROP NOT NULL,
  ALTER COLUMN "seoDescription" DROP NOT NULL,
  ADD COLUMN "publicationRequestedRevision" INTEGER;

CREATE TABLE "SiteContentCategoryPublishedLocaleVersion" (
  "categoryId" VARCHAR(128) NOT NULL,
  "siteId" VARCHAR(128) NOT NULL,
  "locale" VARCHAR(32) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "displayName" VARCHAR(255) NOT NULL,
  "archiveIntro" TEXT,
  "archiveLabel" VARCHAR(255),
  "seoTitle" VARCHAR(255),
  "seoDescription" TEXT,
  "seoImage" VARCHAR(1024),
  "historicalSlugs" JSONB NOT NULL DEFAULT '[]',
  "publishedRevision" INTEGER NOT NULL DEFAULT 1,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteContentCategoryPublishedLocaleVersion_pkey" PRIMARY KEY ("categoryId", "locale"),
  CONSTRAINT "SiteContentCategoryPublishedLocaleVersion_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "SiteContentCategory"("categoryId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SiteContentCategoryPublishedLocaleVersion_siteId_locale_idx"
  ON "SiteContentCategoryPublishedLocaleVersion"("siteId", "locale");

CREATE INDEX "SiteContentCategory_siteId_sortOrder_idx" ON "SiteContentCategory"("siteId", "sortOrder");
