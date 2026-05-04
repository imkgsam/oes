import { Injectable } from '@nestjs/common'
import { Prisma, UserAccountScopeLevel } from '../../../../prisma/generated/prisma'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountCandidateEntity } from '../../../domain/entities/account-candidate.entity'
import { AccountDirectoryEntity } from '../../../domain/entities/account-directory.entity'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { PrismaService } from '../../prisma/prisma.service'
import {
  PrismaAccountCandidateMapper,
  PrismaAccountDirectoryMapper,
  PrismaAccountSummaryMapper
} from '../../mappers/prisma-account.mapper'

const ACCOUNT_SUMMARY_SELECT = {
  id: true,
  userId: true,
  tenantId: true,
  scopeLevel: true,
  avatarUrl: true,
  avatarAssetId: true,
  displayName: true,
  bio: true,
  isEnable: true,
  User: {
    select: {
      partyId: true,
      username: true
    }
  }
} as const

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Loads deletion preview data for one account so the caller can enforce blockers before cleanup starts.
  async getDeletionImpact(accountId: string): Promise<{
    account: AccountSummaryEntity | null
    contactAssetCount: number
    blockingReasons: Array<{
      resourceType: string
      resourceCount: number
      message: string
    }>
  }> {
    const [record, contactAssetCount] = await this.prisma.$transaction([
      this.prisma.userAccount.findUnique({
        where: {
          id: accountId
        },
        select: {
          ...ACCOUNT_SUMMARY_SELECT
        }
      }),
      this.prisma.accountContactAsset.count({
        where: {
          accountId
        }
      })
    ])

    return {
      account: record ? PrismaAccountSummaryMapper.toDomain(record) : null,
      contactAssetCount,
      blockingReasons: []
    }
  }

  async createUserAccount(input: {
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
    displayName?: string | null
  }): Promise<AccountSummaryEntity> {
    const tenantId = input.scopeLevel === 'TENANT' ? input.tenantId ?? null : null
    const record = await this.prisma.userAccount.create({
      data: {
        tenantId,
        userId: input.userId,
        scopeLevel: input.scopeLevel as UserAccountScopeLevel,
        contextKey: input.scopeLevel === 'SYSTEM' ? 'SYSTEM' : tenantId ?? '',
        displayName: input.displayName ?? null
      },
      select: {
        ...ACCOUNT_SUMMARY_SELECT
      }
    })

    return PrismaAccountSummaryMapper.toDomain(record)
  }

  // Permanently deletes one account and reports the number of identity-owned records that cascaded away with it.
  async delete(accountId: string): Promise<{
    deletedContactAssetCount: number
  }> {
    const deletedContactAssetCount = await this.prisma.accountContactAsset.count({
      where: {
        accountId
      }
    })

    await this.prisma.userAccount.delete({
      where: {
        id: accountId
      }
    })

    return {
      deletedContactAssetCount
    }
  }

  async findAvailableByUserId(userId: string): Promise<AccountCandidateEntity[]> {
    const records = await this.prisma.userAccount.findMany({
      where: {
        userId,
        isEnable: true,
        OR: [
          {
            scopeLevel: 'SYSTEM',
            tenantId: null
          },
          {
            scopeLevel: 'TENANT',
            tenantId: {
              not: null
            }
          }
        ]
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        scopeLevel: true,
        avatarUrl: true,
        avatarAssetId: true,
        displayName: true,
        bio: true,
        isEnable: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return records.map((record) => PrismaAccountCandidateMapper.toDomain(record))
  }

  async findById(accountId: string): Promise<AccountSummaryEntity | null> {
    const record = await this.prisma.userAccount.findUnique({
      where: {
        id: accountId
      },
      select: {
        ...ACCOUNT_SUMMARY_SELECT
      }
    })

    if (!record) {
      return null
    }

    return PrismaAccountSummaryMapper.toDomain(record)
  }

  // Finds the scoped account for one user so onboarding retries can reuse it instead of duplicating accounts.
  async findByUserScope(input: {
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }): Promise<AccountSummaryEntity | null> {
    const contextKey = input.scopeLevel === 'SYSTEM' ? 'SYSTEM' : input.tenantId ?? ''
    const record = await this.prisma.userAccount.findUnique({
      where: {
        userId_scopeLevel_contextKey: {
          userId: input.userId,
          scopeLevel: input.scopeLevel as UserAccountScopeLevel,
          contextKey
        }
      },
      select: {
        ...ACCOUNT_SUMMARY_SELECT
      }
    })

    return record ? PrismaAccountSummaryMapper.toDomain(record) : null
  }

  async list(input?: {
    keyword?: string
    page?: number
    pageSize?: number
    scopeLevel?: string
    status?: string
    tenantId?: string
  }): Promise<{ items: AccountDirectoryEntity[]; total: number }> {
    const page = Math.max(input?.page ?? 1, 1)
    const pageSize = Math.min(Math.max(input?.pageSize ?? 20, 1), 100)
    const where: Prisma.UserAccountWhereInput = {}
    const keyword = input?.keyword?.trim()

    if (input?.tenantId) {
      where.tenantId = input.tenantId.trim()
    }

    if (input?.scopeLevel) {
      where.scopeLevel =
        UserAccountScopeLevel[input.scopeLevel as keyof typeof UserAccountScopeLevel]
    }

    if (input?.status === 'ENABLED') {
      where.isEnable = true
    } else if (input?.status === 'DISABLED') {
      where.isEnable = false
    }

    if (keyword) {
      where.OR = [
        {
          id: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          userId: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          displayName: {
            contains: keyword,
            mode: 'insensitive'
          }
        },
        {
          User: {
            is: {
              username: {
                contains: keyword,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          User: {
            is: {
              email: {
                contains: keyword,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          User: {
            is: {
              phone: {
                contains: keyword,
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.userAccount.findMany({
        where,
        select: ACCOUNT_SUMMARY_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.userAccount.count({ where })
    ])

    return {
      items: records.map((record) => PrismaAccountDirectoryMapper.toDomain(record)),
      total
    }
  }

  // Counts tenant-scoped user accounts for tenant management read models without exposing account rows.
  async countByTenantIds(input: {
    tenantIds: string[]
    scopeLevel?: string
    status?: string
  }): Promise<Array<{ tenantId: string; total: number }>> {
    const tenantIds = Array.from(new Set(input.tenantIds.map((tenantId) => tenantId.trim()).filter(Boolean)))
    if (tenantIds.length === 0) {
      return []
    }

    const where: Prisma.UserAccountWhereInput = {
      tenantId: {
        in: tenantIds
      }
    }

    if (input.scopeLevel) {
      where.scopeLevel =
        UserAccountScopeLevel[input.scopeLevel as keyof typeof UserAccountScopeLevel]
    }

    if (input.status === 'ENABLED') {
      where.isEnable = true
    } else if (input.status === 'DISABLED') {
      where.isEnable = false
    }

    const groups = await this.prisma.userAccount.groupBy({
      by: ['tenantId'],
      where,
      _count: {
        _all: true
      }
    })

    return groups
      .filter((group) => group.tenantId)
      .map((group) => ({
        tenantId: group.tenantId!,
        total: group._count._all
      }))
  }

  async setEnabled(accountId: string, isEnabled: boolean): Promise<AccountSummaryEntity> {
    const record = await this.prisma.userAccount.update({
      where: {
        id: accountId
      },
      data: {
        isEnable: isEnabled
      },
      select: {
        ...ACCOUNT_SUMMARY_SELECT
      }
    })

    return PrismaAccountSummaryMapper.toDomain(record)
  }

  // Persists the editable account profile fields and returns the refreshed summary view.
  async updateProfile(
    accountId: string,
    input: {
      avatarAssetId?: string | null
      displayName?: string | null
      bio?: string | null
      isEnabled?: boolean
    }
  ): Promise<AccountSummaryEntity> {
    const data: {
      avatarAssetId?: string | null
      displayName?: string | null
      bio?: string | null
      isEnable?: boolean
    } = {}

    if (input.avatarAssetId !== undefined) {
      data.avatarAssetId = input.avatarAssetId
    }

    if (input.displayName !== undefined) {
      data.displayName = input.displayName
    }

    if (input.bio !== undefined) {
      data.bio = input.bio
    }

    if (input.isEnabled !== undefined) {
      data.isEnable = input.isEnabled
    }

    const record = await this.prisma.userAccount.update({
      where: {
        id: accountId
      },
      data: data as never,
      select: ACCOUNT_SUMMARY_SELECT
    })

    return PrismaAccountSummaryMapper.toDomain(record)
  }
}
