import { Injectable } from '@nestjs/common'
import type { Prisma, DelegationGrant } from '../../../prisma/generated/prisma'
import type {
  DelegatedExecutionAuditInput,
  DelegationGrantRepository,
  DelegationGrantSnapshot
} from '../../application/delegated-execution/delegated-execution.ports'
import { PrismaService } from '../prisma/prisma.service'

/** Persists DelegationGrant state and lifecycle audit exclusively in the Auth local database. */
@Injectable()
export class PrismaDelegationGrantRepository implements DelegationGrantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the immutable delegation and its creation audit in one local Auth transaction. */
  async create(grant: DelegationGrantSnapshot, audit: DelegatedExecutionAuditInput): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.delegationGrant.create({ data: toCreateInput(grant) })
      await transaction.delegatedExecutionAudit.create({ data: toAuditInput(audit) })
    })
  }

  /** Reads one opaque delegation reference without querying another service database. */
  async find(delegationReference: string): Promise<DelegationGrantSnapshot | undefined> {
    const row = await this.prisma.delegationGrant.findUnique({ where: { id: delegationReference } })
    return row ? toSnapshot(row) : undefined
  }

  /** Records only the first revocation and its audit atomically, returning the established result on retry. */
  async revoke(
    delegationReference: string,
    revokedAt: Date,
    audit: DelegatedExecutionAuditInput,
    reasonCategory: string
  ): Promise<DelegationGrantSnapshot> {
    return this.prisma.$transaction(async (transaction) => {
      const conditionalUpdate = await transaction.delegationGrant.updateMany({
        where: { id: delegationReference, revokedAt: null },
        data: { revokedAt, revokeReasonCategory: reasonCategory }
      })
      const current = await transaction.delegationGrant.findUnique({
        where: { id: delegationReference }
      })
      if (!current) throw new Error('DELEGATION_GRANT_INACTIVE')
      if (conditionalUpdate.count === 0) return toSnapshot(current)
      await transaction.delegatedExecutionAudit.create({ data: toAuditInput(audit) })
      return toSnapshot(current)
    })
  }

  /** Appends a non-secret issuance lifecycle audit before the credential is returned to its caller. */
  async appendAudit(audit: DelegatedExecutionAuditInput): Promise<void> {
    await this.prisma.delegatedExecutionAudit.create({ data: toAuditInput(audit) })
  }
}

/** Maps the application snapshot to Auth-owned persistence without introducing credential material. */
function toCreateInput(grant: DelegationGrantSnapshot): Prisma.DelegationGrantUncheckedCreateInput {
  return {
    id: grant.delegationReference,
    humanPrincipalId: grant.humanPrincipalId,
    sessionId: grant.sessionId,
    tenantId: grant.tenantId,
    orgId: grant.orgId,
    agentPrincipalId: grant.agentPrincipalId,
    toolContractId: grant.toolContractId,
    toolContractVersion: grant.toolContractVersion,
    operationKeys: [...grant.operationKeys],
    permissionCodes: [...grant.permissionCodes],
    authzVersion: grant.authzVersion,
    authorizationDecisionReference: grant.authorizationDecisionReference,
    expiresAt: grant.expiresAt,
    revokedAt: grant.revokedAt,
    revokeReasonCategory: grant.revokeReasonCategory,
    createdAt: grant.createdAt
  }
}

/** Maps one safe lifecycle fact to the dedicated Auth audit persistence shape. */
function toAuditInput(
  audit: DelegatedExecutionAuditInput
): Prisma.DelegatedExecutionAuditUncheckedCreateInput {
  return {
    id: audit.auditId,
    eventType: audit.eventType,
    result: audit.result,
    humanPrincipalId: audit.humanPrincipalId,
    tenantId: audit.tenantId,
    orgId: audit.orgId,
    delegationReference: audit.delegationReference,
    actionGrantJti: audit.actionGrantJti,
    operationKey: audit.operationKey,
    descriptorDigest: audit.descriptorDigest,
    authorizationDecisionReference: audit.authorizationDecisionReference,
    traceId: audit.traceId,
    occurredAt: audit.occurredAt
  }
}

/** Restores an immutable application snapshot from an Auth-local Prisma row. */
function toSnapshot(row: DelegationGrant): DelegationGrantSnapshot {
  return Object.freeze({
    delegationReference: row.id,
    humanPrincipalId: row.humanPrincipalId,
    sessionId: row.sessionId,
    tenantId: row.tenantId,
    ...(row.orgId === null ? {} : { orgId: row.orgId }),
    agentPrincipalId: row.agentPrincipalId,
    toolContractId: row.toolContractId,
    toolContractVersion: row.toolContractVersion,
    operationKeys: Object.freeze([...row.operationKeys]),
    permissionCodes: Object.freeze([...row.permissionCodes]),
    authzVersion: row.authzVersion,
    authorizationDecisionReference: row.authorizationDecisionReference,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    ...(row.revokedAt === null ? {} : { revokedAt: row.revokedAt }),
    ...(row.revokeReasonCategory === null ? {} : { revokeReasonCategory: row.revokeReasonCategory })
  })
}
