export interface PermissionCheckPort {
  checkAccountPermission(input: PermissionCheckInput): Promise<PermissionCheckOutput>
  checkAccountPermissionScope(input: PermissionCheckInput): Promise<PermissionCheckOutput>
}

export interface PermissionCheckInput {
  accountId: string
  permissionCode: string
}

export interface PermissionCheckOutput {
  pass: boolean
  scopes?: PermissionScope[]
}

interface PermissionScope {
  type: PermissionScopeType
  value: string
}

export enum PermissionScopeType {
  TENANT = 'tenant',
  ORG = 'org',
  RESOURCE = 'resource',
  SELF = 'self'
}
