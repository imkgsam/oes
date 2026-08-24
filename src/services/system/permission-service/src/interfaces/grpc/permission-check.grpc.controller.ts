import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { PermissionFoundationTrustedExecutionGuard } from '../../modules/authorization/permission-trusted-execution.module'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import {
  AuthorizeInternalCall,
  PERMISSION_INTERNAL_PERMISSION_CODES
} from '@oes/common/authorization'
import {
  BatchAuthorizationDecisionResponse,
  BatchCheckPermissionRequest
} from '@oes/common/generated/permission_service'
import { BatchCheckPermissionQuery } from '../../application/queries/authorization/batch-check-permission.query'
import { CheckPermissionQuery } from '../../application/queries/authorization/check-permission.query'
import { PermissionAuditService } from '../../application/services/permission-audit.service'
import {
  PermissionCheckServiceControllerMethods,
  PermissionCheckServiceController,
  CheckPermissionRequest,
  AuthorizationDecisionResponse
} from '@oes/common/generated/permission_service'
import {
  AuthorizationPrincipalTypeProto,
  AuthorizationScopeLevelProto,
  DelegatedRiskClassProto,
  DelegatedAuthorizationUpperBound,
  OwnerAuthorizationSnapshot,
  ResolveDelegatedAuthorizationRequest,
  ResolveDelegatedAuthorizationResponse,
  ResolveExternalMachineAuthorizationSnapshotRequest,
  ResolveExternalMachineAuthorizationSnapshotResponse,
  ResolvePrincipalAuthorizationRequest,
  ResolvePrincipalAuthorizationResponse,
  ResolveWorkloadIssuanceRequest,
  ResolveWorkloadIssuanceResponse
} from '@oes/common/generated/permission_service'
import { ResolveExternalMachineAuthorizationSnapshotQuery } from '../../application/queries/authorization/resolve-external-machine-authorization-snapshot.query'
import { ResolvePrincipalAuthorizationQuery } from '../../application/queries/authorization/resolve-principal-authorization.query'
import { ResolveWorkloadIssuanceQuery } from '../../application/queries/authorization/resolve-workload-issuance.query'
import { ResolveDelegatedAuthorizationQuery } from '../../application/queries/authorization/resolve-delegated-authorization.query'
import { PermissionDecisionTransport } from '../decorators'
import {
  getPermissionDecisionCallerContext,
  PermissionDecisionTransportGuard,
  PermissionTrustedInternalExecutionGuard
} from '../guards'
import {
  AuthorizationPrincipalType,
  AuthorizationScopeLevel,
  DelegatedRiskClass
} from '../../domain/authorization/permission-decision.types'

@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@UseFilters(GrpcExceptionFilter)
@PermissionCheckServiceControllerMethods()
export class PermissionCheckGrpcController implements PermissionCheckServiceController {
  constructor(
    private readonly queryBus: ValidatingQueryBus,
    private readonly permissionAuditService: PermissionAuditService
  ) {}

