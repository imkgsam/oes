import { Injectable } from '@nestjs/common'
import { PasswordRecoveryGrant } from '../../../domain/entities/password-recovery-grant.entity'
import { PasswordRecoveryGrantRepository } from '../../../domain/repositories/password-recovery-grant.repository'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
// Persists verified password-recovery grants so reset completion can stay auditable and one-time.
export class PrismaPasswordRecoveryGrantRepository
  implements PasswordRecoveryGrantRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PasswordRecoveryGrant | null> {
    const record = await this.prisma.passwordRecoveryGrant.findUnique({
      where: { id }
    })

    return record ? toDomain(record) : null
  }

  async save(grant: PasswordRecoveryGrant): Promise<PasswordRecoveryGrant> {
    const record = await this.prisma.passwordRecoveryGrant.upsert({
      where: { id: grant.id },
      update: {
        userId: grant.userId,
        loginMethodId: grant.loginMethodId,
        challengeId: grant.challengeId,
        expiresAt: grant.getExpiresAt(),
        verifiedAt: grant.verifiedAt,
        consumedAt: grant.getConsumedAt(),
        updatedAt: new Date()
      },
      create: {
        id: grant.id,
        userId: grant.userId,
        loginMethodId: grant.loginMethodId,
        challengeId: grant.challengeId,
        expiresAt: grant.getExpiresAt(),
        verifiedAt: grant.verifiedAt,
        consumedAt: grant.getConsumedAt(),
        createdAt: grant.createdAt
      }
    })

    return toDomain(record)
  }
}

function toDomain(record: {
  id: string
  userId: string
  loginMethodId: string
  challengeId: string
  expiresAt: Date
  verifiedAt: Date
  consumedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): PasswordRecoveryGrant {
  return new PasswordRecoveryGrant(
    record.id,
    record.userId,
    record.loginMethodId,
    record.challengeId,
    record.expiresAt,
    record.verifiedAt,
    record.consumedAt,
    record.createdAt,
    record.updatedAt
  )
}
