import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { AuthorizeBusinessRpc } from '@oes/common/authorization'
import { PermissionFoundationTrustedExecutionGuard } from '../../modules/authorization/permission-trusted-execution.module'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import { ManagementAuthorizationGuard } from '../guards'
import { RequireManagementPermission } from '../decorators'
import { MANAGEMENT_PERMISSION_CODES } from '../../common/constants/authorization'
import { GetPolicyByIdQuery } from '../../application/queries/policy/get-policy-by-id.query'
import { ListPoliciesPagedQuery } from '../../application/queries/policy/list-policies-paged.query'
import { ListPoliciesByPermissionQuery } from '../../application/queries/policy/list-policies-by-permission.query'
import { Policy } from '../../domain/aggregates/policy.aggregate'
import {
  PolicyResponse,
  GetPolicyByIdRequest,
  ListPoliciesPagedRequest,
  ListPoliciesByPermissionRequest,
  ListPoliciesResponse,
  PagedPoliciesResponse,
  PolicyManagementServiceControllerMethods,
  PolicyManagementServiceController
} from '@oes/common/generated/permission_service'

// Proto enum domain enum mapping tables
const SUBJECT_TYPE_MAP: Record<number, string> = { 1: 'ROLE', 2: 'ACCOUNT', 3: 'ANY' }

function mapEnum<T>(val: number | string | undefined, table: Record<number, string>): T {
  return (typeof val === 'number' ? (table[val] ?? val) : val) as T
}

function hasOwnField<T extends object>(obj: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(PermissionFoundationTrustedExecutionGuard)
@PolicyManagementServiceControllerMethods()
export class PolicyManagementGrpcController implements PolicyManagementServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  async getPolicyById(
    request: GetPolicyByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const result: Policy = await this.queryBus.execute(new GetPolicyByIdQuery(request.id!))
    return this.toResponse(result)
  }

  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  async listPoliciesPaged(
    request: ListPoliciesPagedRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PagedPoliciesResponse> {
    const hasIsEnabled = Object.prototype.hasOwnProperty.call(request, 'isEnabled')

    const result: {
      policies: Policy[]
      total: number
      page: number
      pageSize: number
    } = await this.queryBus.execute(
      new ListPoliciesPagedQuery({
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        tenantId: request.tenantId || undefined,
        permissionCode: request.permissionCode || undefined,
        isEnabled: hasIsEnabled ? request.isEnabled : undefined,
        keyword: request.keyword || undefined,
        subjectType: hasOwnField(request, 'subjectType')
          ? mapEnum(request.subjectType, SUBJECT_TYPE_MAP)
          : undefined,
        subjectId: hasOwnField(request, 'subjectId') ? request.subjectId || undefined : undefined
      })
    )

    return {
      policies: result.policies.map((policy) => this.toResponse(policy)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  async listPoliciesByPermission(
    request: ListPoliciesByPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPoliciesResponse> {
    const list: Policy[] = await this.queryBus.execute(
      new ListPoliciesByPermissionQuery(request.permissionCode!, request.tenantId || undefined)
    )
    return { policies: list.map((p) => this.toResponse(p)) }
  }

  // ---- Mapping ----

  private toResponse(p: Policy): PolicyResponse {
    return {
      id: p.id,
      name: p.name,
      effect: p.effect as any,
      description: p.description ?? '',
      tenantId: p.tenantId ?? '',
      subjectType: p.subjectType as any,
      subjectId: p.subjectId ?? '',
      permissionCode: p.permissionCode,
      resourceType: p.resourceType ?? '',
      priority: p.priority,
      isEnabled: p.isEnabled,
      conditionAstJson: p.conditionAstJson ?? ''
    }
  }
}