  /** Serves the legacy coarse RBAC check behind its existing internal-service gate. */
  @AuthorizeInternalCall({ all: ['permission.internal.permission.check'] })
  @UseGuards(PermissionFoundationTrustedExecutionGuard)
  async checkPermission(
    request: CheckPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AuthorizationDecisionResponse> {
    const allowed = await this.queryBus.execute(
      new CheckPermissionQuery(
        request.accountId!,
        request.permissionCode!,
        request.tenantId || undefined
      )
    )

    this.permissionAuditService.emitAuthorizationDecision({
      accountId: request.accountId!,
      permissionCode: request.permissionCode!,
      evaluationMode: 'RBAC',
      decision: allowed ? 'ALLOW' : 'DENY',
      tenantId: request.tenantId || undefined,
      reason: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED',
      requestContext: {}
    })

    return {
      allowed,
      evaluationMode: 1,
      matchedPolicy: '',
      reason: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED',
      explainCode: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED',
      matchedPolicyId: '',
      policyExplainEntries: []
    }
  }

  /** Serves the legacy batch RBAC check behind its existing internal-service gate. */
  @AuthorizeInternalCall({ all: ['permission.internal.permission.check'] })
  @UseGuards(PermissionFoundationTrustedExecutionGuard)
  async batchCheckPermission(
    request: BatchCheckPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<BatchAuthorizationDecisionResponse> {
    const decisions = await this.queryBus.execute(
      new BatchCheckPermissionQuery(
        (request.items ?? []).map((item) => ({
          requestId: item.requestId || undefined,
          accountId: item.accountId!,
          permissionCode: item.permissionCode!,
          tenantId: item.tenantId || undefined
        }))
      )
    )

    decisions.forEach((decision, index) => {
      const item = request.items?.[index]
      if (!item) {
        return
      }

      this.permissionAuditService.emitAuthorizationDecision({
        accountId: item.accountId!,
        permissionCode: item.permissionCode!,
        evaluationMode: 'RBAC',
        decision: decision.allowed ? 'ALLOW' : 'DENY',
        tenantId: item.tenantId || undefined,
        reason: decision.reason ?? undefined,
        requestContext: {
          requestId: item.requestId || ''
        }
      })
    })

    return {
      decisions: decisions.map((decision) => ({
        requestId: decision.requestId ?? '',
        allowed: decision.allowed,
        evaluationMode: 1,
        matchedPolicy: decision.matchedPolicy ?? '',
        reason: decision.reason ?? '',
        explainCode: decision.explainCode ?? ''
      }))
    }
  }

  /** Serves Auth's trusted, fail-closed snapshot of externally eligible Machine BUSINESS grants. */
  @AuthorizeInternalCall({ all: ['permission.internal.external_machine.snapshot.resolve'] })
  @UseGuards(PermissionTrustedInternalExecutionGuard)
  async resolveExternalMachineAuthorizationSnapshot(
    request: ResolveExternalMachineAuthorizationSnapshotRequest
  ): Promise<ResolveExternalMachineAuthorizationSnapshotResponse> {
    return this.queryBus.execute(
      new ResolveExternalMachineAuthorizationSnapshotQuery(
        request.integrationMachineId!,
        request.tenantId!
      )
    )
  }

  /** Maps the exact protected Auth principal request into the application decision boundary. */
  @AuthorizeInternalCall({
    all: [PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE]
  })
  @PermissionDecisionTransport({
    mode: 'PROTECTED',
    permissionCode: PERMISSION_INTERNAL_PERMISSION_CODES.PRINCIPAL_AUTHORIZATION_RESOLVE
  })
  @UseGuards(PermissionDecisionTransportGuard)
  async resolvePrincipalAuthorization(
    request: ResolvePrincipalAuthorizationRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ResolvePrincipalAuthorizationResponse> {
    const input = {
      principalType: toPrincipalType(request.principalType),
      principalId: request.principalId ?? '',
      scopeLevel: toScopeLevel(request.scopeLevel),
      ...optionalString('tenantId', request.tenantId),
      ...optionalString('orgId', request.orgId),
      targetAudience: request.targetAudience ?? '',
      requestedPermissionCodes: request.requestedBusinessPermissionCodes ?? [],
      ...optionalString('sessionReference', request.sessionReference),
      ...optionalString('securityReference', request.securityReference),
      ...(request.delegatedUpperBound
        ? { delegatedUpperBound: mapDelegatedUpperBound(request.delegatedUpperBound) }
        : {})
    }
    const result = await this.queryBus.execute(
      new ResolvePrincipalAuthorizationQuery(input, getPermissionDecisionCallerContext(request))
    )
    return {
      allowed: result.allowed,
      grantedPermissionCodes: result.grantedPermissionCodes,
      deniedPermissionCodes: result.deniedPermissionCodes,
      principalType: request.principalType,
      principalId: request.principalId ?? '',
      scopeLevel: request.scopeLevel,
      tenantId: request.tenantId ?? '',
      orgId: request.orgId ?? '',
      targetAudience: request.targetAudience ?? '',
      requestedPermissionCodes: request.requestedBusinessPermissionCodes ?? [],
      decisionReference: result.decisionReference,
      authzVersion: result.authzVersion,
      reasonCode: result.reasonCode
    }
  }

  /** Maps the sole exact-Auth mTLS bootstrap request without requiring or reading an ExecutionToken. */
  @PermissionDecisionTransport({ mode: 'BOOTSTRAP' })
  @UseGuards(PermissionDecisionTransportGuard)
  async resolveWorkloadIssuance(
    request: ResolveWorkloadIssuanceRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ResolveWorkloadIssuanceResponse> {
    const input = {
      originalWorkloadSpiffeId: request.originalWorkloadSpiffeId ?? '',
      targetAudience: request.targetAudience ?? '',
      requestedPermissionCodes: request.requestedInternalPermissionCodes ?? [],
      scopeLevel: toScopeLevel(request.scopeLevel),
      ...optionalString('tenantId', request.tenantId),
      ...optionalString('orgId', request.orgId),
      principalType: toPrincipalType(request.principalType),
      principalId: request.principalId ?? '',
      issuancePolicyVersion: request.issuancePolicyVersion ?? ''
    }
    const result = await this.queryBus.execute(
      new ResolveWorkloadIssuanceQuery(input, getPermissionDecisionCallerContext(request))
    )
    return {
      allowed: result.allowed,
      grantedPermissionCodes: result.grantedPermissionCodes,
      deniedPermissionCodes: result.deniedPermissionCodes,
      originalWorkloadSpiffeId: request.originalWorkloadSpiffeId ?? '',
      targetAudience: request.targetAudience ?? '',
      scopeLevel: request.scopeLevel,
      tenantId: request.tenantId ?? '',
      orgId: request.orgId ?? '',
      principalType: request.principalType,
      principalId: request.principalId ?? '',
      requestedPermissionCodes: request.requestedInternalPermissionCodes ?? [],
      decisionReference: result.decisionReference,
      authzVersion: result.authzVersion,
      reasonCode: result.reasonCode
    }
  }

  /** Maps owner-derived delegated snapshots into the protected application decision boundary. */
  @AuthorizeInternalCall({
    all: [PERMISSION_INTERNAL_PERMISSION_CODES.DELEGATED_AUTHORIZATION_RESOLVE]
  })
  @PermissionDecisionTransport({
    mode: 'PROTECTED',
    permissionCode: PERMISSION_INTERNAL_PERMISSION_CODES.DELEGATED_AUTHORIZATION_RESOLVE
  })
  @UseGuards(PermissionDecisionTransportGuard)
  async resolveDelegatedAuthorization(
    request: ResolveDelegatedAuthorizationRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ResolveDelegatedAuthorizationResponse> {
    const input = {
      humanPrincipalId: request.humanPrincipalId ?? '',
      scopeLevel: toScopeLevel(request.scopeLevel),
      ...optionalString('tenantId', request.tenantId),
      ...optionalString('orgId', request.orgId),
      targetAudience: request.targetAudience ?? '',
      operationKey: request.operationKey ?? '',
      requestedPermissionCodes: request.requestedPermissionCodes ?? [],
      delegatedUpperBound: mapDelegatedUpperBound(request.delegatedUpperBound),
      ownerAuthorization: mapOwnerAuthorization(request.ownerAuthorization)
    }
    const result = await this.queryBus.execute(
      new ResolveDelegatedAuthorizationQuery(input, getPermissionDecisionCallerContext(request))
    )
    return {
      allowed: result.allowed,
      allowedPermissionCodes: result.allowedPermissionCodes,
      deniedPermissionCodes: result.deniedPermissionCodes,
      riskClass: toRiskClassProto(result.riskClass),
      policyVersion: result.policyVersion,
      tenantId: request.tenantId ?? '',
      orgId: request.orgId ?? '',
      resourcePolicyAllowed: result.resourcePolicyAllowed,
      resourcePolicyReference: result.resourcePolicyReference,
      decisionReference: result.decisionReference,
      authzVersion: result.authzVersion,
      reasonCode: result.reasonCode
    }
  }
}

/** Converts generated principal enums into explicit domain values and preserves invalid input as unspecified. */
function toPrincipalType(value?: AuthorizationPrincipalTypeProto): AuthorizationPrincipalType {
  if (value === AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_HUMAN) {
    return 'HUMAN'
  }
  if (value === AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_MACHINE) {
    return 'MACHINE'
  }
  if (value === AuthorizationPrincipalTypeProto.AUTHORIZATION_PRINCIPAL_TYPE_PROTO_DELEGATED) {
    return 'DELEGATED'
  }
  return '' as AuthorizationPrincipalType
}

/** Converts generated scope enums into explicit domain values and preserves invalid input as unspecified. */
function toScopeLevel(value?: AuthorizationScopeLevelProto): AuthorizationScopeLevel {
  if (value === AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_SYSTEM) return 'SYSTEM'
  if (value === AuthorizationScopeLevelProto.AUTHORIZATION_SCOPE_LEVEL_PROTO_TENANT) return 'TENANT'
  return '' as AuthorizationScopeLevel
}

/** Converts one generated upper-bound snapshot without interpreting owner truth in the interface layer. */
function mapDelegatedUpperBound(input?: DelegatedAuthorizationUpperBound) {
  return {
    humanPrincipalId: input?.humanPrincipalId ?? '',
    sessionReference: input?.sessionReference ?? '',
    securityReference: input?.securityReference ?? '',
    delegationReference: input?.delegationReference ?? '',
    delegationVersion: input?.delegationVersion ?? '',
    delegationActive: input?.delegationActive ?? false,
    delegationPermissionCodes: input?.delegationPermissionCodes ?? [],
    agentPrincipalReference: input?.agentPrincipalReference ?? '',
    agentPrincipalVersion: input?.agentPrincipalVersion ?? '',
    agentPrincipalActive: input?.agentPrincipalActive ?? false,
    agentPermissionCodes: input?.agentPermissionCodes ?? [],
    toolContractReference: input?.toolContractReference ?? '',
    toolContractVersion: input?.toolContractVersion ?? '',
    toolContractActive: input?.toolContractActive ?? false,
    toolPermissionCodes: input?.toolPermissionCodes ?? []
  }
}

/** Converts one owner snapshot into domain values without accepting unspecified risk as a valid class. */
function mapOwnerAuthorization(input?: OwnerAuthorizationSnapshot) {
  return {
    actionReference: input?.actionReference ?? '',
    policyReference: input?.policyReference ?? '',
    policyVersion: input?.policyVersion ?? '',
    current: input?.current ?? false,
    permissionCodes: input?.permissionCodes ?? [],
    codeRiskBaseline: toRiskClass(input?.codeRiskBaseline),
    effectiveRiskClass: toRiskClass(input?.effectiveRiskClass),
    resourcePolicyAllowed: input?.resourcePolicyAllowed ?? false,
    resourcePolicyReference: input?.resourcePolicyReference ?? ''
  }
}

/** Converts generated risk enums into explicit domain values and makes unspecified input fail closed. */
function toRiskClass(value?: DelegatedRiskClassProto): DelegatedRiskClass {
  if (value === DelegatedRiskClassProto.DELEGATED_RISK_CLASS_PROTO_DELEGATION_ALLOWED) {
    return 'DELEGATION_ALLOWED'
  }
  if (value === DelegatedRiskClassProto.DELEGATED_RISK_CLASS_PROTO_ACTION_GRANT_REQUIRED) {
    return 'ACTION_GRANT_REQUIRED'
  }
  return 'AI_FORBIDDEN'
}

/** Converts domain risk values into generated response enums. */
function toRiskClassProto(value: DelegatedRiskClass): DelegatedRiskClassProto {
  if (value === 'DELEGATION_ALLOWED') {
    return DelegatedRiskClassProto.DELEGATED_RISK_CLASS_PROTO_DELEGATION_ALLOWED
  }
  if (value === 'ACTION_GRANT_REQUIRED') {
    return DelegatedRiskClassProto.DELEGATED_RISK_CLASS_PROTO_ACTION_GRANT_REQUIRED
  }
  return DelegatedRiskClassProto.DELEGATED_RISK_CLASS_PROTO_AI_FORBIDDEN
}

/** Copies one non-empty generated optional string into a domain input property. */
function optionalString(name: string, value?: string): Record<string, string> {
  return value ? { [name]: value } : {}
}
