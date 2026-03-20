import { Policy } from '../../domain/aggregates/policy.aggregate'

export class PolicyMapper {
  static toDomain(record: any): Policy {
    return new Policy(
      record.id,
      record.name,
      record.effect,
      record.priority,
      record.subjectType,
      record.subjectId ?? null,
      record.permissionCode,
      record.resourceType ?? null,
      record.tenantId ?? null,
      record.isEnabled,
      record.conditionAstJson ?? null,
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
      isEnabled: policy.isEnabled,
      conditionAstJson: policy.conditionAstJson
    }
  }
}
