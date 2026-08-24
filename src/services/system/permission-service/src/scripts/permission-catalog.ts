import {
  DEPRECATED_PERMISSION_CODES,
  PERMISSION_CODE_DEFINITIONS,
  PermissionAssignee,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { Modules, PermissionKind, PermissionScopeLevel } from '../../prisma/generated/prisma'

export * from '@oes/common/authorization'

export type PermissionSeedItem = {
  code: string
  module: Modules
  description: string
  kind: PermissionKind
  assignableTo: PermissionAssignee[]
  allowedScopeLevels: PermissionScopeLevel[]
  definitionFingerprint: string
  externalApiEligible: boolean
}

const MODULE_BY_OWNER_SERVICE: Readonly<Record<string, Modules>> = {
  'permission-service': Modules.PERMISSION_SERVICE,
  'auth-service': Modules.AUTH_SERVICE,
  'identity-service': Modules.IDENTITY_SERVICE,
  'tenant-org-service': Modules.TENANT_ORG_SERVICE,
  'hr-service': Modules.HR_SERVICE,
  'item-master-service': Modules.ITEM_MASTER_SERVICE,
  'crm-service': Modules.CRM_SERVICE,
  'srm-service': Modules.SRM_SERVICE,
  'sales-service': Modules.SALES_SERVICE,
  'procurement-service': Modules.PROCUREMENT_SERVICE,
  'finance-service': Modules.FINANCE_SERVICE,
  'public-entry-service': Modules.PUBLIC_ENTRY_SERVICE,
  'wms-service': Modules.WMS_SERVICE,
  'mes-service': Modules.MES_SERVICE,
  'collaboration-service': Modules.COLLABORATION_SERVICE,
  'terminal-device-service': Modules.TERMINAL_DEVICE_SERVICE,
  'site-service': Modules.SITE_SERVICE,
  'asset-service': Modules.ASSET_SERVICE,
  'notification-service': Modules.NOTIFICATION_SERVICE,
  'party-service': Modules.PARTY_SERVICE,
  'browser-activity-service': Modules.BROWSER_ACTIVITY_SERVICE
}

/** PERMISSION_CODE_SEED_ITEMS maps complete Common definitions into Permission-owned runtime rows. */
export const PERMISSION_CODE_SEED_ITEMS: PermissionSeedItem[] = Object.values(
  PERMISSION_CODE_DEFINITIONS
).map((definition) => {
  const module = MODULE_BY_OWNER_SERVICE[definition.ownerService]
  if (!module) {
    throw new Error(`Unknown Permission owner service: ${definition.ownerService}`)
  }
  return {
    code: definition.code,
    module,
    description: definition.description,
    kind: definition.kind as PermissionKind,
    assignableTo: [...definition.assignableTo],
    allowedScopeLevels: [...definition.allowedScopeLevels] as PermissionScopeLevel[],
    definitionFingerprint: permissionDefinitionFingerprint(definition),
    externalApiEligible: Boolean(definition.externalApiEligible)
  }
})

export { DEPRECATED_PERMISSION_CODES }
