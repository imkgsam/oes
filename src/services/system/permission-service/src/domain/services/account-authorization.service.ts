import { PermissionRepository } from '../repositories/permission.repository'
import { PolicyRepository } from '../repositories/policy.repository'
import { RoleRepository } from '../repositories/role.repository'
import { AuthzDecision, AuthzRequest, PolicyEngine } from './policy-engine'

export class AccountAuthorizationService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly permissionRepo: PermissionRepository,
    private readonly policyRepo: PolicyRepository,
    private readonly policyEngine: PolicyEngine
  ) {}

  async checkPermission(accountId: string, permissionCode: string): Promise<boolean> {
    const permission = await this.permissionRepo.findByCode(permissionCode)
    if (!permission) return false

    const roles = await this.roleRepo.findRolesForAccountId(accountId)
    return roles.some((role) => role.hasPermissionByCode(permissionCode))
  }

  async checkPermissionWithContext(request: AuthzRequest): Promise<AuthzDecision> {
    const rbacPass = await this.checkPermission(request.accountId, request.permissionCode)
    if (!rbacPass) {
      return {
        allowed: false,
        reason: 'RBAC: role does not have this permission',
        evaluationMode: 'RBAC'
      }
    }

    const policies = await this.policyRepo.findApplicable(request.permissionCode, request.tenantId)
    return this.policyEngine.evaluate(policies, request)
  }
}
