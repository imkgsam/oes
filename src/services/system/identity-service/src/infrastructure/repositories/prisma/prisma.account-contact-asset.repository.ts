import { Injectable } from '@nestjs/common'
import {
  AccountContactAssetOwnership,
  AccountContactAssetStatus,
  AccountContactAssetType
} from '../../../../prisma/generated/prisma/index'
import { AccountContactAssetEntity } from '../../../domain/entities/account-contact-asset.entity'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import { PrismaAccountContactAssetMapper } from '../../mappers/prisma-account-contact-asset.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaAccountContactAssetRepository implements AccountContactAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(assetId: string): Promise<AccountContactAssetEntity | null> {
    const record = await this.prisma.accountContactAsset.findUnique({
      where: {
        id: assetId
      }
    })

    return record ? PrismaAccountContactAssetMapper.toDomain(record) : null
  }

  async listByIds(assetIds: string[]): Promise<AccountContactAssetEntity[]> {
    if (assetIds.length === 0) return []

    const records = await this.prisma.accountContactAsset.findMany({
      where: {
        id: {
          in: assetIds
        }
      }
    })

    return records.map((record) => PrismaAccountContactAssetMapper.toDomain(record))
  }

  async findCurrentByTenantAndTypeAndValue(
    tenantId: string,
    type: string,
    value: string
  ): Promise<AccountContactAssetEntity | null> {
    const record = await this.prisma.accountContactAsset.findFirst({
      where: {
        tenantId,
        type: type as AccountContactAssetType,
        value,
        status: {
          notIn: [AccountContactAssetStatus.REVOKED, AccountContactAssetStatus.RELEASED]
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return record ? PrismaAccountContactAssetMapper.toDomain(record) : null
  }

  async listByAccountIdAndType(
    accountId: string,
    type: string,
    scope?: {
      tenantId?: string
    }
  ): Promise<AccountContactAssetEntity[]> {
    const records = await this.prisma.accountContactAsset.findMany({
      where: {
        accountId,
        type: type as AccountContactAssetType,
        tenantId: scope?.tenantId
      },
      orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }]
    })

    return records.map((record) => PrismaAccountContactAssetMapper.toDomain(record))
  }

  async listByAccountContactAssetFilter(input: {
    tenantId: string
    accountId: string
    employeeId?: string | null
    types?: string[]
    statuses?: string[]
    ownership?: string[]
  }): Promise<AccountContactAssetEntity[]> {
    const records = await this.prisma.accountContactAsset.findMany({
      where: {
        tenantId: input.tenantId,
        accountId: input.accountId,
        type: input.types?.length ? { in: input.types as AccountContactAssetType[] } : undefined,
        status: input.statuses?.length
          ? { in: input.statuses as AccountContactAssetStatus[] }
          : undefined,
        employeeId: input.employeeId || undefined,
        ownership: input.ownership?.length
          ? { in: input.ownership as AccountContactAssetOwnership[] }
          : undefined
      },
      orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }]
    })

    return records.map((record) => PrismaAccountContactAssetMapper.toDomain(record))
  }

  async assign(input: {
    tenantId: string
    accountId: string
    type: string
    value: string
    isPrimary: boolean
    assignedBy: string
  }): Promise<AccountContactAssetEntity> {
    const record = await this.prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.accountContactAsset.updateMany({
          where: {
            accountId: input.accountId,
            type: input.type as AccountContactAssetType,
            status: {
              notIn: [AccountContactAssetStatus.REVOKED, AccountContactAssetStatus.RELEASED]
            },
            isPrimary: true
          },
          data: {
            isPrimary: false
          }
        })
      }

      return tx.accountContactAsset.create({
        data: PrismaAccountContactAssetMapper.toPersistent({
          tenantId: input.tenantId,
          accountId: input.accountId,
          type: input.type as AccountContactAssetType,
          value: input.value,
          status: AccountContactAssetStatus.ACTIVE,
          isPrimary: input.isPrimary,
          assignedBy: input.assignedBy
        })
      })
    })

    return PrismaAccountContactAssetMapper.toDomain(record)
  }

  async revoke(assetId: string, revokedBy: string): Promise<AccountContactAssetEntity> {
    const record = await this.prisma.accountContactAsset.update({
      where: {
        id: assetId
      },
      data: {
        status: AccountContactAssetStatus.REVOKED,
        isPrimary: false,
        releasedAt: new Date(),
        revokedAt: new Date(),
        revokedBy
      }
    })

    return PrismaAccountContactAssetMapper.toDomain(record)
  }

  async setStatus(assetId: string, status: string): Promise<AccountContactAssetEntity> {
    const record = await this.prisma.accountContactAsset.update({
      where: {
        id: assetId
      },
      data: {
        status: status as AccountContactAssetStatus
      }
    })

    return PrismaAccountContactAssetMapper.toDomain(record)
  }

  async setPrimary(assetId: string): Promise<AccountContactAssetEntity> {
    const current = await this.prisma.accountContactAsset.findUniqueOrThrow({
      where: {
        id: assetId
      }
    })

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.accountContactAsset.updateMany({
        where: {
          accountId: current.accountId,
          type: current.type,
          status: {
            notIn: [AccountContactAssetStatus.REVOKED, AccountContactAssetStatus.RELEASED]
          },
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      })

      return tx.accountContactAsset.update({
        where: {
          id: assetId
        },
        data: {
          isPrimary: true
        }
      })
    })

    return PrismaAccountContactAssetMapper.toDomain(record)
  }
}
