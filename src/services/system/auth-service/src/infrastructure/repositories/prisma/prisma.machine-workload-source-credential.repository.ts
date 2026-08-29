import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { randomUUID } from 'node:crypto'
import { MachineWorkloadSourceCredentialRepository } from '../../../domain/repositories/machine-workload-source-credential.repository'
import { MachineWorkloadSourceCredentialEntity } from '../../../domain/entities/machine-workload-source-credential.entity'
import type { MachineWorkloadSourceCredential, Prisma } from '../../../../prisma/generated/prisma/index'

/** Persists a certificate-bound MACHINE credential and its local audit fact atomically. */
@Injectable()
export class PrismaMachineWorkloadSourceCredentialRepository implements MachineWorkloadSourceCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Supersedes the active binding credential before recording the new non-bearer credential state and audit. */
  async issue(input: { id: string; machinePrincipalId: string; machineWorkloadBindingId: string; machineWorkloadBindingVersion: bigint; workloadSpiffeId: string; certificateThumbprint: string; certificateNotAfter: Date; signingKid: string; issuedAt: Date; expiresAt: Date; auditId: string; traceId: string | null }): Promise<MachineWorkloadSourceCredentialEntity> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.machineWorkloadBindingId}, 0))`
      const active = await tx.machineWorkloadSourceCredential.findFirst({ where: { machineWorkloadBindingId: input.machineWorkloadBindingId, status: 'ACTIVE' }, select: { id: true } })
      await tx.auditEvent.create({ data: { id: input.auditId, service: 'auth-service', module: 'machine_workload', eventType: active ? 'MACHINE_SOURCE_CREDENTIAL_REISSUED' : 'MACHINE_SOURCE_CREDENTIAL_ISSUED', occurredAt: input.issuedAt, result: 'SUCCEEDED', operatorId: null, operatorType: 'MACHINE', tenantId: null, orgId: null, traceId: input.traceId, resourceType: 'machine_workload_source_credential', resourceId: input.id, details: { credentialId: input.id, predecessorCredentialId: active?.id ?? null, bindingId: input.machineWorkloadBindingId } } })
      if (active) await tx.machineWorkloadSourceCredential.update({ where: { id: active.id }, data: { status: 'SUPERSEDED' } })
      const { auditId, ...credentialInput } = input
      const credential = await tx.machineWorkloadSourceCredential.create({ data: { ...credentialInput, status: 'ACTIVE', profileVersion: 1, predecessor: active ? { connect: { id: active.id } } : undefined, revokedAt: null, revokedReasonCode: null, audit: { connect: { id: auditId } } } })
      return credential
    })
    return toEntity(row)
  }

  /** Reads only the non-bearer lifecycle row needed by strict verifier and idempotent revocation paths. */
  async findById(id: string): Promise<MachineWorkloadSourceCredentialEntity | null> {
    const row = await this.prisma.machineWorkloadSourceCredential.findUnique({ where: { id } })
    return row ? toEntity(row) : null
  }

  /** Transitions a live credential once and returns the immutable first revocation result on retries. */
  async revoke(input: { credentialId: string; reasonCode: string; operatorId?: string }): Promise<{ credential: MachineWorkloadSourceCredentialEntity; alreadyRevoked: boolean }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.machineWorkloadSourceCredential.findUnique({ where: { id: input.credentialId } })
      if (!existing) throw new Error('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
      if (existing.status === 'REVOKED') return { credential: existing, alreadyRevoked: true }
      const revokedAt = new Date()
      const auditId = `machine-source-revoke:${input.credentialId}`
      await tx.auditEvent.create({ data: { id: auditId, service: 'auth-service', module: 'machine_workload', eventType: 'MACHINE_SOURCE_CREDENTIAL_REVOKED', occurredAt: revokedAt, result: 'SUCCEEDED', operatorId: input.operatorId ?? null, operatorType: input.operatorId ? 'HUMAN' : 'SYSTEM', tenantId: null, orgId: null, traceId: null, resourceType: 'machine_workload_source_credential', resourceId: input.credentialId, details: { credentialId: input.credentialId, reasonCode: input.reasonCode } } })
      const credential = await tx.machineWorkloadSourceCredential.update({ where: { id: input.credentialId }, data: { status: 'REVOKED', revokedAt, revokedReasonCode: input.reasonCode } })
      return { credential, alreadyRevoked: false }
    })
    return { credential: toEntity(result.credential), alreadyRevoked: result.alreadyRevoked }
  }

  /** Persists a non-secret verification outcome so acceptance and rejection are both locally auditable. */
  async recordVerificationOutcome(input: { credentialId?: string; eventType: 'MACHINE_SOURCE_CREDENTIAL_VERIFIED' | 'MACHINE_SOURCE_CREDENTIAL_REJECTED'; reasonCode: string; workloadSpiffeId?: string }): Promise<void> {
    await this.prisma.auditEvent.create({ data: { id: `machine-source-verify:${randomUUID()}`, service: 'auth-service', module: 'machine_workload', eventType: input.eventType, occurredAt: new Date(), result: input.eventType.endsWith('VERIFIED') ? 'SUCCEEDED' : 'REJECTED', operatorId: null, operatorType: 'SYSTEM', tenantId: null, orgId: null, traceId: null, resourceType: 'machine_workload_source_credential', resourceId: input.credentialId ?? null, details: { credentialId: input.credentialId ?? null, workloadSpiffeId: input.workloadSpiffeId ?? null, reasonCode: input.reasonCode } as Prisma.InputJsonValue } })
  }
}

/** Maps generated Prisma persistence rows into the Auth domain fact without retaining bearer material. */
function toEntity(row: MachineWorkloadSourceCredential): MachineWorkloadSourceCredentialEntity { return new MachineWorkloadSourceCredentialEntity(row.id, row.machinePrincipalId, row.machineWorkloadBindingId, row.machineWorkloadBindingVersion, row.workloadSpiffeId, row.certificateThumbprint, row.certificateNotAfter, row.profileVersion, row.signingKid, row.issuedAt, row.expiresAt, row.status === 'ACTIVE' ? 'ACTIVE' : row.status === 'REVOKED' ? 'REVOKED' : 'SUPERSEDED', row.predecessorId, row.auditId, row.revokedAt, row.revokedReasonCode) }
