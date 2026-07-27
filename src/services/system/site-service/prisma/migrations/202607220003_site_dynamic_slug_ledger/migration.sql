-- Establish the relational dynamic slug ownership truth before any new reservations are accepted.
CREATE TABLE "SiteSlugLedger" (
    "id" UUID NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "namespace" VARCHAR(32) NOT NULL,
    "locale" VARCHAR(32) NOT NULL,
    "normalizedSlug" VARCHAR(255) NOT NULL,
    "resourceId" VARCHAR(128) NOT NULL,
    "publicationRole" VARCHAR(32),
    "draftReserved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSlugLedger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SiteSlugLedger_publicationRole_check"
      CHECK ("publicationRole" IS NULL OR "publicationRole" IN ('canonical', 'historical')),
    CONSTRAINT "SiteSlugLedger_owned_state_check"
      CHECK ("draftReserved" OR "publicationRole" IS NOT NULL)
);

CREATE TEMP TABLE "_SiteSlugLedgerBackfill" (
    "siteId" VARCHAR(128) NOT NULL,
    "namespace" VARCHAR(32) NOT NULL,
    "locale" VARCHAR(32) NOT NULL,
    "normalizedSlug" VARCHAR(255) NOT NULL,
    "resourceId" VARCHAR(128) NOT NULL,
    "publicationRole" VARCHAR(32),
    "draftReserved" BOOLEAN NOT NULL,
    "sourceCreatedAt" TIMESTAMP(3) NOT NULL
) ON COMMIT DROP;

-- Preserve committed canonical ownership, including currently non-public targets.
INSERT INTO "_SiteSlugLedgerBackfill"
SELECT
  "siteId",
  "resourceType",
  "locale",
  lower(normalize(btrim("slug"), NFKC)),
  "resourceId",
  'canonical',
  false,
  "createdAt"
FROM "SitePublicView"
WHERE "resourceType" IN ('blog', 'news', 'article-category');

-- Preserve every externally materialized published alias.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "SitePublicView"
    WHERE "resourceType" IN ('blog', 'news', 'article-category')
      AND "payload" ? 'historical_slugs'
      AND jsonb_typeof("payload"->'historical_slugs') <> 'array'
  ) THEN
    RAISE EXCEPTION 'Site slug ledger backfill failed: public historical_slugs must be arrays';
  END IF;
END $$;

INSERT INTO "_SiteSlugLedgerBackfill"
SELECT
  view."siteId",
  view."resourceType",
  view."locale",
  lower(normalize(btrim(history."slug"), NFKC)),
  view."resourceId",
  'historical',
  false,
  view."createdAt"
FROM "SitePublicView" AS view
CROSS JOIN LATERAL jsonb_array_elements_text(
  COALESCE(view."payload"->'historical_slugs', '[]'::jsonb)
) AS history("slug")
WHERE view."resourceType" IN ('blog', 'news', 'article-category');

-- Preserve the current editable locale slug as the active draft reservation.
INSERT INTO "_SiteSlugLedgerBackfill"
SELECT
  entry."siteId",
  entry."contentType",
  version."locale",
  lower(normalize(btrim(version."slug"), NFKC)),
  version."contentId",
  NULL,
  true,
  version."createdAt"
FROM "SiteContentLocaleVersion" AS version
JOIN "SiteContentEntry" AS entry ON entry."contentId" = version."contentId"
WHERE entry."contentType" IN ('blog', 'news');

INSERT INTO "_SiteSlugLedgerBackfill"
SELECT
  version."siteId",
  'article-category',
  version."locale",
  lower(normalize(btrim(version."slug"), NFKC)),
  version."categoryId",
  NULL,
  true,
  version."createdAt"
FROM "SiteContentCategoryLocaleVersion" AS version;

-- Abort instead of renaming or overwriting any ambiguous existing ownership.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "_SiteSlugLedgerBackfill" WHERE "normalizedSlug" = ''
  ) THEN
    RAISE EXCEPTION 'Site slug ledger backfill failed: blank normalized slug';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "_SiteSlugLedgerBackfill"
    GROUP BY "siteId", "namespace", "locale", "normalizedSlug"
    HAVING count(DISTINCT "resourceId") > 1
  ) THEN
    RAISE EXCEPTION 'Site slug ledger backfill failed: conflicting slug owners';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "_SiteSlugLedgerBackfill"
    WHERE "publicationRole" = 'canonical'
    GROUP BY "siteId", "namespace", "locale", "resourceId"
    HAVING count(DISTINCT "normalizedSlug") > 1
  ) THEN
    RAISE EXCEPTION 'Site slug ledger backfill failed: multiple canonical slugs for one resource';
  END IF;
END $$;

INSERT INTO "SiteSlugLedger" (
  "id",
  "siteId",
  "namespace",
  "locale",
  "normalizedSlug",
  "resourceId",
  "publicationRole",
  "draftReserved",
  "createdAt",
  "updatedAt"
)
SELECT
  md5("siteId" || E'\x1f' || "namespace" || E'\x1f' || "locale" || E'\x1f' || "normalizedSlug")::uuid,
  "siteId",
  "namespace",
  "locale",
  "normalizedSlug",
  min("resourceId"),
  CASE
    WHEN bool_or("publicationRole" = 'canonical') THEN 'canonical'
    WHEN bool_or("publicationRole" = 'historical') THEN 'historical'
    ELSE NULL
  END,
  bool_or("draftReserved"),
  min("sourceCreatedAt"),
  CURRENT_TIMESTAMP
FROM "_SiteSlugLedgerBackfill"
GROUP BY "siteId", "namespace", "locale", "normalizedSlug";

CREATE UNIQUE INDEX "SiteSlugLedger_siteId_namespace_locale_normalizedSlug_key"
ON "SiteSlugLedger"("siteId", "namespace", "locale", "normalizedSlug");

CREATE INDEX "SiteSlugLedger_siteId_namespace_resourceId_locale_idx"
ON "SiteSlugLedger"("siteId", "namespace", "resourceId", "locale");

CREATE INDEX "SiteSlugLedger_siteId_namespace_locale_publicationRole_idx"
ON "SiteSlugLedger"("siteId", "namespace", "locale", "publicationRole");

CREATE UNIQUE INDEX "SiteSlugLedger_one_draft_per_resource_idx"
ON "SiteSlugLedger"("siteId", "namespace", "resourceId", "locale")
WHERE "draftReserved" = true;

CREATE UNIQUE INDEX "SiteSlugLedger_one_canonical_per_resource_idx"
ON "SiteSlugLedger"("siteId", "namespace", "resourceId", "locale")
WHERE "publicationRole" = 'canonical';

ALTER TABLE "SiteSlugLedger"
ADD CONSTRAINT "SiteSlugLedger_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
