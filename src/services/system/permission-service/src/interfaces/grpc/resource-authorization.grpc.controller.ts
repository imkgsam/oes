import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { AuthorizeInternalCall } from '@oes/common/authorization'
import { PermissionFoundationTrustedExecutionGuard } from '../../modules/authorization/permission-trusted-execution.module'
import { Metadata } from '@grpc/grpc-js'
import { GrpcMethod } from '@nestjs/microservices'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import { ResourceAuthorizationService } from '../../application/authorization/resource-authorization.service'
import {
  AuthorizationSubjectFacts,
  EnvironmentFacts,
  PolicyDecisionTrace,
  QueryScopeExpression,
  QueryScopeOperator,
  ResourceFacts
} from '../../application/authorization/resource-policy'

interface AuthorizationSubjectFactsProto {
  accountId?: string
  tenantId?: string
  roleIds?: string[]
  roleCodes?: string[]
  orgIds?: string[]
  visibleOrgIds?: string[]
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

interface CheckResourceGrpcRequest {
  subject?: AuthorizationSubjectFactsProto
  permissionCode?: string
  resource?: ResourceFactsProto
  environment?: EnvironmentFactsProto
}

interface BuildQueryScopeGrpcRequest {
  subject?: AuthorizationSubjectFactsProto
  permissionCode?: string
  resourceType?: string
  environment?: EnvironmentFactsProto
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

interface ResourceAuthorizationGrpcResponse {
  allowed?: boolean
  reasonCode?: string
  matchedPolicyIds?: string[]
  deniedPolicyIds?: string[]
  scope?: QueryScopeExpressionProto
  trace?: PolicyDecisionTraceProto
}

const QUERY_SCOPE_OPERATOR_EQ = 1
const QUERY_SCOPE_OPERATOR_IN = 2
const QUERY_SCOPE_OPERATOR_INTERSECTS = 3

const QUERY_SCOPE_OPERATOR_TO_PROTO: Record<QueryScopeOperator, number> = {
  EQ: QUERY_SCOPE_OPERATOR_EQ,
  IN: QUERY_SCOPE_OPERATOR_IN,
  INTERSECTS: QUERY_SCOPE_OPERATOR_INTERSECTS
}

/** ResourceAuthorizationGrpcController exposes runtime resource authorization for internal service callers. */
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(PermissionFoundationTrustedExecutionGuard)
export class ResourceAuthorizationGrpcController {
  constructor(private readonly resourceAuthorization: ResourceAuthorizationService) {}

  /** checkResource maps wire facts to the application facade for single-resource authorization. */
  @GrpcMethod('ResourceAuthorizationService', 'checkResource')
  @AuthorizeInternalCall({ all: ['permission.internal.resource.check'] })
  async checkResource(
    request: CheckResourceGrpcRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ResourceAuthorizationGrpcResponse> {
    const result = await this.resourceAuthorization.checkResource({
      subject: this.toSubjectFacts(request.subject),
      permissionCode: request.permissionCode || '',
      resource: this.toResourceFacts(request.resource),
      environment: this.toEnvironmentFacts(request.environment)
    })

    return this.compact({
      allowed: result.allowed,
      reasonCode: result.reasonCode,
      matchedPolicyIds: result.matchedPolicyIds ?? [],
      deniedPolicyIds: result.deniedPolicyIds ?? [],
      trace: this.toTraceProto(result.trace)
    })
  }

  /** buildQueryScope maps wire facts to a structured scope response for repository adapters. */
  @GrpcMethod('ResourceAuthorizationService', 'buildQueryScope')
  @AuthorizeInternalCall({ all: ['permission.internal.query_scope.build'] })
  async buildQueryScope(
    request: BuildQueryScopeGrpcRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ResourceAuthorizationGrpcResponse> {
    const result = await this.resourceAuthorization.buildQueryScope({
      subject: this.toSubjectFacts(request.subject),
      permissionCode: request.permissionCode || '',
      resourceType: request.resourceType || '',
      environment: this.toEnvironmentFacts(request.environment)
    })

    return this.compact({
      allowed: result.allowed,
      reasonCode: result.reasonCode,
      matchedPolicyIds: result.matchedPolicyIds ?? [],
      deniedPolicyIds: result.deniedPolicyIds ?? [],
      scope: this.toQueryScopeProto(result.scope),
      trace: this.toTraceProto(result.trace)
    })
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

  private toQueryScopeProto(scope?: QueryScopeExpression): QueryScopeExpressionProto | undefined {
    if (!scope) {
      return undefined
    }

    const value = Array.isArray(scope.value) ? undefined : scope.value
    const values = Array.isArray(scope.value) ? scope.value : []

    return this.compact({
      and: scope.and?.map((item) => this.toQueryScopeProto(item)!).filter(Boolean),
      or: scope.or?.map((item) => this.toQueryScopeProto(item)!).filter(Boolean),
      field: scope.field,
      op: scope.op ? QUERY_SCOPE_OPERATOR_TO_PROTO[scope.op] : undefined,
      value,
      values
    }) as QueryScopeExpressionProto
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
      Object.entries(value).filter(
        ([, entry]) =>
          entry !== undefined &&
          entry !== ''
      )
    ) as T
  }
}
