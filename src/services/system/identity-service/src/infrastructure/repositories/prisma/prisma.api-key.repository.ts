import { Injectable } from '@nestjs/common'
import { APIKeyStatus } from '../../../../prisma/generated/prisma/index'
import { ApiKeyEntity } from '../../../domain/entities/api-key.entity'
import { ApiKeyRepository } from '../../../domain/repositories/api-key.repository'
import { PrismaApiKeyMapper } from '../../mappers/prisma-api-key.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaApiKeyRepository implements ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(apiKeyId: string): Promise<ApiKeyEntity | null> {
    const record = await this.prisma.aPIKey.findUnique({
      where: { id: apiKeyId }
    })

    return record ? PrismaApiKeyMapper.toDomain(record) : null
  }

  async findByHashedValue(hashedValue: string): Promise<ApiKeyEntity | null> {
    const record = await this.prisma.aPIKey.findUnique({
      where: { hashedValue }
    })

    return record ? PrismaApiKeyMapper.toDomain(record) : null
  }

  async listByServiceAccountId(
    serviceAccountId: string,
    scope?: {
      tenantId?: string
    }
  ): Promise<ApiKeyEntity[]> {
    const records = await this.prisma.aPIKey.findMany({
      where: {
        serviceAccountId,
        serviceAccount: scope?.tenantId
          ? {
              tenantId: scope.tenantId
            }
          : undefined
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
    })

    return records.map((record) => PrismaApiKeyMapper.toDomain(record))
  }

  async create(input: {
    serviceAccountId: string
    keyCode: string
    hashedValue: string
    expiresAt?: Date
    createdBy?: string
  }): Promise<ApiKeyEntity> {
    const record = await this.prisma.aPIKey.create({
      data: PrismaApiKeyMapper.toPersistent({
        serviceAccountId: input.serviceAccountId,
        keyCode: input.keyCode,
        hashedValue: input.hashedValue,
        status: APIKeyStatus.ACTIVE,
        expiresAt: input.expiresAt,
        createdBy: input.createdBy
      })
    })

    return PrismaApiKeyMapper.toDomain(record)
  }

  async revoke(input: {
    apiKeyId: string
    revokedBy?: string
  }): Promise<ApiKeyEntity> {
    const record = await this.prisma.aPIKey.update({
      where: { id: input.apiKeyId },
      data: {
        status: APIKeyStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy: input.revokedBy ?? null
      }
    })

    return PrismaApiKeyMapper.toDomain(record)
  }

  async touchLastUsed(input: {
    apiKeyId: string
    usedAt?: Date
  }): Promise<ApiKeyEntity> {
    const record = await this.prisma.aPIKey.update({
      where: { id: input.apiKeyId },
      data: PrismaApiKeyMapper.toLastUsedUpdate({
        usedAt: input.usedAt
      })
    })

    return PrismaApiKeyMapper.toDomain(record)
  }
}
