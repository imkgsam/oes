import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { MachineWorkloadBindingRepository } from '../../../domain/repositories/machine-workload-binding.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaMachineWorkloadBindingMapper } from '../../mappers/prisma-machine-workload-binding.mapper'
import { Prisma } from '../../../../prisma/generated/prisma/index'

/** Persists binding lifecycle and its local audit facts atomically without crossing Identity's database boundary. */
@Injectable()
export class PrismaMachineWorkloadBindingRepository implements MachineWorkloadBindingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const row = await this.prisma.machineWorkloadBinding.findUnique({ where: { id } })
    return row ? PrismaMachineWorkloadBindingMapper.toDomain(row) : null
  }

  async findActiveByPrincipalAndSpiffe(serviceAccountId: string, workloadSpiffeId: string) {
    const row = await this.prisma.machineWorkloadBinding.findFirst({
      where: { serviceAccountId, workloadSpiffeId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' }
    })
    return row ? PrismaMachineWorkloadBindingMapper.toDomain(row) : null
  }

  async create(input: {
    serviceAccountId: string
    workloadSpiffeId: string
    operatorId?: string
    idempotencyKey: string
  }) {
    const enrollmentAuditRef = `machine-binding-enroll:${input.idempotencyKey}`
    let row
    try {
      row = await this.prisma.$transaction(async (transaction) => {
      const byKey = await transaction.machineWorkloadBinding.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
      if (byKey) return byKey
      const existing = await transaction.machineWorkloadBinding.findFirst({
        where: { serviceAccountId: input.serviceAccountId, workloadSpiffeId: input.workloadSpiffeId, status: 'ACTIVE' }
      })
      if (existing) return existing

      await transaction.auditEvent.create({
        data: {
          eventId: enrollmentAuditRef, service: 'identity-service', module: 'machine', eventType: 'MACHINE_WORKLOAD_BINDING_ENROLLED', occurredAt: new Date(), result: 'SUCCEEDED', operatorId: input.operatorId ?? null, operatorType: input.operatorId ? 'HUMAN' : 'SYSTEM', tenantId: null, orgId: null, traceId: null, resourceType: 'machine_workload_binding', resourceId: null, details: { serviceAccountId: input.serviceAccountId, workloadSpiffeId: input.workloadSpiffeId }
        }
      })
      return transaction.machineWorkloadBinding.create({
        data: {
          id: randomUUID(),
          serviceAccountId: input.serviceAccountId,
          workloadSpiffeId: input.workloadSpiffeId,
          idempotencyKey: input.idempotencyKey,
          createdBy: input.operatorId ?? null,
          enrollmentAuditRef
        }
      })
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
      const raced = await this.prisma.machineWorkloadBinding.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
      if (!raced) throw error
      row = raced
    }
    return PrismaMachineWorkloadBindingMapper.toDomain(row)
  }

  async disable(input: {
    bindingId: string
    expectedVersion: bigint
    reasonCode: string
    operatorId?: string
  }) {
    const result = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.machineWorkloadBinding.findUnique({ where: { id: input.bindingId } })
      if (!existing) throw new Error('MACHINE_WORKLOAD_BINDING_NOT_ELIGIBLE')
      if (existing.status === 'DISABLED') return { row: existing, alreadyDisabled: true }
      if (existing.version !== input.expectedVersion) throw new Error('MACHINE_WORKLOAD_BINDING_STALE')

      const disableAuditRef = `machine-binding-disable:${randomUUID()}`
      await transaction.auditEvent.create({
        data: {
          eventId: disableAuditRef, service: 'identity-service', module: 'machine', eventType: 'MACHINE_WORKLOAD_BINDING_DISABLED', occurredAt: new Date(), result: 'SUCCEEDED', operatorId: input.operatorId ?? null, operatorType: input.operatorId ? 'HUMAN' : 'SYSTEM', tenantId: null, orgId: null, traceId: null, resourceType: 'machine_workload_binding', resourceId: input.bindingId, details: { bindingId: input.bindingId, expectedVersion: input.expectedVersion.toString(), reasonCode: input.reasonCode }
        }
      })
      const row = await transaction.machineWorkloadBinding.update({
        where: { id: input.bindingId },
        data: {
          status: 'DISABLED',
          version: { increment: 1 },
          disabledAt: new Date(),
          disabledBy: input.operatorId ?? null,
          disableReasonCode: input.reasonCode,
          disableAuditRef
        }
      })
      return { row, alreadyDisabled: false }
    })
    return { binding: PrismaMachineWorkloadBindingMapper.toDomain(result.row), alreadyDisabled: result.alreadyDisabled }
  }

  /** Writes a safe local resolver decision audit without recording source credentials or certificate material. */
  async recordResolution(input: { allowed: boolean; machinePrincipalId: string; bindingId: string; reasonCode: string }): Promise<void> {
    await this.prisma.auditEvent.create({ data: { eventId: `machine-resolution:${randomUUID()}`, service: 'identity-service', module: 'machine', eventType: input.allowed ? 'MACHINE_PRINCIPAL_RESOLUTION_ALLOWED' : 'MACHINE_PRINCIPAL_RESOLUTION_DENIED', occurredAt: new Date(), result: input.allowed ? 'SUCCEEDED' : 'REJECTED', operatorId: null, operatorType: 'SYSTEM', tenantId: null, orgId: null, traceId: null, resourceType: 'machine_workload_binding', resourceId: input.bindingId, details: { machinePrincipalId: input.machinePrincipalId, bindingId: input.bindingId, reasonCode: input.reasonCode } } })
  }
}
