import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { AuthorizeBusinessRpc } from '@oes/common/authorization'
import { PermissionFoundationTrustedExecutionGuard } from '../../modules/authorization/permission-trusted-execution.module'
import { Metadata } from '@grpc/grpc-js'
import { GrpcMethod } from '@nestjs/microservices'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import { ManagementAuthorizationGuard } from '../guards'
import { RequireManagementPermission } from '../decorators'
import { MANAGEMENT_PERMISSION_CODES } from '../../common/constants/authorization'
import { PolicyInstancePreviewService } from '../../application/authorization/policy-instance-preview.service'
import {
  AuthorizationSubjectFacts,
  EnvironmentFacts,
  PolicyDecisionTrace,
  PolicyInstance,
  QueryScopeExpression,
  QueryScopeOperator,
  ResourceFacts,
  SubjectSelector
} from '../../application/authorization/resource-policy'

interface AuthorizationSubjectFactsProto {
  accountId?: string
  tenantId?: string
  roleIds?: string[]
  roleCodes?: string[]
  orgIds?: string[]
  visibleOrgIds?: string[]
}

interface PolicyInstanceSubjectSelectorProto {
  type?: number
  accountId?: string
  roleId?: string
}

interface PolicyInstanceWorkingWindowProto {
  days?: number[]
  start?: string
  end?: string
}

interface PolicyInstanceParamsProto {
  field?: string
  allowedValues?: string[]
  value?: string
  resourceField?: string
  subjectField?: string
  ownerField?: string
  orgField?: string
  timezone?: string
  windows?: PolicyInstanceWorkingWindowProto[]
  cidrs?: string[]
}

interface ResourceFactsProto {
  tenantId?: string
  resourceType?: string
  resourceId?: string
  ownerAccountId?: string
  responsibleBuyerAccountId?: string
  managerAccountId?: string
  orgId?: string
  categoryId?: string
  customerId?: string
  supplierId?: string
  factoryId?: string
  plantId?: string
  workshopId?: string
  productionLineId?: string
  workCenterId?: string
  warehouseId?: string
  storageLocationId?: string
  attributes?: Record<string, string>
}

interface EnvironmentFactsProto {
  clientIp?: string
  requestTime?: string
  timezone?: string
  terminal?: string
}

interface PolicyInstancePreviewCandidateProto {
  id?: string
  tenantId?: string
  subjectSelector?: PolicyInstanceSubjectSelectorProto
  permissionCode?: string
  resourceType?: string
  templateCode?: string
  effect?: number
  params?: PolicyInstanceParamsProto
  enabled?: boolean
  priority?: number
}

interface QueryScopeExpressionProto {
  and?: QueryScopeExpressionProto[]
  or?: QueryScopeExpressionProto[]
  field?: string
  op?: number
  value?: string
  values?: string[]
}

interface PolicyDecisionTraceProto {
  evaluatedPolicyIds?: string[]
  matchedAllowPolicyIds?: string[]
  matchedDenyPolicyIds?: string[]
  skippedPolicyIds?: string[]
  reasonCode?: string
}

interface EvaluatePolicyInstancePreviewRequest {
  mode?: number
  subject?: AuthorizationSubjectFactsProto
  permissionCode?: string
  resourceType?: string
  resource?: ResourceFactsProto
  environment?: EnvironmentFactsProto
  policyInstances?: PolicyInstancePreviewCandidateProto[]
}

interface EvaluatePolicyInstancePreviewResponse {
  allowed?: boolean
  reasonCode?: string
  matchedPolicyIds?: string[]
  deniedPolicyIds?: string[]
  scope?: QueryScopeExpressionProto
  trace?: PolicyDecisionTraceProto
}

const POLICY_INSTANCE_PREVIEW_MODE_CHECK_RESOURCE = 1
const POLICY_INSTANCE_PREVIEW_MODE_QUERY_SCOPE = 2
const POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ACCOUNT = 1
const POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ROLE = 2
const POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_TENANT_WIDE = 3
const POLICY_INSTANCE_EFFECT_ALLOW = 1
const POLICY_INSTANCE_EFFECT_DENY = 2
const QUERY_SCOPE_OPERATOR_EQ = 1
const QUERY_SCOPE_OPERATOR_IN = 2
const QUERY_SCOPE_OPERATOR_INTERSECTS = 3

