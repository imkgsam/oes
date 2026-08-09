import { ResolvedSiteMedia, SiteMediaAssetSummary } from '@oes/common/generated/asset_service'

/** AssetSiteMediaPort is the typed Site-owned boundary for Asset publication primitives. */
export interface AssetSiteMediaPort {
  resolve(input: { siteId: string; assetId: string; requiredMediaKind: string }): Promise<{ resolved?: ResolvedSiteMedia }>
  protect(input: { idempotencyKey: string; siteId: string; publishVersion: string; assetIds: string[] }): Promise<{ protectedAssetIds?: string[]; protectionStatus?: string }>
  release(input: { idempotencyKey: string; siteId: string; publishVersion: string }): Promise<{ releasedAssetIds?: string[]; releaseStatus?: string }>
}
