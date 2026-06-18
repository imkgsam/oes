import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { UserSummaryEntity } from '../../../domain/entities/user-summary.entity'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaUserMapper } from '../../mappers/prisma-user.mapper'

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    username?: string | null
    email?: string | null
    phone?: string | null
    isActive?: boolean
  }): Promise<UserSummaryEntity> {
    const record = await this.prisma.user.create({
      data: {
        username: input.username ?? null,
        email: input.email?.trim().toLowerCase() ?? null,
        phone: input.phone?.trim() ?? null,
        isActive: input.isActive ?? true
      }
    })

    return PrismaUserMapper.toDomain(record)
  }

  async findById(userId: string): Promise<UserSummaryEntity | null> {
    const record = await this.prisma.user.findUnique({
      where: { id: userId.trim() }
    })

    return record ? PrismaUserMapper.toDomain(record) : null
  }

  async findByEmail(email: string): Promise<UserSummaryEntity | null> {
    const normalizedEmail = email.trim().toLowerCase()
    const record = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    return record ? PrismaUserMapper.toDomain(record) : null
  }

  async findByPhone(phone: string): Promise<UserSummaryEntity | null> {
    const normalizedPhone = phone.trim()
    const record = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone }
    })

    return record ? PrismaUserMapper.toDomain(record) : null
  }

  async updateBasicInfo(
    userId: string,
    input: {
      email?: string | null
      phone?: string | null
    }
  ): Promise<UserSummaryEntity> {
    const record = await this.prisma.user.update({
      where: { id: userId.trim() },
      data: {
        ...(input.email !== undefined
          ? {
              email: input.email?.trim().toLowerCase() ?? null
            }
          : {}),
        ...(input.phone !== undefined
          ? {
              phone: input.phone?.trim() ?? null
            }
          : {})
      }
    })

    return PrismaUserMapper.toDomain(record)
  }
}
