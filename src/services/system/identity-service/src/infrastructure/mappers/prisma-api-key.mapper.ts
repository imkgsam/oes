import { APIKey, APIKeyStatus } from '../../../prisma/generated/prisma/index'
import { ApiKeyEntity } from '../../domain/entities/api-key.entity'

export class PrismaApiKeyMapper {
  static toDomain(record: APIKey): ApiKeyEntity {
    return new ApiKeyEntity(
      record.id,
      record.serviceAccountId,
      record.keyCode,
      APIKeyStatus[record.status],
      record.expiresAt ?? null,
      record.lastUsedAt ?? null,
      record.createdAt,
      record.updatedAt,
      record.createdBy ?? null,
      record.revokedAt ?? null,
      record.revokedBy ?? null
    )
  }

  static toPersistent(input: {
    serviceAccountId: string
    keyCode: string
    hashedValue: string
    status: APIKeyStatus
    expiresAt?: Date
    createdBy?: string
  }) {
    return {
      serviceAccountId: input.serviceAccountId,
      keyCode: input.keyCode,
      hashedValue: input.hashedValue,
      status: input.status,
      expiresAt: input.expiresAt ?? null,
      createdBy: input.createdBy ?? null
    }
  }

  static toLastUsedUpdate(input: { usedAt?: Date }) {
    return {
      lastUsedAt: input.usedAt ?? new Date()
    }
  }
}
