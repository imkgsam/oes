import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetView } from './contact-query.result'

// toAccountContactAssetView maps the domain Contact Asset entity into query-facing summary data.
export function toAccountContactAssetView(asset: AccountContactAssetEntity): AccountContactAssetView {
  return {
    id: asset.id,
    tenantId: asset.tenantId,
    accountId: asset.accountId,
    userId: asset.userId,
    employeeId: asset.employeeId,
    type: asset.type,
    provider: asset.provider,
    value: asset.value,
    displayName: asset.displayName,
    ownership: asset.ownership,
    usage: asset.usage,
    status: asset.status,
    isPrimary: asset.isPrimary,
    assignedAt: asset.assignedAt,
    releasedAt: asset.releasedAt
  }
}
