import { Injectable } from '@nestjs/common'
import {
  TenantOnboardingExternalRefs,
  TenantOnboardingFailureRecord,
  TenantOnboardingRunRecord,
  TenantOnboardingRunRepository,
  TenantOnboardingStepRecord
} from '../../domain/repositories'
import { TenantOnboardingRunStatus } from '../../domain/value-objects/tenant-onboarding.enums'
import { Prisma } from '../../../prisma/generated/prisma'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaTenantOnboardingRunRepository persists tenant onboarding Saga state and external refs. */
@Injectable()
export class PrismaTenantOnboardingRunRepository implements TenantOnboardingRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    idempotencyKey: string
    requestHash: string
    requestPayload: Record<string, unknown>
    steps: TenantOnboardingStepRecord[]
  }): Promise<TenantOnboardingRunRecord> {
    const run = await this.prisma.tenantOnboardingRun.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        requestPayload: input.requestPayload as Prisma.InputJsonValue,
        externalRefs: {} as Prisma.InputJsonValue,
        steps: input.steps as unknown as Prisma.InputJsonValue,
        status: TenantOnboardingRunStatus.PENDING
      }
    })
    return mapRun(run)
  }

  async findById(id: string): Promise<TenantOnboardingRunRecord | null> {
    const run = await this.prisma.tenantOnboardingRun.findUnique({ where: { id } })
    return run ? mapRun(run) : null
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<TenantOnboardingRunRecord | null> {
    const run = await this.prisma.tenantOnboardingRun.findUnique({ where: { idempotencyKey } })
    return run ? mapRun(run) : null
  }

  async update(input: {
    id: string
    status?: TenantOnboardingRunStatus
    externalRefs?: TenantOnboardingExternalRefs
    steps?: TenantOnboardingStepRecord[]
    failure?: TenantOnboardingFailureRecord | null
  }): Promise<TenantOnboardingRunRecord> {
    const run = await this.prisma.tenantOnboardingRun.update({
      where: { id: input.id },
      data: {
        status: input.status,
        externalRefs: input.externalRefs as Prisma.InputJsonValue | undefined,
        steps: input.steps as unknown as Prisma.InputJsonValue | undefined,
        failure:
          input.failure === undefined
            ? undefined
            : input.failure === null
              ? Prisma.DbNull
              : (input.failure as unknown as Prisma.InputJsonValue)
      }
    })
    return mapRun(run)
  }
}

/** mapRun converts Prisma JSON-backed onboarding run rows into the domain repository contract. */
function mapRun(run: {
  id: string
  idempotencyKey: string
  requestHash: string
  status: string
  requestPayload: unknown
  externalRefs: unknown
  steps: unknown
  failure: unknown | null
}): TenantOnboardingRunRecord {
  return {
    id: run.id,
    idempotencyKey: run.idempotencyKey,
    requestHash: run.requestHash,
    status: run.status,
    requestPayload: (run.requestPayload ?? {}) as Record<string, unknown>,
    externalRefs: (run.externalRefs ?? {}) as TenantOnboardingExternalRefs,
    steps: (run.steps ?? []) as TenantOnboardingStepRecord[],
    failure: (run.failure ?? null) as TenantOnboardingFailureRecord | null
  }
}
