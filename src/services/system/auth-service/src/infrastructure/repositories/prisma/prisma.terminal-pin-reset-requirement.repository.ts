import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import {
  TerminalPinResetReason,
  TerminalPinResetRequirementEntity
} from '../../../domain/entities/terminal-pin-reset-requirement.entity'
import { TerminalPinResetRequirementRepository } from '../../../domain/repositories/terminal-pin-reset-requirement.repository'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
// Persists explicit terminal PIN reset gates used by administrator security governance.
export class PrismaTerminalPinResetRequirementRepository
  implements TerminalPinResetRequirementRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUserId(
    userId: string
  ): Promise<TerminalPinResetRequirementEntity | null> {
    const record = await this.prisma.terminalPinResetRequirement.findFirst({
      where: { userId, required: true, completedAt: null }
    })
    return record ? toDomain(record) : null
  }

  async requireReset(input: {
    userId: string
    reason: TerminalPinResetReason
    requiredBy?: string | null
  }): Promise<TerminalPinResetRequirementEntity> {
    const record = await this.prisma.terminalPinResetRequirement.upsert({
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
    await this.prisma.terminalPinResetRequirement.updateMany({
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
}): TerminalPinResetRequirementEntity {
  return new TerminalPinResetRequirementEntity(
    record.id,
    record.userId,
    record.reason as TerminalPinResetReason,
    record.requiredBy,
    record.requiredAt,
    record.completedAt
  )
}
