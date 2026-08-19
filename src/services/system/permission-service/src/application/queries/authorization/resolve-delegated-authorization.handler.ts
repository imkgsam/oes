import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { PrincipalAuthorizationRepository } from '../../../domain/repositories/principal-authorization.repository'
import {
  delegatedDecisionAuthzVersion,
  PermissionDecisionPolicy
} from '../../../domain/services/permission-decision-policy'
import {
  PERMISSION_DECISION_AUDIT_PORT,
  PermissionDecisionAuditPort
} from '../../ports/permission-decision-audit.port'
import { delegatedCallerBindingMatches } from '../../authorization/permission-decision-caller-binding'
import { ResolveDelegatedAuthorizationQuery } from './resolve-delegated-authorization.query'
import { toPermissionDecisionCatalogEntry } from '../../../domain/services/permission-code-eligibility'

/** Resolves delegated action upper bounds from owner snapshots and current HUMAN grant facts. */
@QueryHandler(ResolveDelegatedAuthorizationQuery)
export class ResolveDelegatedAuthorizationHandler implements IQueryHandler<ResolveDelegatedAuthorizationQuery> {
  constructor(
    @Inject(SYMBOLS.REPO.PRINCIPAL_AUTHORIZATION)
    private readonly principalRepository: PrincipalAuthorizationRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepository: PermissionRepository,
    private readonly decisionPolicy: PermissionDecisionPolicy,
    @Inject(PERMISSION_DECISION_AUDIT_PORT)
    private readonly audit: PermissionDecisionAuditPort
  ) {}

  /** Executes one protected delegated action intersection and emits safe audit evidence. */
  async execute(query: ResolveDelegatedAuthorizationQuery) {
    const decisionReference = `delegated-authorization:${randomUUID()}`
    let policyDecision
    if (!delegatedCallerBindingMatches(query.input, query.caller)) {
      policyDecision = {
        allowed: false,
        allowedPermissionCodes: [],
        deniedPermissionCodes: [...new Set(query.input.requestedPermissionCodes)].sort(),
        riskClass: query.input.ownerAuthorization.effectiveRiskClass,
        policyVersion: query.input.ownerAuthorization.policyVersion,
        resourcePolicyAllowed: false,
        resourcePolicyReference: query.input.ownerAuthorization.resourcePolicyReference,
        authzVersion: delegatedDecisionAuthzVersion(query.input, null, []),
        policyDecisionReference: '',
        reasonCode: 'AUTHORIZATION_DECISION_BINDING_MISMATCH'
      }
    } else {
      const [facts, permissions] = await Promise.all([
        this.principalRepository.resolveAuthorizationFacts({
          principalType: 'HUMAN',
          principalId: query.input.humanPrincipalId,
          scopeLevel: query.input.scopeLevel,
          tenantId: query.input.tenantId,
          requestedPermissionCodes: query.input.requestedPermissionCodes
        }),
        this.permissionRepository.findByCodes(query.input.requestedPermissionCodes)
      ])
      policyDecision = this.decisionPolicy.resolveDelegatedAuthorization(
        query.input,
        facts,
        permissions.map(toPermissionDecisionCatalogEntry)
      )
    }

    const result = { ...policyDecision, decisionReference }
    this.audit.emitIssuanceDecision({
      decisionType: 'DELEGATED_AUTHORIZATION',
      decisionReference,
      allowed: result.allowed,
      reasonCode: result.reasonCode,
      principalType: 'DELEGATED',
      principalId: query.input.humanPrincipalId,
      tenantId: query.input.tenantId,
      orgId: query.input.orgId,
      directWorkloadSpiffeId: query.caller.directWorkloadSpiffeId,
      certificateThumbprint: query.caller.certificateThumbprint,
      targetAudience: query.input.targetAudience,
      requestedPermissionCodes: query.input.requestedPermissionCodes,
      grantedPermissionCodes: result.allowedPermissionCodes,
      deniedPermissionCodes: result.deniedPermissionCodes,
      policyDecisionReference: result.policyDecisionReference,
      authzVersion: result.authzVersion,
      policyVersion: result.policyVersion,
      operationKey: query.input.operationKey,
      requestId: query.caller.requestId,
      traceId: query.caller.traceId
    })
    return result
  }
}
