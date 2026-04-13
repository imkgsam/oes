import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  getAuthenticatedGrpcRequestContext,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import { ManagementAuthorizationGuard } from '../guards'
import { RequireManagementPermission } from '../decorators'
import { MANAGEMENT_PERMISSION_CODES } from '../../common/constants/authorization'
import { CreatePolicyCommand } from '../../application/commands/policy/create-policy.command'
import { UpdatePolicyCommand } from '../../application/commands/policy/update-policy.command'
import { DeletePolicyCommand } from '../../application/commands/policy/delete-policy.command'
import { TogglePolicyCommand } from '../../application/commands/policy/toggle-policy.command'
import { AddPermissionPolicyCommand } from '../../application/commands/policy/add-permission-policy.command'
import { RemovePermissionPolicyCommand } from '../../application/commands/policy/remove-permission-policy.command'
import { GetPolicyByIdQuery } from '../../application/queries/policy/get-policy-by-id.query'
import { ListPoliciesPagedQuery } from '../../application/queries/policy/list-policies-paged.query'
import { ListPoliciesByPermissionQuery } from '../../application/queries/policy/list-policies-by-permission.query'
import { Policy } from '../../domain/aggregates/policy.aggregate'
import {
  AddPermissionPolicyRequest,
  PolicyResponse,
  RemovePermissionPolicyRequest,
  UpdatePolicyRequest,
  DeletePolicyRequest,
  TogglePolicyRequest,
  GetPolicyByIdRequest,
  ListPoliciesPagedRequest,
  ListPoliciesByPermissionRequest,
  ListPoliciesResponse,
  PagedPoliciesResponse,
  CreatePolicyRequest,
  PolicyManagementServiceControllerMethods,
  PolicyManagementServiceController
} from '@oes/common/generated/permission_service'
import { PermissionAuditService } from '../../application/services/permission-audit.service'

// Proto enum domain enum mapping tables
const EFFECT_MAP: Record<number, string> = { 1: 'ALLOW', 2: 'DENY' }
const SUBJECT_TYPE_MAP: Record<number, string> = { 1: 'ROLE', 2: 'ACCOUNT', 3: 'ANY' }

function mapEnum<T>(val: number | string | undefined, table: Record<number, string>): T {
  return (typeof val === 'number' ? (table[val] ?? val) : val) as T
}

