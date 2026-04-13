import { Injectable } from '@nestjs/common'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountCandidateEntity } from '../../../domain/entities/account-candidate.entity'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { PrismaService } from '../../prisma/prisma.service'
import {
  PrismaAccountCandidateMapper,
  PrismaAccountSummaryMapper
} from '../../mappers/prisma-account.mapper'

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

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
            },
            Tenant: {
              isActive: true
            }
          }
        ]
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        scopeLevel: true,
        displayName: true,
        isEnable: true,
        Tenant: {
          select: {
            isActive: true
          }
        }
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
        id: true,
        userId: true,
        tenantId: true,
        scopeLevel: true,
        displayName: true,
        isEnable: true,
        Tenant: {
          select: {
            isActive: true
          }
        }
      }
    })

    if (!record) {
      return null
    }

    return PrismaAccountSummaryMapper.toDomain(record)
  }
}
