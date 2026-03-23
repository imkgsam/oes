import { Injectable } from '@nestjs/common'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountCandidateEntity } from '../../../domain/entities/account-candidate.entity'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaAccountMapper } from '../../mappers/prisma-account.mapper'

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableByUserId(userId: string): Promise<AccountCandidateEntity[]> {
    const records = await this.prisma.userAccount.findMany({
      where: {
        userId,
        isEnable: true,
        Tenant: {
          isActive: true
        }
      },
      include: {
        Tenant: {
          select: {
            name: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return records.map((record) => PrismaAccountMapper.toEntity(record))
  }

  async findById(accountId: string): Promise<AccountSummaryEntity | null> {
    const record = await this.prisma.userAccount.findUnique({
      where: {
        id: accountId
      },
      include: {
        Tenant: {
          select: {
            name: true,
            isActive: true
          }
        }
      }
    })

    if (!record) {
      return null
    }

    return PrismaAccountMapper.toSummaryEntity(record)
  }
}
