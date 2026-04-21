import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import {
  PasswordSetupReason,
  PasswordSetupRequirementEntity
} from '../../../domain/entities/password-setup-requirement.entity'
import { PasswordSetupRequirementRepository } from '../../../domain/repositories/password-setup-requirement.repository'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
// Persists explicit password setup gates used by first-login and administrator reset flows.
export class PrismaPasswordSetupRequirementRepository
  implements PasswordSetupRequirementRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUserId(userId: string): Promise<PasswordSetupRequirementEntity | null> {
    const record = await this.prisma.passwordSetupRequirement.findFirst({
      where: { userId, required: true, completedAt: null }
    })
    return record ? toDomain(record) : null
  }

  async requireSetup(input: {
    userId: string
    reason: PasswordSetupReason
    requiredBy?: string | null
  }): Promise<PasswordSetupRequirementEntity> {
    const record = await this.prisma.passwordSetupRequirement.upsert({
      where: { userId: input.userId },
      update: {
        required: true,
        reason: input.reason,
        requiredBy: input.requiredBy ?? null,
        requiredAt: new Date(),
        completedAt: null
      },
      create: {
        id: randomUUID(),
        userId: input.userId,
        required: true,
        reason: input.reason,
        requiredBy: input.requiredBy ?? null
      }
    })
    return toDomain(record)
  }

  async complete(userId: string): Promise<void> {
    await this.prisma.passwordSetupRequirement.updateMany({
      where: { userId, required: true, completedAt: null },
      data: { required: false, completedAt: new Date() }
    })
  }
}

function toDomain(record: {
  id: string
  userId: string
  reason: string
  requiredBy: string | null
  requiredAt: Date
  completedAt: Date | null
}): PasswordSetupRequirementEntity {
  return new PasswordSetupRequirementEntity(
    record.id,
    record.userId,
    record.reason as PasswordSetupReason,
    record.requiredBy,
    record.requiredAt,
    record.completedAt
  )
}
