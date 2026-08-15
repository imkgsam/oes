import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { AuthorizeBusinessRpc } from '@oes/common/authorization'
import { PermissionFoundationTrustedExecutionGuard } from '../../modules/authorization/permission-trusted-execution.module'
import { Metadata } from '@grpc/grpc-js'
import { GrpcMethod } from '@nestjs/microservices'
import {
  AuthenticatedOperatorGuard,
  getAuthenticatedGrpcRequestContext,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import { MANAGEMENT_PERMISSION_CODES } from '../../common/constants/authorization'
import { PolicyInstanceManagementService } from '../../application/authorization/policy-instance-management.service'
import { PolicyInstance } from '../../application/authorization/resource-policy'
import { RequireManagementPermission } from '../decorators'
import { ManagementAuthorizationGuard } from '../guards'

interface ListPolicyInstancesRequest {
  page?: number
  pageSize?: number
  tenantId?: string
  permissionCode?: string
  resourceType?: string
  templateCode?: string
  subjectSelectorType?: number
  subjectSelectorValue?: string
  hasEnabledFilter?: boolean
  enabled?: boolean
}

interface GetPolicyInstanceRequest {
  id?: string
}

interface CreatePolicyInstanceRequest {
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

interface SetPolicyInstanceEnabledRequest {
  id?: string
  enabled?: boolean
}

interface PolicyInstanceSubjectSelectorProto {
  type?: number
  accountId?: string
  roleId?: string
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
  cidrs?: string[]
}

interface PolicyInstanceManagementRecordProto {
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
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

interface ListPolicyInstancesResponse {
  policyInstances?: PolicyInstanceManagementRecordProto[]
  total?: number
  page?: number
  pageSize?: number
}

const POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ACCOUNT = 1
const POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ROLE = 2
const POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_TENANT_WIDE = 3
const POLICY_INSTANCE_EFFECT_ALLOW = 1
const POLICY_INSTANCE_EFFECT_DENY = 2

const SUBJECT_SELECTOR_TO_PROTO: Record<PolicyInstance['subjectSelector']['type'], number> = {
  ACCOUNT: POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ACCOUNT,
  ROLE: POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ROLE,
  TENANT_WIDE: POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_TENANT_WIDE
}

const SUBJECT_SELECTOR_FROM_PROTO: Record<number, PolicyInstance['subjectSelector']['type']> = {
  [POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ACCOUNT]: 'ACCOUNT',
  [POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_ROLE]: 'ROLE',
  [POLICY_INSTANCE_SUBJECT_SELECTOR_TYPE_TENANT_WIDE]: 'TENANT_WIDE'
}

const EFFECT_TO_PROTO: Record<PolicyInstance['effect'], number> = {
  ALLOW: POLICY_INSTANCE_EFFECT_ALLOW,
  DENY: POLICY_INSTANCE_EFFECT_DENY
}

const EFFECT_FROM_PROTO: Record<number, PolicyInstance['effect']> = {
  [POLICY_INSTANCE_EFFECT_ALLOW]: 'ALLOW',
  [POLICY_INSTANCE_EFFECT_DENY]: 'DENY'
}

/** PolicyInstanceManagementGrpcController exposes controlled management operations for PolicyInstance facts. */
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(PermissionFoundationTrustedExecutionGuard)
export class PolicyInstanceManagementGrpcController {
  constructor(private readonly managementService: PolicyInstanceManagementService) {}

  /** createPolicyInstance persists one template-based PolicyInstance fact. */
  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.CREATE_POLICY] })
  @GrpcMethod('PolicyInstanceManagementService', 'createPolicyInstance')
  async createPolicyInstance(
    request: CreatePolicyInstanceRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyInstanceManagementRecordProto> {
    return this.toPolicyInstanceProto(
      await this.managementService.create({
        tenantId: request.tenantId || '',
        subjectSelector: this.fromSubjectSelectorProto(request.subjectSelector),
        permissionCode: request.permissionCode || '',
        resourceType: request.resourceType || undefined,
        templateCode: request.templateCode || '',
        effect: EFFECT_FROM_PROTO[request.effect ?? 0] ?? 'ALLOW',
        params: this.fromParamsProto(request.params),
        enabled: request.enabled ?? true,
        priority: request.priority ?? 0,
        operatorId: this.getOperatorId(request)
      })
    )
  }

  /** getPolicyInstance returns one template-based PolicyInstance by id. */
  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  @GrpcMethod('PolicyInstanceManagementService', 'getPolicyInstance')
  async getPolicyInstance(
    request: GetPolicyInstanceRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyInstanceManagementRecordProto> {
    return this.toPolicyInstanceProto(await this.managementService.getById(request.id || ''))
  }

  /** listPolicyInstances returns paged template-based PolicyInstance records for governance views. */
  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  @GrpcMethod('PolicyInstanceManagementService', 'listPolicyInstances')
  async listPolicyInstances(
    request: ListPolicyInstancesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPolicyInstancesResponse> {
    const result = await this.managementService.list({
      tenantId: request.tenantId || undefined,
      permissionCode: request.permissionCode || undefined,
      resourceType: request.resourceType || undefined,
      templateCode: request.templateCode || undefined,
      subjectSelectorType: request.subjectSelectorType
        ? SUBJECT_SELECTOR_FROM_PROTO[request.subjectSelectorType]
        : undefined,
      subjectSelectorValue: request.subjectSelectorValue || undefined,
      enabled: request.hasEnabledFilter ? request.enabled ?? false : undefined,
      page: request.page,
      pageSize: request.pageSize
    })

    return {
      policyInstances: result.items.map((item) => this.toPolicyInstanceProto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }

  /** setPolicyInstanceEnabled enables or disables one persisted PolicyInstance fact. */
  @AuthorizeBusinessRpc({ all: [MANAGEMENT_PERMISSION_CODES.UPDATE_POLICY] })
  @GrpcMethod('PolicyInstanceManagementService', 'setPolicyInstanceEnabled')
  async setPolicyInstanceEnabled(
    request: SetPolicyInstanceEnabledRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyInstanceManagementRecordProto> {
    return this.toPolicyInstanceProto(
      await this.managementService.setEnabled({
        id: request.id || '',
        enabled: request.enabled ?? false,
        operatorId: this.getOperatorId(request)
      })
    )
  }

  private toPolicyInstanceProto(instance: PolicyInstance): PolicyInstanceManagementRecordProto {
    return this.compact({
      id: instance.id,
      tenantId: instance.tenantId,
      subjectSelector: this.toSubjectSelectorProto(instance),
      permissionCode: instance.permissionCode,
      resourceType: instance.resourceType,
      templateCode: instance.templateCode,
      effect: EFFECT_TO_PROTO[instance.effect],
      params: this.toParamsProto(instance.params),
      enabled: instance.enabled,
      priority: instance.priority,
      createdBy: instance.createdBy,
      updatedBy: instance.updatedBy,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    }) as PolicyInstanceManagementRecordProto
  }

  private toSubjectSelectorProto(instance: PolicyInstance): PolicyInstanceSubjectSelectorProto {
    return this.compact({
      type: SUBJECT_SELECTOR_TO_PROTO[instance.subjectSelector.type],
      accountId: instance.subjectSelector.accountId,
      roleId: instance.subjectSelector.roleId
    }) as PolicyInstanceSubjectSelectorProto
  }

  private fromSubjectSelectorProto(
    selector?: PolicyInstanceSubjectSelectorProto
  ): PolicyInstance['subjectSelector'] {
    const type = SUBJECT_SELECTOR_FROM_PROTO[selector?.type ?? 0] ?? 'TENANT_WIDE'

    if (type === 'ACCOUNT') {
      return {
        type,
        accountId: selector?.accountId || undefined
      }
    }

    if (type === 'ROLE') {
      return {
        type,
        roleId: selector?.roleId || undefined
      }
    }

    return { type: 'TENANT_WIDE' }
  }

  private toParamsProto(params: Record<string, unknown>): PolicyInstanceParamsProto {
    return this.compact({
      field: stringParam(params.field),
      allowedValues: stringArrayParam(params.allowedValues),
      value: stringParam(params.value),
      resourceField: stringParam(params.resourceField),
      subjectField: stringParam(params.subjectField),
      ownerField: stringParam(params.ownerField),
      orgField: stringParam(params.orgField),
      timezone: stringParam(params.timezone),
      cidrs: stringArrayParam(params.cidrs)
    }) as PolicyInstanceParamsProto
  }

  private fromParamsProto(params?: PolicyInstanceParamsProto): Record<string, unknown> {
    if (!params) {
      return {}
    }

    return this.compact({
      field: params.field,
      allowedValues: params.allowedValues,
      value: params.value,
      resourceField: params.resourceField,
      subjectField: params.subjectField,
      ownerField: params.ownerField,
      orgField: params.orgField,
      timezone: params.timezone,
      cidrs: params.cidrs
    })
  }

  private getOperatorId(request: unknown): string {
    const operatorId = getAuthenticatedGrpcRequestContext(request)?.operatorContext?.operator_id

    if (!operatorId) {
      throw new Error('OPERATOR_CONTEXT_REQUIRED')
    }

    return operatorId
  }

  private compact<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, entry]) =>
          entry !== undefined &&
          entry !== '' &&
          (!Array.isArray(entry) || entry.length > 0)
      )
    ) as T
  }
}

/** stringParam narrows arbitrary JSON params to string-valued proto fields. */
function stringParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** stringArrayParam narrows arbitrary JSON params to repeated string proto fields. */
function stringArrayParam(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined
}