const EFFECT_MAP: Record<number, PolicyInstance['effect']> = {
  [POLICY_INSTANCE_EFFECT_ALLOW]: 'ALLOW',
  [POLICY_INSTANCE_EFFECT_DENY]: 'DENY'
}

const SUBJECT_SELECTOR_MAP: Record<number, SubjectSelector['type']> = {
  [POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ACCOUNT]: 'ACCOUNT',
  [POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ROLE]: 'ROLE',
  [POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_TENANT_WIDE]: 'TENANT_WIDE'
}

const QUERY_SCOPE_OPERATOR_TO_PROTO: Record<QueryScopeOperator, number> = {
  EQ: QUERY_SCOPE_OPERATOR_EQ,
  IN: QUERY_SCOPE_OPERATOR_IN,
  INTERSECTS: QUERY_SCOPE_OPERATOR_INTERSECTS
}

/** PolicyInstancePreviewGrpcController exposes a management-only preview path for template-based policy instances. */
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(PermissionFoundationTrustedExecutionGuard)
export class PolicyInstancePreviewGrpcController {
  constructor(private readonly previewService: PolicyInstancePreviewService) {}

  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  @GrpcMethod('PolicyInstancePreviewService', 'evaluatePolicyInstancePreview')
  async evaluatePolicyInstancePreview(
    request: EvaluatePolicyInstancePreviewRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<EvaluatePolicyInstancePreviewResponse> {
    const policyInstances = (request.policyInstances ?? []).map((policy) =>
      this.toPolicyInstance(policy)
    )

    if (
      request.mode ===
      POLICY_INSTANCE_PREVIEW_MODE_QUERY_SCOPE
    ) {
      const result = await this.previewService.evaluateQueryScope({
        policyInstances,
        request: {
          subject: this.toSubjectFacts(request.subject),
          permissionCode: request.permissionCode!,
          resourceType: request.resourceType!,
          environment: this.toEnvironmentFacts(request.environment)
        }
      })

      return {
        allowed: result.allowed,
        reasonCode: result.reasonCode,
        matchedPolicyIds: result.matchedPolicyIds ?? [],
        deniedPolicyIds: result.deniedPolicyIds ?? [],
        scope: this.toQueryScopeProto(result.scope),
        trace: this.toTraceProto(result.trace)
      }
    }

    const resource = this.toResourceFacts(request.resource)
    const result = await this.previewService.evaluateResource({
      policyInstances,
      request: {
        subject: this.toSubjectFacts(request.subject),
        permissionCode: request.permissionCode!,
        resource: {
          ...resource,
          resourceType: resource.resourceType || request.resourceType!
        },
        environment: this.toEnvironmentFacts(request.environment)
      }
    })

    return {
      allowed: result.allowed,
      reasonCode: result.reasonCode,
      matchedPolicyIds: result.matchedPolicyIds ?? [],
      deniedPolicyIds: result.deniedPolicyIds ?? [],
      trace: this.toTraceProto(result.trace)
    }
  }

  private toPolicyInstance(policy: any): PolicyInstance {
    const tenantId = policy.tenantId || ''
    const effect = EFFECT_MAP[policy.effect ?? 0]

    if (!effect) {
      throw new Error('POLICY_INSTANCE_PREVIEW_INVALID_EFFECT')
    }

    return {
      id: policy.id || `preview-${policy.templateCode || 'policy-instance'}`,
      tenantId,
      subjectSelector: this.toSubjectSelector(policy.subjectSelector),
      permissionCode: policy.permissionCode || '',
      resourceType: policy.resourceType || undefined,
      templateCode: policy.templateCode || '',
      effect,
      params: this.toParams(policy.params),
      enabled: policy.enabled ?? true,
      priority: policy.priority ?? 0,
      createdBy: 'preview',
      updatedBy: 'preview',
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z'
    }
  }

  private toSubjectSelector(selector?: PolicyInstanceSubjectSelectorProto): SubjectSelector {
    const type = SUBJECT_SELECTOR_MAP[selector?.type ?? 0]

    if (!type) {
      throw new Error('POLICY_INSTANCE_PREVIEW_INVALID_SUBJECT_SELECTOR')
    }

    return {
      type,
      accountId: selector?.accountId || undefined,
      roleId: selector?.roleId || undefined
    }
  }

  private toSubjectFacts(subject?: AuthorizationSubjectFactsProto): AuthorizationSubjectFacts {
    return {
      accountId: subject?.accountId || '',
      tenantId: subject?.tenantId || '',
      roleIds: subject?.roleIds ?? [],
      roleCodes: subject?.roleCodes ?? [],
      orgIds: subject?.orgIds ?? [],
      visibleOrgIds: subject?.visibleOrgIds ?? []
    }
  }

  private toResourceFacts(resource?: ResourceFactsProto): ResourceFacts {
    return this.compact({
      tenantId: resource?.tenantId || '',
      resourceType: resource?.resourceType || '',
      resourceId: resource?.resourceId,
      ownerAccountId: resource?.ownerAccountId,
      responsibleBuyerAccountId: resource?.responsibleBuyerAccountId,
      managerAccountId: resource?.managerAccountId,
      orgId: resource?.orgId,
      categoryId: resource?.categoryId,
      customerId: resource?.customerId,
      supplierId: resource?.supplierId,
      factoryId: resource?.factoryId,
      plantId: resource?.plantId,
      workshopId: resource?.workshopId,
      productionLineId: resource?.productionLineId,
      workCenterId: resource?.workCenterId,
      warehouseId: resource?.warehouseId,
      storageLocationId: resource?.storageLocationId,
      attributes: resource?.attributes
    }) as ResourceFacts
  }

  private toEnvironmentFacts(environment?: EnvironmentFactsProto): EnvironmentFacts | undefined {
    if (!environment) {
      return undefined
    }

    return this.compact({
      clientIp: environment.clientIp,
      requestTime: environment.requestTime,
      timezone: environment.timezone,
      terminal: environment.terminal
    }) as EnvironmentFacts
  }

  private toParams(params?: PolicyInstanceParamsProto): Record<string, unknown> {
    return this.compact({
      field: params?.field,
      allowedValues: params?.allowedValues?.length ? params.allowedValues : undefined,
      value: params?.value,
      resourceField: params?.resourceField,
      subjectField: params?.subjectField,
      ownerField: params?.ownerField,
      orgField: params?.orgField,
      timezone: params?.timezone,
      windows: params?.windows?.length ? params.windows : undefined,
      cidrs: params?.cidrs?.length ? params.cidrs : undefined
    })
  }

  private toQueryScopeProto(scope?: QueryScopeExpression): QueryScopeExpressionProto | undefined {
    if (!scope) {
      return undefined
    }

    const value = Array.isArray(scope.value) ? undefined : scope.value
    const values = Array.isArray(scope.value) ? scope.value : []

    return {
      and: scope.and?.map((item) => this.toQueryScopeProto(item)!).filter(Boolean),
      or: scope.or?.map((item) => this.toQueryScopeProto(item)!).filter(Boolean),
      field: scope.field,
      op: scope.op ? QUERY_SCOPE_OPERATOR_TO_PROTO[scope.op] : undefined,
      value,
      values
    }
  }

  private toTraceProto(trace?: PolicyDecisionTrace): PolicyDecisionTraceProto | undefined {
    if (!trace) {
      return undefined
    }

    return {
      evaluatedPolicyIds: trace.evaluatedPolicyIds,
      matchedAllowPolicyIds: trace.matchedAllowPolicyIds,
      matchedDenyPolicyIds: trace.matchedDenyPolicyIds,
      skippedPolicyIds: trace.skippedPolicyIds ?? [],
      reasonCode: trace.reasonCode
    }
  }

  private compact<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== '')
    ) as T
  }
}
