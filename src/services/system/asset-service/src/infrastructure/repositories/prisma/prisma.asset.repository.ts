import { Injectable } from '@nestjs/common'
import { AssetCategory, AssetScopeLevel, AssetStatus } from '../../../../prisma/generated/prisma/index'
import { AssetEntity, AssetScopeLevel as DomainAssetScopeLevel } from '../../../domain/entities/asset.entity'
import {
  AssetRepository,
  CreateAssetRecordInput,
  UpdateAssetStatusInput
} from '../../../domain/repositories/asset.repository'
import { PrismaService } from '../../prisma/prisma.service'

// PrismaAssetRepository maps asset-service asset persistence operations onto the local Prisma schema.
@Injectable()
export class PrismaAssetRepository implements AssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAssetRecordInput): Promise<AssetEntity> {
    const record = await this.prisma.asset.create({
      data: {
        scopeLevel: input.scopeLevel as AssetScopeLevel,
        tenantId: input.tenantId,
        ownerAccountId: input.ownerAccountId,
        category: input.category as AssetCategory,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        size: input.size,
        checksum: input.checksum,
        publicUrl: input.publicUrl,
        status: input.status as AssetStatus,
        createdBy: input.createdBy
      }
    })

    return this.toEntity(record)
  }

  async findById(assetId: string): Promise<AssetEntity | null> {
    const record = await this.prisma.asset.findUnique({
      where: { id: assetId }
    })

    return record ? this.toEntity(record) : null
  }

  async findActiveAvatarByAccountId(
    accountId: string,
    scopeLevel: DomainAssetScopeLevel,
    tenantId?: string
  ): Promise<AssetEntity | null> {
    const record = await this.prisma.asset.findFirst({
      where: {
        scopeLevel: scopeLevel as AssetScopeLevel,
        ownerAccountId: accountId,
        tenantId: tenantId ?? null,
        category: 'ACCOUNT_AVATAR',
        status: 'ACTIVE'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return record ? this.toEntity(record) : null
  }

  async updateStatus(input: UpdateAssetStatusInput): Promise<AssetEntity> {
    const record = await this.prisma.asset.update({
      where: { id: input.assetId },
      data: {
        status: input.status as AssetStatus,
        updatedBy: input.updatedBy
      }
    })

    return this.toEntity(record)
  }

  // toEntity keeps the repository as the single mapper between Prisma records and domain asset objects.
  private toEntity(record: {
    id: string
    scopeLevel: AssetScopeLevel
    tenantId: null | string
    ownerAccountId: string
    category: AssetCategory
    storageKey: string
    mimeType: string
    size: bigint
    checksum: string
    publicUrl: string
    status: AssetStatus
    createdBy: string
    updatedBy: null | string
    createdAt: Date
    updatedAt: Date
  }): AssetEntity {
    return new AssetEntity({
      id: record.id,
      scopeLevel: record.scopeLevel as DomainAssetScopeLevel,
      tenantId: record.tenantId,
      ownerAccountId: record.ownerAccountId,
      category: record.category,
      storageKey: record.storageKey,
      mimeType: record.mimeType,
      size: record.size,
      checksum: record.checksum,
      publicUrl: record.publicUrl,
      status: record.status,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })
  }
}
