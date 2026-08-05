import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { WorkloadIssuancePolicyRepository } from '../../../domain/repositories/workload-issuance-policy.repository'
import { PermissionDecisionPolicy } from '../../../domain/services/permission-decision-policy'
import {
  PERMISSION_DECISION_AUDIT_PORT,
  PermissionDecisionAuditPort
} from '../../ports/permission-decision-audit.port'
import { ResolveWorkloadIssuanceQuery } from './resolve-workload-issuance.query'

/** Resolves the exact mTLS-only workload bootstrap policy and audits the bound result. */
@QueryHandler(ResolveWorkloadIssuanceQuery)
export class ResolveWorkloadIssuanceHandler implements IQueryHandler<ResolveWorkloadIssuanceQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.WORKLOAD_ISSUANCE_POLICY)
    private readonly workloadRepository: WorkloadIssuancePolicyRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepository: PermissionRepository,
    private readonly decisionPolicy: PermissionDecisionPolicy,
    @Inject(PERMISSION_DECISION_AUDIT_PORT)
    private readonly audit: PermissionDecisionAuditPort
  ) {}

  /** Executes one all-or-nothing workload-to-audience INTERNAL decision. */
  async execute(query: ResolveWorkloadIssuanceQuery) {
    const [policy, permissions] = await Promise.all([
      this.workloadRepository.findPolicy({
        originalWorkloadSpiffeId: query.input.originalWorkloadSpiffeId,
        targetAudience: query.input.targetAudience,
        scopeLevel: query.input.scopeLevel,
        tenantId: query.input.tenantId
      }),
      this.permissionRepository.findByCodes(query.input.requestedPermissionCodes)
    ])
    const policyDecision = this.decisionPolicy.resolveWorkloadIssuance(
      query.input,
      permissions.map((permission) => ({ code: permission.code, kind: permission.kind })),
      policy
    )
    const result = {
      ...policyDecision,
      decisionReference: `workload-issuance:${randomUUID()}`
    }
    this.audit.emitIssuanceDecision({
      decisionType: 'WORKLOAD_ISSUANCE',
      decisionReference: result.decisionReference,
      allowed: result.allowed,
      reasonCode: result.reasonCode,
      principalType: query.input.principalType,
      principalId: query.input.principalId,
      tenantId: query.input.tenantId,
      orgId: query.input.orgId,
      directWorkloadSpiffeId: query.caller.directWorkloadSpiffeId,
      certificateThumbprint: query.caller.certificateThumbprint,
      targetAudience: query.input.targetAudience,
      requestedPermissionCodes: query.input.requestedPermissionCodes,
      grantedPermissionCodes: result.grantedPermissionCodes,
      deniedPermissionCodes: result.deniedPermissionCodes,
      policyDecisionReference: result.policyDecisionReference,
      authzVersion: result.authzVersion,
      requestId: query.caller.requestId,
      traceId: query.caller.traceId
    })
    return result
  }
}
