export const MANAGEMENT_PERMISSION_CODES = {
  CREATE_PERMISSION: 'permission.create',
  UPDATE_PERMISSION: 'permission.update',
  DELETE_PERMISSION: 'permission.delete',
  VIEW_PERMISSION: 'permission.list',
  VIEW_PERMISSION_DETAIL: 'permission.get_by_id',
  VIEW_PERMISSION_DETAIL_BY_CODE: 'permission.get_by_code',

  CREATE_ROLE: 'permission.role.create',
  UPDATE_ROLE: 'permission.role.update',
  DELETE_ROLE: 'permission.role.delete_by_id',
  VIEW_ROLE: 'permission.role.list',
  VIEW_ROLE_DETAIL: 'permission.role.get_by_id',
  ASSIGN_ROLE_PERMISSION: 'permission.role.update',
  REVOKE_ROLE_PERMISSION: 'permission.role.update',

  ASSIGN_ACCOUNT_ROLE: 'permission.account.assign_roles',
  REVOKE_ACCOUNT_ROLE: 'permission.account.assign_roles',
  VIEW_ACCOUNT_ROLE: 'permission.account.get_roles',
  SET_ACCOUNT_ROLES: 'permission.account.assign_roles',

  CREATE_POLICY: 'permission.policy.create',
  UPDATE_POLICY: 'permission.policy.update',
  DELETE_POLICY: 'permission.policy.delete',
  VIEW_POLICY: 'permission.policy.list'
} as const
