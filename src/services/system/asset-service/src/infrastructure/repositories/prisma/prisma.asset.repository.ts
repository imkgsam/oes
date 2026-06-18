import { Injectable } from '@nestjs/common'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AssetCategory, AssetScopeLevel, AssetStatus, Prisma } from '../../../../prisma/generated/prisma/index'
import { AssetEntity, AssetScopeLevel as DomainAssetScopeLevel } from '../../../domain/entities/asset.entity'
import {
  ActivateEmployeeOfficialPhotoInput,
  ActivateEmployeeOfficialPhotoResult,
  AssetRepository,
  CreateAssetRecordInput,
  UpdateAssetStatusInput
} from '../../../domain/repositories/asset.repository'
import { PrismaService } from '../../prisma/prisma.service'

// PrismaAssetRepository maps asset-service asset persistence operations onto the local Prisma schema.
@Injectable()
export class PrismaAssetRepository implements AssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async activateEmployeeOfficialPhoto(
    input: ActivateEmployeeOfficialPhotoInput
  ): Promise<ActivateEmployeeOfficialPhotoResult> {
    return this.prisma.$transaction(
      async (tx) => {
        const nextRecord = await tx.asset.findUnique({
          where: { id: input.newAssetId }
        })
        if (!isEmployeeOfficialPhotoRecordOwnedBy(nextRecord, input.employeeId, input.tenantId)) {
          throw ExceptionFactory.application(VALIDATION_FAILED, {
            violations: ['newAssetId: employee official photo asset does not belong to the current employee context']
          })
        }
        if (nextRecord.status !== 'PENDING_BIND') {
          throw ExceptionFactory.application(VALIDATION_FAILED, {
            violations: ['newAssetId: employee official photo asset must be PENDING_BIND before activation']
          })
        }

        const previousRecord = await tx.asset.findFirst({
          where: {
            scopeLevel: 'TENANT',
            ownerEmployeeId: input.employeeId,
            tenantId: input.tenantId,
            category: 'EMPLOYEE_OFFICIAL_PHOTO',
            status: 'ACTIVE'
          },
          orderBy: {
            updatedAt: 'desc'
          }
        })

        if (input.previousAssetId && previousRecord?.id !== input.previousAssetId) {
          throw ExceptionFactory.application(VALIDATION_FAILED, {
            violations: ['previousAssetId: employee official photo asset is not the current active photo']
          })
        }

        let replacedAssetId: null | string = null
        if (
          previousRecord &&
          previousRecord.id !== input.newAssetId &&
          isEmployeeOfficialPhotoRecordOwnedBy(previousRecord, input.employeeId, input.tenantId)
        ) {
          await tx.asset.update({
            where: { id: previousRecord.id },
            data: {
              activeEmployeeOfficialPhotoKey: null,
              status: 'REPLACED',
              updatedBy: input.updatedBy
            }
          })
          replacedAssetId = previousRecord.id
        }

        const activeRecord = await tx.asset.update({
          where: { id: input.newAssetId },
          data: {
            activeEmployeeOfficialPhotoKey: buildEmployeeOfficialPhotoActiveKey(
              input.tenantId,
              input.employeeId
            ),
            status: 'ACTIVE',
            updatedBy: input.updatedBy
          }
        })

        return {
          activeAsset: this.toEntity(activeRecord),
          replacedAssetId
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    )
  }

  async create(input: CreateAssetRecordInput): Promise<AssetEntity> {
    const record = await this.prisma.asset.create({
      data: {
        scopeLevel: input.scopeLevel as AssetScopeLevel,
        tenantId: input.tenantId,
        activeEmployeeOfficialPhotoKey: null,
        ownerAccountId: input.ownerAccountId,
        ownerEmployeeId: input.ownerEmployeeId,
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

  async findActiveEmployeeOfficialPhotoByEmployeeId(
    employeeId: string,
    scopeLevel: DomainAssetScopeLevel,
    tenantId: string
  ): Promise<AssetEntity | null> {
    const record = await this.prisma.asset.findFirst({
      where: {
        scopeLevel: scopeLevel as AssetScopeLevel,
        ownerEmployeeId: employeeId,
        tenantId,
        category: 'EMPLOYEE_OFFICIAL_PHOTO',
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
    ownerAccountId: null | string
    ownerEmployeeId: null | string
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
      ownerEmployeeId: record.ownerEmployeeId,
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

// buildEmployeeOfficialPhotoActiveKey scopes the database uniqueness guard to one tenant employee official photo.
function buildEmployeeOfficialPhotoActiveKey(tenantId: string, employeeId: string): string {
  return `tenant:${tenantId}:employee:${employeeId}:official-photo`
}

// isEmployeeOfficialPhotoRecordOwnedBy verifies employee photo ownership before any bind status changes occur.
function isEmployeeOfficialPhotoRecordOwnedBy(
  record: {
    category: AssetCategory
    ownerAccountId: null | string
    ownerEmployeeId: null | string
    scopeLevel: AssetScopeLevel
    tenantId: null | string
  } | null,
  employeeId: string,
  tenantId: string
): boolean {
  return Boolean(
    record &&
      record.scopeLevel === 'TENANT' &&
      record.tenantId === tenantId &&
      record.category === 'EMPLOYEE_OFFICIAL_PHOTO' &&
      !record.ownerAccountId &&
      record.ownerEmployeeId === employeeId
  )
}
