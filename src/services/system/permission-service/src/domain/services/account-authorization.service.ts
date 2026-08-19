import {
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { PermissionRepository } from '../repositories/permission.repository'
import { RoleRepository } from '../repositories/role.repository'
import { ScopeLevel } from '../enums/scope-level.enum'

export const ACCOUNT_AUTHORIZATION_SERVICE = Symbol('AccountAuthorizationService')

/** PermissionCatalogMetadataError marks a known code whose runtime row is absent or stale. */
export class PermissionCatalogMetadataError extends Error {
  constructor(code: string) {
    super(`PERMISSION_CATALOG_METADATA_STALE:${code}`)
    this.name = 'PermissionCatalogMetadataError'
  }
}

/** AccountAuthorizationService evaluates current scope-bound HUMAN RBAC permission checks. */
export class AccountAuthorizationService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly permissionRepo: PermissionRepository
  ) {}

  async checkPermission(
    accountId: string,
    permissionCode: string,
    tenantId?: string
  ): Promise<boolean> {
    const definition = getPermissionCodeDefinition(permissionCode)
    if (!definition) return false

    const permission = await this.permissionRepo.findByCode(permissionCode)
    if (!permission || !metadataIsCurrent(permission, definition)) {
      throw new PermissionCatalogMetadataError(permissionCode)
    }

    const scopeLevel = tenantId ? ScopeLevel.TENANT : ScopeLevel.SYSTEM
    if (!definition.allowedScopeLevels.includes(scopeLevel)) return false

    const roles = await this.roleRepo.findAccountRoles(accountId, tenantId ?? null, scopeLevel)
    return roles.some((role) => role.hasPermissionByCode(permissionCode))
  }
}

/** metadataIsCurrent binds the persisted scope list and fingerprint to the exact Common definition. */
function metadataIsCurrent(
  permission: Awaited<ReturnType<PermissionRepository['findByCode']>> & {},
  definition: NonNullable<ReturnType<typeof getPermissionCodeDefinition>>
): boolean {
  return (
    permission.definitionFingerprint === permissionDefinitionFingerprint(definition) &&
    permission.kind === definition.kind &&
    permission.externalApiEligible === (definition.externalApiEligible === true) &&
    permission.allowedScopeLevels.length === definition.allowedScopeLevels.length &&
    permission.allowedScopeLevels.every(
      (scope, index) => scope === definition.allowedScopeLevels[index]
    )
  )
}
