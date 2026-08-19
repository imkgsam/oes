import { Permission } from '../aggregates/permission.aggregate'
import { Role } from '../aggregates/role.aggregate'
import { AccountType } from '../enums/account-type.enum'
import { ScopeLevel } from '../enums/scope-level.enum'
import { AccountRole } from '../vo/account-role.value-object'

export interface RolePageQuery {
  page: number
  pageSize: number
  tenantId?: string
  scopeLevel?: ScopeLevel
  keyword?: string
}

export interface PagedRoleResult {
  roles: Role[]
  total: number
  page: number
  pageSize: number
}

export interface PrincipalRoleBindingRevokeResult {
  bindingId: string
  revokedAt: Date
  revokedByOperatorId: string
  reason: string
  auditEventId: string
  revokedNow: boolean
}

export interface RoleRepository {
  findById(id: string): Promise<Role | null>
  findByCode(code: string): Promise<Role | null>
  findByScopeAndCode(scopeKey: string, code: string): Promise<Role | null>
  findByScopeKindAndCode(scopeKey: string, kind: Role['kind'], code: string): Promise<Role | null>
  findAll(): Promise<Role[]>
  findRoleInstances(query: RolePageQuery): Promise<PagedRoleResult>
  findRoleTemplates(query: Omit<RolePageQuery, 'tenantId'>): Promise<PagedRoleResult>
  save(role: Role): Promise<Role>
  delete(id: string): Promise<Role | null>
  hasAssignedAccounts(roleId: string): Promise<boolean>
  hasAssignedPermissions(roleId: string): Promise<boolean>
  hasTemplateInstances(roleTemplateId: string): Promise<boolean>
  findOwnPermissions(roleId: string): Promise<Permission[]>
  findRolesByPermissionId(permissionId: string): Promise<Role[]>
  findRolesForAccountId(accountId: string): Promise<Role[]>
  resolveExternalMachineAuthorizationSnapshot(input: {
    principalId: string
    tenantId: string
  }): Promise<{
    permissions: Permission[]
    authzVersion: string
    decisionReference: string
  } | null>

  // Account-Role binding
  assignAccountRole(
    accountId: string,
    roleId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel,
    accountType: AccountType,
    effectiveAt?: Date | null,
    expiresAt?: Date | null,
    auditContext?: {
      operatorId: string
      requestId?: string
      traceId?: string
      bindingId?: string
    }
  ): Promise<AccountRole>
  revokeAccountRole(accountId: string, roleId: string): Promise<void>
  revokePrincipalRoleBinding(input: {
    bindingId: string
    revokedAt: Date
    revokedByOperatorId: string
    reason: string
    auditEventId: string
  }): Promise<PrincipalRoleBindingRevokeResult>
  findAccountRoles(
    accountId: string,
    tenantId?: string | null,
    scopeLevel?: ScopeLevel
  ): Promise<Role[]>
  findPrincipalRoleBindings(
    principalId: string,
    tenantId?: string | null,
    scopeLevel?: ScopeLevel
  ): Promise<AccountRole[]>
  findRoleAccounts(roleId: string): Promise<AccountRole[]>
  findTenantRoles(tenantId: string): Promise<Role[]>
  findSystemRoles(): Promise<Role[]>
  findRoleTemplateById(id: string): Promise<Role | null>
  replaceAccountRoles(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel,
    accountType: AccountType,
    roleIds: string[],
    auditContext?: {
      operatorId: string
      requestId?: string
      traceId?: string
    }
  ): Promise<{ roles: Role[]; bindings: AccountRole[] }>
}
