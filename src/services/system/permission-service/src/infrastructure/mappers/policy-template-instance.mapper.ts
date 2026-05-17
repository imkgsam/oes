import {
  PolicyInstance,
  SubjectSelector
} from '../../application/authorization/resource-policy'

interface PolicyInstanceRecord {
  id: string
  tenantId: string
  subjectSelectorType: 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE'
  subjectSelectorValue: string | null
  permissionCode: string
  resourceType: string | null
  templateCode: string
  effect: 'ALLOW' | 'DENY'
  params: unknown
  priority: number
  isEnabled: boolean
  createdBy: string
  updatedBy: string
  createdAt: Date | string
  updatedAt: Date | string
}

/** PolicyTemplateInstanceMapper converts stored policy instance rows into the internal contract shape. */
export class PolicyTemplateInstanceMapper {
  /** toDomain maps a persistence row into a first-stage PolicyInstance contract. */
  static toDomain(record: PolicyInstanceRecord): PolicyInstance {
    return {
      id: record.id,
      tenantId: record.tenantId,
      subjectSelector: this.toSubjectSelector(
        record.subjectSelectorType,
        record.subjectSelectorValue
      ),
      permissionCode: record.permissionCode,
      resourceType: record.resourceType ?? undefined,
      templateCode: record.templateCode,
      effect: record.effect,
      params: isRecord(record.params) ? record.params : {},
      enabled: record.isEnabled,
      priority: record.priority,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: toIsoString(record.createdAt),
      updatedAt: toIsoString(record.updatedAt)
    }
  }

  /** toPersistent maps a PolicyInstance contract into fields accepted by Prisma persistence. */
  static toPersistent(instance: PolicyInstance) {
    const selector = this.toPersistentSubjectSelector(instance.subjectSelector)

    return {
      id: instance.id,
      tenantId: instance.tenantId,
      subjectSelectorType: selector.type,
      subjectSelectorValue: selector.value,
      permissionCode: instance.permissionCode,
      resourceType: instance.resourceType ?? null,
      templateCode: instance.templateCode,
      effect: instance.effect,
      params: instance.params,
      priority: instance.priority,
      isEnabled: instance.enabled,
      createdBy: instance.createdBy,
      updatedBy: instance.updatedBy,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    }
  }

  /** toSubjectSelector reconstructs contract selector semantics from type/value columns. */
  private static toSubjectSelector(
    type: PolicyInstanceRecord['subjectSelectorType'],
    value: string | null
  ): SubjectSelector {
    switch (type) {
      case 'ACCOUNT':
        return { type, accountId: value ?? undefined }
      case 'ROLE':
        return { type, roleId: value ?? undefined }
      case 'TENANT_WIDE':
      default:
        return { type: 'TENANT_WIDE' }
    }
  }

  /** toPersistentSubjectSelector flattens selector variants into stable storage columns. */
  private static toPersistentSubjectSelector(selector: SubjectSelector): {
    type: 'ACCOUNT' | 'ROLE' | 'TENANT_WIDE'
    value: string | null
  } {
    switch (selector.type) {
      case 'ACCOUNT':
        return { type: 'ACCOUNT', value: selector.accountId ?? null }
      case 'ROLE':
        return { type: 'ROLE', value: selector.roleId ?? null }
      case 'TENANT_WIDE':
      default:
        return { type: 'TENANT_WIDE', value: null }
    }
  }
}

/** toIsoString normalizes Date-like persistence values into contract timestamps. */
function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

/** isRecord checks that JSON params are a shallow object before exposing them to evaluators. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}