function hasOwnField<T extends object>(obj: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

@Controller()
@UseFilters(GrpcExceptionFilter)
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, ManagementAuthorizationGuard)
@PolicyManagementServiceControllerMethods()
export class PolicyManagementGrpcController implements PolicyManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus,
    private readonly permissionAuditService: PermissionAuditService
  ) {}

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_POLICY)
  async createPolicy(
    request: CreatePolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const result: Policy = await this.commandBus.execute(
      new CreatePolicyCommand({
        name: request.name!,
        effect: mapEnum(request.effect, EFFECT_MAP),
        description: request.description || undefined,
        tenantId: request.tenantId || undefined,
        subjectType: mapEnum(request.subjectType, SUBJECT_TYPE_MAP),
        subjectId: request.subjectId || undefined,
        permissionCode: request.permissionCode!,
        resourceType: request.resourceType || undefined,
        priority: request.priority,
        conditionAstJson: request.conditionAstJson || undefined
      })
    )
    const response = this.toResponse(result)
    this.recordMutation(
      request,
      'POLICY_CREATED',
      'POLICY',
      result.id,
      result.permissionCode,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_POLICY)
  async updatePolicy(
    request: UpdatePolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const hasEffect = hasOwnField(request, 'effect')
    const hasSubjectType = hasOwnField(request, 'subjectType')
    const hasPriority = hasOwnField(request, 'priority')
    const result: Policy = await this.commandBus.execute(
      new UpdatePolicyCommand({
        id: request.id!,
        name: hasOwnField(request, 'name') ? request.name : undefined,
        effect: hasEffect ? mapEnum(request.effect, EFFECT_MAP) : undefined,
        description: hasOwnField(request, 'description') ? request.description : undefined,
        subjectType: hasSubjectType ? mapEnum(request.subjectType, SUBJECT_TYPE_MAP) : undefined,
        subjectId: hasOwnField(request, 'subjectId') ? request.subjectId : undefined,
        permissionCode: hasOwnField(request, 'permissionCode') ? request.permissionCode : undefined,
        resourceType: hasOwnField(request, 'resourceType') ? request.resourceType : undefined,
        priority: hasPriority ? request.priority : undefined,
        conditionAstJson: hasOwnField(request, 'conditionAstJson')
          ? request.conditionAstJson || ''
          : undefined
      })
    )
    const response = this.toResponse(result)
    this.recordMutation(
      request,
      'POLICY_UPDATED',
      'POLICY',
      result.id,
      result.permissionCode,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_POLICY)
  async deletePolicy(
    request: DeletePolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeletePolicyCommand(request.id!))
    this.recordMutation(request, 'POLICY_DELETED', 'POLICY', request.id!)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.UPDATE_POLICY)
  async togglePolicy(
    request: TogglePolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const result: Policy = await this.commandBus.execute(
      new TogglePolicyCommand(request.id!, request.isEnabled!)
    )
    const response = this.toResponse(result)
    this.recordMutation(
      request,
      request.isEnabled ? 'POLICY_ENABLED' : 'POLICY_DISABLED',
      'POLICY',
      result.id,
      result.permissionCode,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_POLICY)
  async getPolicyById(
    request: GetPolicyByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const result: Policy = await this.queryBus.execute(new GetPolicyByIdQuery(request.id!))
    return this.toResponse(result)
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_POLICY)
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
        keyword: request.keyword || undefined
      })
    )

    return {
      policies: result.policies.map((policy) => this.toResponse(policy)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.VIEW_POLICY)
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

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.CREATE_POLICY)
  async addPermissionPolicy(
    request: AddPermissionPolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const result: Policy = await this.commandBus.execute(
      new AddPermissionPolicyCommand({
        permissionCode: request.permissionCode!,
        name: request.name!,
        effect: mapEnum(request.effect, EFFECT_MAP),
        description: request.description || undefined,
        tenantId: request.tenantId || undefined,
        subjectType: mapEnum(request.subjectType, SUBJECT_TYPE_MAP),
        subjectId: request.subjectId || undefined,
        resourceType: request.resourceType || undefined,
        priority: request.priority,
        conditionAstJson: request.conditionAstJson || undefined
      })
    )
    const response = this.toResponse(result)
    this.recordMutation(
      request,
      'PERMISSION_POLICY_CREATED',
      'POLICY',
      result.id,
      result.permissionCode,
      response as unknown as Record<string, unknown>
    )
    return response
  }

  @RequireManagementPermission(MANAGEMENT_PERMISSION_CODES.DELETE_POLICY)
  async removePermissionPolicy(
    request: RemovePermissionPolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(
      new RemovePermissionPolicyCommand(request.permissionCode!, request.policyId!)
    )
    this.recordMutation(
      request,
      'PERMISSION_POLICY_REMOVED',
      'POLICY',
      request.policyId!,
      request.permissionCode!
    )
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

  private recordMutation(
    rpcData: unknown,
    action: string,
    targetType: 'POLICY',
    targetId: string,
    targetCode?: string,
    afterData?: Record<string, unknown>
  ): void {
    const authenticatedContext = getAuthenticatedGrpcRequestContext(rpcData)
    const operatorContext = authenticatedContext?.operatorContext
    const operatorId = operatorContext?.operator_id

    if (!operatorId) {
      return
    }

    this.permissionAuditService.emitManagementMutation({
      actorId: operatorId,
      tenantId: operatorContext?.tenant_id || undefined,
      action,
      targetType,
      targetId,
      targetCode,
      afterData,
      metadata: {
        request: (rpcData as Record<string, unknown>) ?? {}
      }
    })
  }
}
