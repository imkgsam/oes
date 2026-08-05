import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { PrincipalAuthorizationRepository } from '../../../domain/repositories/principal-authorization.repository'
import { PermissionDecisionPolicy } from '../../../domain/services/permission-decision-policy'
import {
  PERMISSION_DECISION_AUDIT_PORT,
  PermissionDecisionAuditPort
} from '../../ports/permission-decision-audit.port'
import { principalCallerBindingMatches } from '../../authorization/permission-decision-caller-binding'
import { ResolvePrincipalAuthorizationQuery } from './resolve-principal-authorization.query'

/** Resolves principal BUSINESS issuance from current Permission-owned facts and audits the bound result. */
@QueryHandler(ResolvePrincipalAuthorizationQuery)
export class ResolvePrincipalAuthorizationHandler implements IQueryHandler<ResolvePrincipalAuthorizationQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PRINCIPAL_AUTHORIZATION)
    private readonly principalRepository: PrincipalAuthorizationRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepository: PermissionRepository,
    private readonly decisionPolicy: PermissionDecisionPolicy,
    @Inject(PERMISSION_DECISION_AUDIT_PORT)
    private readonly audit: PermissionDecisionAuditPort
  ) {}

  /** Executes one all-or-nothing protected principal issuance decision. */
  async execute(query: ResolvePrincipalAuthorizationQuery) {
    const decisionReference = `principal-authorization:${randomUUID()}`
    if (!principalCallerBindingMatches(query.input, query.caller)) {
      const result = bindingDenied(query.input.requestedPermissionCodes, decisionReference)
      this.emitAudit(query, result)
      return result
    }

    const requestedPrincipalType =
      query.input.principalType === 'DELEGATED' ? 'HUMAN' : query.input.principalType
    const [facts, permissions] = await Promise.all([
      this.principalRepository.resolveAuthorizationFacts({
        principalType: requestedPrincipalType,
        principalId: query.input.principalId,
        scopeLevel: query.input.scopeLevel,
        tenantId: query.input.tenantId,
        requestedPermissionCodes: query.input.requestedPermissionCodes
      }),
      this.permissionRepository.findByCodes(query.input.requestedPermissionCodes)
    ])
    const policyDecision = this.decisionPolicy.resolvePrincipalAuthorization(
      query.input,
      facts,
      permissions.map((permission) => ({ code: permission.code, kind: permission.kind }))
    )
    const result = { ...policyDecision, decisionReference }
    this.emitAudit(query, result)
    return result
  }

  /** Emits safe principal issuance evidence after every allow or deny result. */
  private emitAudit(query: ResolvePrincipalAuthorizationQuery, result: any): void {
    this.audit.emitIssuanceDecision({
      decisionType: 'PRINCIPAL_AUTHORIZATION',
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
  }
}

/** Creates an application-level binding denial before any authorization repository lookup. */
function bindingDenied(requestedPermissionCodes: string[], decisionReference: string) {
  return {
    allowed: false,
    grantedPermissionCodes: [],
    deniedPermissionCodes: [...new Set(requestedPermissionCodes)].sort(),
    authzVersion: '',
    policyDecisionReference: '',
    decisionReference,
    reasonCode: 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
  }
}
