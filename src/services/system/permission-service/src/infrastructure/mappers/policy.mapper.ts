import { Policy } from '../../domain/aggregates/policy.aggregate'
import { PolicyConditionVO } from '../../domain/vo/policy-condition.value-object'

export class PolicyMapper {
  static toDomain(record: any): Policy {
    const conditions = (record.conditions ?? []).map(
      (c: any) =>
        new PolicyConditionVO(c.id, c.attributeSource, c.attributeKey, c.operator, c.value)
    )

    return new Policy(
      record.id,
      record.name,
      record.effect,
      record.priority,
      record.subjectType,
      record.subjectId ?? null,
      record.permissionCode ?? null,
      record.resourceType ?? null,
      record.tenantId ?? null,
      record.isEnabled,
      conditions,
      record.description ?? undefined
    )
  }

  static toPersistent(policy: Policy) {
    return {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      tenantId: policy.tenantId,
      effect: policy.effect,
      subjectType: policy.subjectType,
      subjectId: policy.subjectId,
      permissionCode: policy.permissionCode,
      resourceType: policy.resourceType,
      priority: policy.priority,
      isEnabled: policy.isEnabled
    }
  }
}
