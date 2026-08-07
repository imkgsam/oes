import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { MachineWorkloadSourceCredentialRepository } from '../../../domain/repositories/machine-workload-source-credential.repository'

/** Persists a certificate-bound MACHINE credential and its local audit fact atomically. */
@Injectable()
export class PrismaMachineWorkloadSourceCredentialRepository implements MachineWorkloadSourceCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Supersedes the active binding credential before recording the new non-bearer credential state and audit. */
  async issue(input: any) {
    return (this.prisma as any).$transaction(async (tx: any) => {
      await tx.machineWorkloadSourceCredential.updateMany({ where: { machineWorkloadBindingId: input.machineWorkloadBindingId, status: 'ACTIVE' }, data: { status: 'SUPERSEDED' } })
      const credential = await tx.machineWorkloadSourceCredential.create({ data: { ...input, status: 'ACTIVE', profileVersion: 1, predecessorId: null, revokedAt: null, revokedReasonCode: null } })
      await tx.auditEvent.create({ data: { id: input.auditId, service: 'auth-service', module: 'machine_workload', eventType: 'MACHINE_SOURCE_CREDENTIAL_ISSUED', occurredAt: input.issuedAt, result: 'SUCCEEDED', operatorId: null, operatorType: 'MACHINE', tenantId: null, orgId: null, traceId: input.traceId, resourceType: 'machine_workload_source_credential', resourceId: input.id, details: { credentialId: input.id, bindingId: input.machineWorkloadBindingId } } })
      return credential
    })
  }

  /** Reads only the non-bearer lifecycle row needed by strict verifier and idempotent revocation paths. */
  async findById(id: string): Promise<any> {
    return (this.prisma as any).machineWorkloadSourceCredential.findUnique({ where: { id } })
  }

  /** Transitions a live credential once and returns the immutable first revocation result on retries. */
  async revoke(input: { credentialId: string; reasonCode: string; operatorId?: string }): Promise<any> {
    return (this.prisma as any).$transaction(async (tx: any) => {
      const existing = await tx.machineWorkloadSourceCredential.findUnique({ where: { id: input.credentialId } })
      if (!existing) throw new Error('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
      if (existing.status === 'REVOKED') return { credential: existing, alreadyRevoked: true }
      const revokedAt = new Date()
      const auditId = `machine-source-revoke:${input.credentialId}`
      await tx.auditEvent.create({ data: { id: auditId, service: 'auth-service', module: 'machine_workload', eventType: 'MACHINE_SOURCE_CREDENTIAL_REVOKED', occurredAt: revokedAt, result: 'SUCCEEDED', operatorId: input.operatorId ?? null, operatorType: input.operatorId ? 'HUMAN' : 'SYSTEM', tenantId: null, orgId: null, traceId: null, resourceType: 'machine_workload_source_credential', resourceId: input.credentialId, details: { credentialId: input.credentialId, reasonCode: input.reasonCode } } })
      const credential = await tx.machineWorkloadSourceCredential.update({ where: { id: input.credentialId }, data: { status: 'REVOKED', revokedAt, revokedReasonCode: input.reasonCode } })
      return { credential, alreadyRevoked: false }
    })
  }
}
