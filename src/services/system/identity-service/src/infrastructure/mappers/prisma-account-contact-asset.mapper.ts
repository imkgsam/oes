import {
  AccountContactAsset,
  AccountContactAssetOwnership,
  AccountContactAssetStatus,
  AccountContactAssetType
} from '../../../prisma/generated/prisma/index'
import { AccountContactAssetEntity } from '../../domain/entities/account-contact-asset.entity'

export class PrismaAccountContactAssetMapper {
  static toDomain(record: AccountContactAsset): AccountContactAssetEntity {
    return new AccountContactAssetEntity(
      record.id,
      record.tenantId,
      record.accountId,
      record.userId ?? null,
      record.employeeId ?? null,
      AccountContactAssetType[record.type],
      record.provider ?? null,
      record.value,
      record.displayName ?? null,
      AccountContactAssetOwnership[record.ownership],
      record.usage,
      AccountContactAssetStatus[record.status],
      record.isPrimary,
      record.assignedAt,
      record.releasedAt ?? record.revokedAt ?? null
    )
  }

  static toPersistent(input: {
    tenantId: string
    accountId: string
    type: AccountContactAssetType
    value: string
    status: AccountContactAssetStatus
    isPrimary: boolean
    assignedBy: string
    userId?: string | null
    employeeId?: string | null
    provider?: string | null
    displayName?: string | null
    ownership?: AccountContactAssetOwnership
    usage?: string[]
  }) {
    return {
      tenantId: input.tenantId,
      accountId: input.accountId,
      userId: input.userId ?? null,
      employeeId: input.employeeId ?? null,
      type: input.type,
      provider: input.provider ?? null,
      value: input.value,
      displayName: input.displayName ?? null,
      ownership: input.ownership ?? AccountContactAssetOwnership.COMPANY_CONTROLLED,
      usage: input.usage ?? ['WORK_CONTACT', 'VCARD_CANDIDATE'],
      status: input.status,
      isPrimary: input.isPrimary,
      assignedBy: input.assignedBy
    }
  }
}
