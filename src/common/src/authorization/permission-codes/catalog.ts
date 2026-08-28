import { createHash } from 'node:crypto'
import type {
  EffectivePermissionDefinition,
  PermissionDefinitionGroup,
  PermissionScopeLevel
} from './types'
import { ASSET_INTERNAL_PERMISSION_DEFINITIONS } from './asset/internal.permission-codes'
import { ASSET_SITE_MEDIA_PERMISSION_DEFINITIONS } from './asset/site-media.permission-codes'
import { AUTH_MANAGEMENT_PERMISSION_DEFINITIONS } from './auth/auth-management.permission-codes'
import { AUTH_INTERNAL_PERMISSION_DEFINITIONS } from './auth/internal.permission-codes'
import { AUTH_SESSION_PERMISSION_DEFINITIONS } from './auth/session.permission-codes'
import { BROWSER_ACTIVITY_AUDIT_PERMISSION_DEFINITIONS } from './browser-activity/audit.permission-codes'
import { COLLABORATION_ANNOTATION_PERMISSION_DEFINITIONS } from './collaboration/annotation.permission-codes'
import { COLLABORATION_INTERNAL_PERMISSION_DEFINITIONS } from './collaboration/internal.permission-codes'
import { COLLABORATION_TASK_PERMISSION_DEFINITIONS } from './collaboration/task.permission-codes'
import { CRM_INTERNAL_PERMISSION_DEFINITIONS } from './crm/internal.permission-codes'
import { CRM_MANAGEMENT_PERMISSION_DEFINITIONS } from './crm/management.permission-codes'
import { FINANCE_MANAGEMENT_PERMISSION_DEFINITIONS } from './finance/management.permission-codes'
import { HR_MANAGEMENT_PERMISSION_DEFINITIONS } from './hr/management.permission-codes'
import { HR_INTERNAL_PERMISSION_DEFINITIONS } from './hr/internal.permission-codes'
import { IDENTITY_ACCOUNT_SELF_PERMISSION_DEFINITIONS } from './identity/account-self.permission-codes'
import { IDENTITY_ACCOUNT_PERMISSION_DEFINITIONS } from './identity/account.permission-codes'
import { IDENTITY_INTERNAL_PERMISSION_DEFINITIONS } from './identity/internal.permission-codes'
import { IDENTITY_MACHINE_PERMISSION_DEFINITIONS } from './identity/machine.permission-codes'
import { ITEM_MASTER_INTERNAL_PERMISSION_DEFINITIONS } from './item-master/internal.permission-codes'
import { ITEM_MASTER_MANAGEMENT_PERMISSION_DEFINITIONS } from './item-master/management.permission-codes'
import { MES_MANAGEMENT_PERMISSION_DEFINITIONS } from './mes/management.permission-codes'
import { NOTIFICATION_INTERNAL_PERMISSION_DEFINITIONS } from './notification/internal.permission-codes'
import { PARTY_INTERNAL_PERMISSION_DEFINITIONS } from './party/internal.permission-codes'
import { PERMISSION_INTERNAL_PERMISSION_DEFINITIONS } from './permission/internal.permission-codes'
import { PERMISSION_MANAGEMENT_PERMISSION_DEFINITIONS } from './permission/management.permission-codes'
import { ROLE_INSTANCE_PERMISSION_DEFINITIONS } from './permission/role-instance.permission-codes'
import { ROLE_TEMPLATE_PERMISSION_DEFINITIONS } from './permission/role-template.permission-codes'
import { PROCUREMENT_INTERNAL_PERMISSION_DEFINITIONS } from './procurement/internal.permission-codes'
import { PROCUREMENT_MANAGEMENT_PERMISSION_DEFINITIONS } from './procurement/management.permission-codes'
import { PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_DEFINITIONS } from './public-entry/business-card.permission-codes'
import { PUBLIC_ENTRY_SHORT_LINK_PERMISSION_DEFINITIONS } from './public-entry/short-link.permission-codes'
import { SALES_MANAGEMENT_PERMISSION_DEFINITIONS } from './sales/management.permission-codes'
import { SALES_PRICING_PERMISSION_DEFINITIONS } from './sales/pricing.permission-codes'
import { SITE_MANAGEMENT_INTERNAL_PERMISSION_DEFINITIONS } from './site-management/internal.permission-codes'
import { SITE_MANAGEMENT_PERMISSION_DEFINITIONS } from './site-management/management.permission-codes'
import { SRM_INTERNAL_PERMISSION_DEFINITIONS } from './srm/internal.permission-codes'
import { SRM_MANAGEMENT_PERMISSION_DEFINITIONS } from './srm/management.permission-codes'
import { TENANT_ORG_MANAGEMENT_PERMISSION_DEFINITIONS } from './tenant-org/management.permission-codes'
import { TENANT_ORG_INTERNAL_PERMISSION_DEFINITIONS } from './tenant-org/internal.permission-codes'
import { TERMINAL_DEVICE_INTERNAL_PERMISSION_DEFINITIONS } from './terminal-device/internal.permission-codes'
import { TERMINAL_DEVICE_MANAGEMENT_PERMISSION_DEFINITIONS } from './terminal-device/management.permission-codes'
import { WMS_MANAGEMENT_PERMISSION_DEFINITIONS } from './wms/management.permission-codes'

