import { AssetSummary } from '@oes/common/generated/asset_service'
import { AssetEntity } from '../../domain/entities/asset.entity'

// AssetGrpcPresenter maps asset domain objects into the generated gRPC response shape.
export class AssetGrpcPresenter {
  static toAssetSummary(asset: AssetEntity): AssetSummary {
    return {
      assetId: asset.id,
      scopeLevel: asset.scopeLevel,
      tenantId: asset.tenantId ?? undefined,
      ownerAccountId: asset.ownerAccountId ?? undefined,
      ownerEmployeeId: asset.ownerEmployeeId ?? undefined,
      category: asset.category,
      storageKey: asset.storageKey,
      mimeType: asset.mimeType,
      size: asset.size.toString(),
      checksum: asset.checksum,
      publicUrl: asset.publicUrl,
      status: asset.status,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString()
    } as AssetSummary
  }
}
