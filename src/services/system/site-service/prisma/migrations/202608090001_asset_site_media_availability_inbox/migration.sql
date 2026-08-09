CREATE TABLE "SiteEventInbox" (
  "consumerName" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "bodyDigest" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteEventInbox_pkey" PRIMARY KEY ("consumerName", "eventId")
);
CREATE TABLE "AssetSiteMediaAvailabilityProjection" (
  "tenantId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "availabilityVersion" BIGINT NOT NULL,
  "lifecycleStatus" TEXT NOT NULL,
  "deliveryStatus" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetSiteMediaAvailabilityProjection_pkey" PRIMARY KEY ("tenantId", "assetId")
);
