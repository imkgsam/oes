import { Injectable } from '@nestjs/common'
import { AccountOrgRelationType } from '../../../../prisma/generated/prisma/index'
import { AccountOrgMembershipEntity } from '../../../domain/entities/account-org-membership.entity'
import { AccountOrgMembershipRepository } from '../../../domain/repositories/account-org-membership.repository'
import { PrismaAccountOrgMembershipMapper } from '../../mappers/prisma-account-org-membership.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaAccountOrgMembershipRepository implements AccountOrgMembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async clearPrimaryByAccountId(accountId: string): Promise<void> {
    await this.prisma.userAccountOrgMembership.updateMany({
      where: {
        accountId,
        isPrimary: true
      },
      data: {
        relationType: AccountOrgRelationType.SECONDARY,
        isPrimary: false
      }
    })
  }

  async findByAccountAndOrg(
    accountId: string,
    orgId: string
  ): Promise<AccountOrgMembershipEntity | null> {
    const record = await this.prisma.userAccountOrgMembership.findUnique({
      where: {
        accountId_orgId: {
          accountId,
          orgId
        }
      },
      include: {
        org: {
          select: {
            name: true,
            type: true
          }
        }
      }
    })

    return record ? PrismaAccountOrgMembershipMapper.toDomain(record) : null
  }

  async listByAccountId(
    accountId: string,
    scope?: {
      tenantId?: string
    }
  ): Promise<AccountOrgMembershipEntity[]> {
    const records = await this.prisma.userAccountOrgMembership.findMany({
      where: {
        accountId,
        account: scope?.tenantId
          ? {
              tenantId: scope.tenantId
            }
          : undefined
      },
      include: {
        org: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
    })

    return records.map((record) => PrismaAccountOrgMembershipMapper.toDomain(record))
  }

  async addSecondaryMembership(
    accountId: string,
    orgId: string
  ): Promise<AccountOrgMembershipEntity> {
    const record = await this.prisma.userAccountOrgMembership.create({
      data: PrismaAccountOrgMembershipMapper.toPersistent({
        accountId,
        orgId,
        relationType: AccountOrgRelationType.SECONDARY,
        isPrimary: false
      }),
      include: {
        org: {
          select: {
            name: true,
            type: true
          }
        }
      }
    })

    return PrismaAccountOrgMembershipMapper.toDomain(record)
  }

  async removeMembership(
    accountId: string,
    orgId: string
  ): Promise<AccountOrgMembershipEntity | null> {
    const record = await this.prisma.userAccountOrgMembership.delete({
      where: {
        accountId_orgId: {
          accountId,
          orgId
        }
      },
      include: {
        org: {
          select: {
            name: true,
            type: true
          }
        }
      }
    })

    return record ? PrismaAccountOrgMembershipMapper.toDomain(record) : null
  }

  async setPrimaryOrg(accountId: string, orgId: string): Promise<AccountOrgMembershipEntity> {
    const record = await this.prisma.$transaction(async (tx) => {
      await tx.userAccountOrgMembership.updateMany({
        where: {
          accountId,
          isPrimary: true
        },
        data: {
          relationType: AccountOrgRelationType.SECONDARY,
          isPrimary: false
        }
      })

      return tx.userAccountOrgMembership.upsert({
        where: {
          accountId_orgId: {
            accountId,
            orgId
          }
        },
        update: {
          relationType: AccountOrgRelationType.PRIMARY,
          isPrimary: true
        },
        create: PrismaAccountOrgMembershipMapper.toPersistent({
          accountId,
          orgId,
          relationType: AccountOrgRelationType.PRIMARY,
          isPrimary: true
        })
      })
    })

    return PrismaAccountOrgMembershipMapper.toDomain(record)
  }
}
