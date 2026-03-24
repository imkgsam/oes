import {
  AccountContactAsset,
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
      AccountContactAssetType[record.type],
      record.value,
      AccountContactAssetStatus[record.status],
      record.isPrimary,
      record.assignedAt,
      record.revokedAt ?? null
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
  }) {
    return {
      tenantId: input.tenantId,
      accountId: input.accountId,
      type: input.type,
      value: input.value,
      status: input.status,
      isPrimary: input.isPrimary,
      assignedBy: input.assignedBy
    }
  }
}
