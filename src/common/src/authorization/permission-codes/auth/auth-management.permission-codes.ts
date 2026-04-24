export const AUTH_MANAGEMENT_PERMISSION_CODES = {
  VIEW_AUDIT_EVENT: 'auth.audit.list',
  BOOTSTRAP_ACCOUNT_CREDENTIALS: 'auth.account_credentials.bootstrap',
  MANAGE_ACCOUNT_LOGIN_METHODS: 'auth.account_login_methods.manage',
  MANAGE_TENANT_MFA_POLICY: 'auth.mfa_policy.manage',
  MANAGE_PLATFORM_MFA_POLICY: 'auth.platform_mfa_policy.manage'
} as const
