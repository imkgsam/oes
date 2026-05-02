export const PERMISSION_MANAGEMENT_PERMISSION_CODES = {
  CREATE_PERMISSION: 'permission.create',
  UPDATE_PERMISSION: 'permission.update',
  DELETE_PERMISSION: 'permission.delete',
  VIEW_PERMISSION: 'permission.list',
  VIEW_PERMISSION_DETAIL: 'permission.get_by_id',
  VIEW_PERMISSION_DETAIL_BY_CODE: 'permission.get_by_code',
  VIEW_AUDIT_EVENT: 'permission.audit.list',

  VIEW_NAVIGATION_ENTRY: 'permission.navigation.entry.list',
  VIEW_NAVIGATION_ENTRY_DETAIL: 'permission.navigation.entry.get_by_key',
  CREATE_NAVIGATION_ENTRY: 'permission.navigation.entry.create',
  UPDATE_NAVIGATION_ENTRY: 'permission.navigation.entry.update',
  RESOLVE_NAVIGATION_PREVIEW: 'permission.navigation.resolve_preview',

  CREATE_ROLE_TEMPLATE: 'permission.role_template.create',
  UPDATE_ROLE_TEMPLATE: 'permission.role_template.update',
  DELETE_ROLE_TEMPLATE: 'permission.role_template.delete_by_id',
  VIEW_ROLE_TEMPLATE: 'permission.role_template.list',
  VIEW_ROLE_TEMPLATE_DETAIL: 'permission.role_template.get_by_id',
  ASSIGN_ROLE_TEMPLATE_PERMISSION: 'permission.role_template.permission.assign',
  REVOKE_ROLE_TEMPLATE_PERMISSION: 'permission.role_template.permission.revoke',

  CREATE_ROLE_INSTANCE: 'permission.role_instance.create',
  CREATE_ROLE_INSTANCE_FROM_TEMPLATE: 'permission.role_instance.create_from_template',
  UPDATE_ROLE_INSTANCE: 'permission.role_instance.update',
  DELETE_ROLE_INSTANCE: 'permission.role_instance.delete_by_id',
  VIEW_ROLE_INSTANCE: 'permission.role_instance.list',
  VIEW_ROLE_INSTANCE_DETAIL: 'permission.role_instance.get_by_id',
  ASSIGN_ROLE_INSTANCE_PERMISSION: 'permission.role_instance.permission.assign',
  REVOKE_ROLE_INSTANCE_PERMISSION: 'permission.role_instance.permission.revoke',

  ASSIGN_ACCOUNT_ROLE: 'permission.account.assign_roles',
  REVOKE_ACCOUNT_ROLE: 'permission.account.assign_roles',
  VIEW_ACCOUNT_ROLE: 'permission.account.get_roles',
  SET_ACCOUNT_ROLES: 'permission.account.assign_roles',

  CREATE_POLICY: 'permission.policy.create',
  UPDATE_POLICY: 'permission.policy.update',
  DELETE_POLICY: 'permission.policy.delete',
  VIEW_POLICY: 'permission.policy.list'
} as const
