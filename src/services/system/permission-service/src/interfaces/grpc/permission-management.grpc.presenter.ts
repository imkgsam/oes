import {
  AccountRoleBindingResponse,
  NavigationEntryResponse,
  PermissionAuditEventRecord,
  PermissionResponse,
  ResolveNavigationPreviewResponse,
  RoleKindProto,
  RoleLandingPolicyResponse,
  RoleNavigationResponse,
  RoleNavigationVisibilityResponse,
  RoleResponse
} from '@oes/common/generated/permission_service'
import { AuditEventView } from '../../application/queries'
import { NavigationPreviewResult } from '../../application/queries/navigation'
import { Permission } from '../../domain/aggregates/permission.aggregate'
import { NavigationEntry } from '../../domain/aggregates/navigation-entry.aggregate'
import { Role } from '../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../domain/enums/role-kind.enum'
import { RoleNavigationConfig } from '../../domain/repositories/navigation.repository'
import { AccountRole } from '../../domain/vo/account-role.value-object'
import { RoleLandingPolicy } from '../../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../../domain/vo/role-navigation-visibility.value-object'

// This presenter maps permission aggregates to gRPC permission management responses.
export function toPermissionResponse(permission: Permission): PermissionResponse {
  return {
    id: permission.id,
    code: permission.code,
    module: permission.module,
    description: permission.description ?? ''
  }
}

// This presenter maps role aggregates to gRPC permission management responses.
export function toRoleResponse(role: Role): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    code: role.code,
    tenantId: role.tenantId ?? '',
    isSystem: role.isSystem,
    isEnabled: role.isEnabled,
    description: role.description ?? '',
    roleKind: toRoleKindProto(role.kind),
    templateRoleId: role.templateRoleId ?? ''
  }
}

// This presenter helper converts the domain role kind into the proto enum expected on the gRPC boundary.
function toRoleKindProto(kind: RoleKind): RoleKindProto {
  switch (kind) {
    case RoleKind.SYSTEM_TEMPLATE:
      return RoleKindProto.ROLE_KIND_PROTO_SYSTEM_TEMPLATE
    case RoleKind.SYSTEM_INSTANCE:
      return RoleKindProto.ROLE_KIND_PROTO_SYSTEM_INSTANCE
    case RoleKind.TENANT_INSTANCE:
      return RoleKindProto.ROLE_KIND_PROTO_TENANT_INSTANCE
    default:
      return RoleKindProto.ROLE_KIND_PROTO_UNSPECIFIED
  }
}

// This presenter maps account-role bindings to gRPC role-assignment records.
export function toAccountRoleBindingResponse(accountRole: AccountRole): AccountRoleBindingResponse {
  return {
    accountId: accountRole.accountId,
    accountType: accountRole.accountType,
    roleId: accountRole.roleId,
    tenantId: accountRole.tenantId ?? '',
    scopeLevel: accountRole.scopeLevel
  }
}

// This presenter maps navigation entry facts to gRPC navigation registry responses.
export function toNavigationEntryResponse(entry: NavigationEntry): NavigationEntryResponse {
  return {
    entryKey: entry.entryKey,
    name: entry.name,
    description: entry.description ?? '',
    featureKey: entry.featureKey ?? '',
    supportedTerminals: entry.supportedTerminals,
    registryPriority: entry.registryPriority,
    enabled: entry.enabled,
    entryType: entry.entryType
  }
}

// This presenter maps role navigation visibility facts to gRPC response records.
export function toRoleNavigationVisibilityResponse(
  visibility: RoleNavigationVisibility
): RoleNavigationVisibilityResponse {
  return {
    roleId: visibility.roleId,
    entryKey: visibility.entryKey,
    terminal: visibility.terminal,
    enabled: visibility.enabled
  }
}

// This presenter maps role landing policy facts to gRPC response records.
export function toRoleLandingPolicyResponse(policy: RoleLandingPolicy): RoleLandingPolicyResponse {
  return {
    roleId: policy.roleId,
    terminal: policy.terminal,
    defaultEntryKey: policy.defaultEntryKey,
    priority: policy.priority,
    enabled: policy.enabled
  }
}

// This presenter maps a role's navigation config to the gRPC management response.
export function toRoleNavigationResponse(config: RoleNavigationConfig): RoleNavigationResponse {
  return {
    roleId: config.roleId,
    visibility: config.visibility.map(toRoleNavigationVisibilityResponse),
    landingPolicies: config.landingPolicies.map(toRoleLandingPolicyResponse)
  }
}

// This presenter maps resolver preview output to a gRPC response.
export function toResolveNavigationPreviewResponse(
  result: NavigationPreviewResult
): ResolveNavigationPreviewResponse {
  return {
    visibleEntries: result.visibleEntries,
    defaultEntry: result.defaultEntry,
    resolvedByRoleId: result.resolvedByRoleId ?? '',
    fallbackReason: result.fallbackReason ?? ''
  }
}

// This presenter maps permission audit query views to gRPC response records.
export function toPermissionAuditEventRecord(event: AuditEventView): PermissionAuditEventRecord {
  return {
    eventId: event.eventId,
    service: event.service,
    module: event.module,
    eventType: event.eventType,
    occurredAt: event.occurredAt.toISOString(),
    result: event.result,
    operatorId: event.operatorId,
    operatorType: event.operatorType,
    tenantId: event.tenantId ?? '',
    orgId: event.orgId ?? '',
    traceId: event.traceId ?? '',
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    detailsJson: JSON.stringify(event.details)
  }
}
