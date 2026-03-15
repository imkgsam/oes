import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { OtelExceptionFilter } from '@oes/common/filters'
import { CreatePolicyCommand } from '../../application/commands/policy/create-policy.command'
import { UpdatePolicyCommand } from '../../application/commands/policy/update-policy.command'
import { DeletePolicyCommand } from '../../application/commands/policy/delete-policy.command'
import { TogglePolicyCommand } from '../../application/commands/policy/toggle-policy.command'
import { GetPolicyByIdQuery } from '../../application/queries/policy/get-policy-by-id.query'
import { ListPoliciesQuery } from '../../application/queries/policy/list-policies.query'
import { Policy } from '../../domain/aggregates/policy.aggregate'
import {
  PolicyResponse,
  UpdatePolicyRequest,
  DeletePolicyRequest,
  TogglePolicyRequest,
  GetPolicyByIdRequest,
  ListPoliciesRequest,
  ListPoliciesResponse,
  CreatePolicyRequest,
  PolicyManagementServiceControllerMethods,
  PolicyManagementServiceController
} from '@oes/common/generated/permission_service'

// Proto enum domain enum mapping tables
const EFFECT_MAP: Record<number, string> = { 1: 'ALLOW', 2: 'DENY' }
const SUBJECT_TYPE_MAP: Record<number, string> = { 1: 'ROLE', 2: 'ACCOUNT', 3: 'ANY' }
const ATTR_SOURCE_MAP: Record<number, string> = {
  1: 'SUBJECT',
  2: 'RESOURCE',
  3: 'ENVIRONMENT',
  4: 'ACTION'
}
const OPERATOR_MAP: Record<number, string> = {
  1: 'EQUALS',
  2: 'NOT_EQUALS',
  3: 'IN',
  4: 'NOT_IN',
  5: 'GREATER_THAN',
  6: 'GREATER_THAN_OR_EQUAL',
  7: 'LESS_THAN',
  8: 'LESS_THAN_OR_EQUAL',
  9: 'BETWEEN',
  10: 'CONTAINS',
  11: 'STARTS_WITH',
  12: 'REGEX',
  13: 'IS_NULL',
  14: 'IS_NOT_NULL'
}

function mapEnum<T>(val: number | string | undefined, table: Record<number, string>): T {
  return (typeof val === 'number' ? (table[val] ?? val) : val) as T
}

function hasOwnField<T extends object>(obj: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@PolicyManagementServiceControllerMethods()
export class PolicyManagementGrpcController implements PolicyManagementServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

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
        conditions: (request.conditions ?? []).map((c) => ({
          attributeSource: mapEnum(c.attributeSource, ATTR_SOURCE_MAP),
          attributeKey: c.attributeKey!,
          operator: mapEnum(c.operator, OPERATOR_MAP),
          value: c.value!
        }))
      })
    )
    return this.toResponse(result)
  }

  async updatePolicy(
    request: UpdatePolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const hasEffect = hasOwnField(request, 'effect')
    const hasSubjectType = hasOwnField(request, 'subjectType')
    const hasPriority = hasOwnField(request, 'priority')
    const hasConditions = hasOwnField(request, 'conditions')

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
        conditions: hasConditions
          ? (request.conditions ?? []).map((c) => ({
              attributeSource: mapEnum(c.attributeSource, ATTR_SOURCE_MAP),
              attributeKey: c.attributeKey!,
              operator: mapEnum(c.operator, OPERATOR_MAP),
              value: c.value!
            }))
          : undefined
      })
    )
    return this.toResponse(result)
  }

  async deletePolicy(
    request: DeletePolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<void> {
    await this.commandBus.execute(new DeletePolicyCommand(request.id!))
  }

  async togglePolicy(
    request: TogglePolicyRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const result: Policy = await this.commandBus.execute(
      new TogglePolicyCommand(request.id!, request.isEnabled!)
    )
    return this.toResponse(result)
  }

  async getPolicyById(
    request: GetPolicyByIdRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<PolicyResponse> {
    const result: Policy = await this.queryBus.execute(new GetPolicyByIdQuery(request.id!))
    return this.toResponse(result)
  }

  async listPolicies(
    request: ListPoliciesRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<ListPoliciesResponse> {
    const list: Policy[] = await this.queryBus.execute(
      new ListPoliciesQuery(request.tenantId || undefined)
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
      conditions: p.conditions.map((c) => ({
        id: c.id,
        attributeSource: c.attributeSource as any,
        attributeKey: c.attributeKey,
        operator: c.operator as any,
        value: c.rawValue
      }))
    }
  }
}
