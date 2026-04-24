import { Injectable } from '@nestjs/common'
import {
  OnboardingAccessProcessSummary,
  OnboardingAccessRepository,
  RecordOnboardingAccessStatusInput
} from '../../domain/repositories'
import { OnboardingAccessStatus } from '../../domain/value-objects'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaOnboardingAccessRepository stores retryable HR onboarding access compensation state. */
@Injectable()
export class PrismaOnboardingAccessRepository implements OnboardingAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestByEmployeeId(
    tenantId: string,
    employeeId: string
  ): Promise<OnboardingAccessProcessSummary | null> {
    const process = await this.prisma.employeeOnboardingAccess.findFirst({
      where: {
        tenantId,
        employeeId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return process ? mapOnboardingAccessProcess(process) : null
  }

  async recordAccessStatus(
    input: RecordOnboardingAccessStatusInput
  ): Promise<OnboardingAccessProcessSummary> {
    const process = await this.prisma.employeeOnboardingAccess.upsert({
      where: {
        tenantId_employeeId_employmentId: {
          tenantId: input.tenantId,
          employeeId: input.employeeId,
          employmentId: input.employmentId
        }
      },
      create: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        employmentId: input.employmentId,
        accountId: input.accountId ?? null,
        status: input.status,
        grantIdempotencyKey: input.grantIdempotencyKey ?? null,
        failureReason: input.failureReason ?? null
      },
      update: {
        accountId: input.accountId ?? null,
        status: input.status,
        grantIdempotencyKey: input.grantIdempotencyKey ?? null,
        failureReason: input.failureReason ?? null
      }
    })
    return mapOnboardingAccessProcess(process)
  }
}

/** mapOnboardingAccessProcess converts a Prisma compensation row to an application summary. */
function mapOnboardingAccessProcess(process: {
  id: string
  tenantId: string
  employeeId: string
  employmentId: string
  accountId: string | null
  status: string
  grantIdempotencyKey: string | null
  failureReason: string | null
}): OnboardingAccessProcessSummary {
  return {
    id: process.id,
    tenantId: process.tenantId,
    employeeId: process.employeeId,
    employmentId: process.employmentId,
    accountId: process.accountId,
    status: process.status as OnboardingAccessStatus,
    grantIdempotencyKey: process.grantIdempotencyKey,
    failureReason: process.failureReason
  }
}
