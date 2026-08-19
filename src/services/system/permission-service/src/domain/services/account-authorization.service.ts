import { getPermissionCodeDefinition } from '@oes/common/authorization'
import { PermissionRepository } from '../repositories/permission.repository'
import { RoleRepository } from '../repositories/role.repository'
import { ScopeLevel } from '../enums/scope-level.enum'
import {
  matchesPermissionDecisionEligibility,
  PermissionCatalogMetadataError,
  toPermissionDecisionCatalogEntry
} from './permission-code-eligibility'

export { PermissionCatalogMetadataError } from './permission-code-eligibility'

export const ACCOUNT_AUTHORIZATION_SERVICE = Symbol('AccountAuthorizationService')

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
    if (!permission) {
      throw new PermissionCatalogMetadataError(permissionCode)
    }
    const eligibility = toPermissionDecisionCatalogEntry(permission)
    if (!eligibility.metadataCurrent) throw new PermissionCatalogMetadataError(permissionCode)

    const scopeLevel = tenantId ? ScopeLevel.TENANT : ScopeLevel.SYSTEM
    if (
      !matchesPermissionDecisionEligibility(eligibility, {
        kind: 'BUSINESS',
        scopeLevel,
        assignee: 'HUMAN'
      })
    ) {
      return false
    }

    const roles = await this.roleRepo.findAccountRoles(accountId, tenantId ?? null, scopeLevel)
    return roles.some((role) => role.hasPermissionByCode(permissionCode))
  }
}
