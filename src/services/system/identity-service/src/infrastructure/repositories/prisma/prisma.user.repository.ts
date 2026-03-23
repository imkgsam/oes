import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { UserSummaryEntity } from '../../../domain/entities/user-summary.entity'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaUserMapper } from '../../mappers/prisma-user.mapper'

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserSummaryEntity | null> {
    const normalizedEmail = email.trim().toLowerCase()
    const record = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    return record ? PrismaUserMapper.toEntity(record) : null
  }
}
