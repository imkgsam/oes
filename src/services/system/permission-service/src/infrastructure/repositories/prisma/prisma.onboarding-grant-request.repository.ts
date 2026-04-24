import { Injectable } from '@nestjs/common'
import { OnboardingGrantRequestEntity } from '../../../domain/entities/onboarding-grant-request.entity'
import { OnboardingGrantRequestRepository } from '../../../domain/repositories/onboarding-grant-request.repository'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaOnboardingGrantRequestRepository persists onboarding grant idempotency state inside permission-service. */
@Injectable()
export class PrismaOnboardingGrantRequestRepository implements OnboardingGrantRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(input: {
    idempotencyKey: string
    tenantId: string
    accountId: string
    roleIds: string[]
    fingerprint: string
  }): Promise<OnboardingGrantRequestEntity> {
    const record = await this.prisma.onboardingGrantRequest.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        tenantId: input.tenantId,
        accountId: input.accountId,
        roleIds: input.roleIds,
        fingerprint: input.fingerprint,
        status: 'PENDING'
      }
    })

    return toEntity(record)
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<OnboardingGrantRequestEntity | null> {
    const record = await this.prisma.onboardingGrantRequest.findUnique({
      where: {
        idempotencyKey
      }
    })

    return record ? toEntity(record) : null
  }

  async markSucceeded(input: {
    idempotencyKey: string
    tenantId: string
    accountId: string
    roleIds: string[]
    fingerprint: string
  }): Promise<OnboardingGrantRequestEntity> {
    const record = await this.prisma.onboardingGrantRequest.upsert({
      where: {
        idempotencyKey: input.idempotencyKey
      },
      update: {
        tenantId: input.tenantId,
        accountId: input.accountId,
        roleIds: input.roleIds,
        fingerprint: input.fingerprint,
        status: 'SUCCEEDED'
      },
      create: {
        idempotencyKey: input.idempotencyKey,
        tenantId: input.tenantId,
        accountId: input.accountId,
        roleIds: input.roleIds,
        fingerprint: input.fingerprint,
        status: 'SUCCEEDED'
      }
    })

    return toEntity(record)
  }
}

function toEntity(record: {
  id: string
  idempotencyKey: string
  tenantId: string
  accountId: string
  roleIds: string[]
  fingerprint: string
  status: string
}): OnboardingGrantRequestEntity {
  return new OnboardingGrantRequestEntity(
    record.id,
    record.idempotencyKey,
    record.tenantId,
    record.accountId,
    record.roleIds,
    record.fingerprint,
    record.status as 'PENDING' | 'SUCCEEDED'
  )
}
