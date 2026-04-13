import { ApiKeyEntity } from '../entities/api-key.entity'

export interface ApiKeyRepository {
  findById(apiKeyId: string): Promise<ApiKeyEntity | null>
  findByHashedValue(hashedValue: string): Promise<ApiKeyEntity | null>
  listByServiceAccountId(
    serviceAccountId: string,
    scope?: {
      tenantId?: string
    }
  ): Promise<ApiKeyEntity[]>
  create(input: {
    serviceAccountId: string
    keyCode: string
    hashedValue: string
    expiresAt?: Date
    createdBy?: string
  }): Promise<ApiKeyEntity>
  revoke(input: {
    apiKeyId: string
    revokedBy?: string
  }): Promise<ApiKeyEntity>
  touchLastUsed(input: {
    apiKeyId: string
    usedAt?: Date
  }): Promise<ApiKeyEntity>
}
