import { PermissionRepository } from '../repositories/permission.repository'
import { RoleRepository } from '../repositories/role.repository'
import { PolicyRepository } from '../repositories/policy.repository'
import { PolicyEngine, AuthzRequest, AuthzDecision } from './policy-engine'

/** Domain service orchestrating RBAC check and ABAC policy evaluation */
export class AccountAuthorizationService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly permissionRepo: PermissionRepository,
    private readonly policyRepo: PolicyRepository,
    private readonly policyEngine: PolicyEngine
  ) {}

  /** Pure RBAC check – does the account's roles include the given permission? */
  async checkPermission(accountId: string, permissionCode: string): Promise<boolean> {
    const permission = await this.permissionRepo.findByCode(permissionCode)
    if (!permission) return false
    const roles = await this.roleRepo.findRolesForAccountId(accountId)
    return roles.some((role) => role.hasPermissionByCode(permissionCode))
  }

  /** RBAC + ABAC check – first validates RBAC, then evaluates ABAC policies */
  async checkPermissionWithContext(request: AuthzRequest): Promise<AuthzDecision> {
    // Step 1: RBAC gate
    const rbacPass = await this.checkPermission(request.accountId, request.permissionCode)
    if (!rbacPass) {
      return { allowed: false, reason: 'RBAC: role does not have this permission' }
    }

    // Step 2: ABAC policy evaluation
    const policies = await this.policyRepo.findApplicable(request.permissionCode, request.tenantId)

    return this.policyEngine.evaluate(policies, request)
  }
}
