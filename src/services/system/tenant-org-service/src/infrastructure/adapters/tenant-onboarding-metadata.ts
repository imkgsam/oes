/** Records the exact onboarding target Codes consumed by the target-bound ET producers. */
export const TENANT_ONBOARDING_TARGET_CODES = Object.freeze({
  authBootstrap: 'auth.account_credentials.bootstrap',
  identityAccountCreate: 'identity.account.create',
  hrEmployeeCreate: 'hr.employee.create',
  permissionRoleCreate: 'permission.role_instance.create_from_template',
  permissionAccountAssign: 'permission.account.assign_roles'
} as const)
