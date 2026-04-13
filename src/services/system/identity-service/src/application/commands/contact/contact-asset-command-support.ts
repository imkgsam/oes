import { ExceptionFactory } from '@oes/common/exceptions'
import {
  CONTACT_ASSET_TYPES,
  CONTACT_ASSET_STATUSES,
  IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND,
  IDENTITY_CONTACT_ASSET_TYPE_MISMATCH,
  IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY,
  IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED
} from '../../../common/constants'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'

export async function loadAccountContactAssetOrThrow(
  repository: AccountContactAssetRepository,
  assetId: string
): Promise<AccountContactAssetEntity> {
  const asset = await repository.findById(assetId)
  if (!asset) {
    throw ExceptionFactory.domain(IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND, {
      assetId
    })
  }
  return asset
}

export function assertContactAssetModifiable(asset: AccountContactAssetEntity): void {
  if (asset.status === CONTACT_ASSET_STATUSES.REVOKED) {
    throw ExceptionFactory.domain(IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED, {
      assetId: asset.id
    })
  }
}

export function assertContactAssetCanBePrimary(asset: AccountContactAssetEntity): void {
  assertContactAssetModifiable(asset)

  if (asset.status !== CONTACT_ASSET_STATUSES.ACTIVE) {
    throw ExceptionFactory.domain(IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY, {
      assetId: asset.id
    })
  }
}

export function assertContactAssetType(
  asset: AccountContactAssetEntity,
  expectedType: string
): void {
  if (asset.type !== expectedType) {
    throw ExceptionFactory.domain(IDENTITY_CONTACT_ASSET_TYPE_MISMATCH, {
      assetId: asset.id,
      actualType: asset.type,
      expectedType,
      supportedTypes: Object.values(CONTACT_ASSET_TYPES)
    })
  }
}

export function resolveContactAssetStatus(enabled: boolean): string {
  return enabled ? CONTACT_ASSET_STATUSES.ACTIVE : CONTACT_ASSET_STATUSES.DISABLED
}