/** PERMISSION_DEFINITION_GROUPS aggregates explicit bounded-context sources without redefining them. */
export const PERMISSION_DEFINITION_GROUPS = [
  ASSET_INTERNAL_PERMISSION_DEFINITIONS,
  ASSET_SITE_MEDIA_PERMISSION_DEFINITIONS,
  AUTH_MANAGEMENT_PERMISSION_DEFINITIONS,
  AUTH_INTERNAL_PERMISSION_DEFINITIONS,
  AUTH_SESSION_PERMISSION_DEFINITIONS,
  BROWSER_ACTIVITY_AUDIT_PERMISSION_DEFINITIONS,
  COLLABORATION_ANNOTATION_PERMISSION_DEFINITIONS,
  COLLABORATION_INTERNAL_PERMISSION_DEFINITIONS,
  COLLABORATION_TASK_PERMISSION_DEFINITIONS,
  CRM_INTERNAL_PERMISSION_DEFINITIONS,
  CRM_MANAGEMENT_PERMISSION_DEFINITIONS,
  FINANCE_MANAGEMENT_PERMISSION_DEFINITIONS,
  HR_MANAGEMENT_PERMISSION_DEFINITIONS,
  HR_INTERNAL_PERMISSION_DEFINITIONS,
  IDENTITY_ACCOUNT_SELF_PERMISSION_DEFINITIONS,
  IDENTITY_ACCOUNT_PERMISSION_DEFINITIONS,
  IDENTITY_INTERNAL_PERMISSION_DEFINITIONS,
  IDENTITY_MACHINE_PERMISSION_DEFINITIONS,
  ITEM_MASTER_INTERNAL_PERMISSION_DEFINITIONS,
  ITEM_MASTER_MANAGEMENT_PERMISSION_DEFINITIONS,
  MES_MANAGEMENT_PERMISSION_DEFINITIONS,
  NOTIFICATION_INTERNAL_PERMISSION_DEFINITIONS,
  PARTY_INTERNAL_PERMISSION_DEFINITIONS,
  PERMISSION_INTERNAL_PERMISSION_DEFINITIONS,
  PERMISSION_MANAGEMENT_PERMISSION_DEFINITIONS,
  ROLE_INSTANCE_PERMISSION_DEFINITIONS,
  ROLE_TEMPLATE_PERMISSION_DEFINITIONS,
  PROCUREMENT_INTERNAL_PERMISSION_DEFINITIONS,
  PROCUREMENT_MANAGEMENT_PERMISSION_DEFINITIONS,
  PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_DEFINITIONS,
  PUBLIC_ENTRY_SHORT_LINK_PERMISSION_DEFINITIONS,
  SALES_MANAGEMENT_PERMISSION_DEFINITIONS,
  SALES_PRICING_PERMISSION_DEFINITIONS,
  SITE_MANAGEMENT_INTERNAL_PERMISSION_DEFINITIONS,
  SITE_MANAGEMENT_PERMISSION_DEFINITIONS,
  SRM_INTERNAL_PERMISSION_DEFINITIONS,
  SRM_MANAGEMENT_PERMISSION_DEFINITIONS,
  TENANT_ORG_MANAGEMENT_PERMISSION_DEFINITIONS,
  TENANT_ORG_INTERNAL_PERMISSION_DEFINITIONS,
  TERMINAL_DEVICE_INTERNAL_PERMISSION_DEFINITIONS,
  TERMINAL_DEVICE_MANAGEMENT_PERMISSION_DEFINITIONS,
  WMS_MANAGEMENT_PERMISSION_DEFINITIONS
] as const satisfies readonly PermissionDefinitionGroup[]

const flattenedDefinitions: Record<string, EffectivePermissionDefinition> = {}
for (const group of PERMISSION_DEFINITION_GROUPS) {
  for (const [code, definition] of Object.entries(group.permissions)) {
    if (flattenedDefinitions[code]) throw new Error(`Duplicate Permission Code definition: ${code}`)
    flattenedDefinitions[code] = Object.freeze({
      code,
      ownerService: group.ownerService,
      ...definition
    })
  }
}

/** PERMISSION_CODE_DEFINITIONS is the flattened exact-code runtime lookup over Common-owned groups. */
export const PERMISSION_CODE_DEFINITIONS: Readonly<Record<string, EffectivePermissionDefinition>> =
  Object.freeze(flattenedDefinitions)

/** getPermissionCodeDefinition returns one exact active Common-owned definition without fallback. */
export function getPermissionCodeDefinition(
  code: string
): EffectivePermissionDefinition | undefined {
  return PERMISSION_CODE_DEFINITIONS[code]
}

/** permissionDefinitionFingerprint binds every persisted semantic field to one deterministic version. */
export function permissionDefinitionFingerprint(definition: EffectivePermissionDefinition): string {
  const payload = JSON.stringify({
    code: definition.code,
    ownerService: definition.ownerService,
    description: definition.description,
    kind: definition.kind,
    assignableTo: [...definition.assignableTo],
    allowedScopeLevels: [...definition.allowedScopeLevels],
    externalApiEligible: Boolean(definition.externalApiEligible)
  })
  return `sha256:${createHash('sha256').update(payload).digest('hex')}`
}

/** isPermissionScopeLevel rejects strings outside the two frozen scope values. */
export function isPermissionScopeLevel(value: unknown): value is PermissionScopeLevel {
  return value === 'SYSTEM' || value === 'TENANT'
}

/** PERMISSION_CODE_CATALOG_VERSION fingerprints the exact active definition set. */
export const PERMISSION_CODE_CATALOG_VERSION = `sha256:${createHash('sha256')
  .update(
    Object.values(PERMISSION_CODE_DEFINITIONS)
      .map(permissionDefinitionFingerprint)
      .sort()
      .join('\n')
  )
  .digest('hex')}`
