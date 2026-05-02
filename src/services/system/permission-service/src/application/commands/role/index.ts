export * from './create-role-template.command'
export * from './create-role-template.handler'
export * from './create-role-instance.command'
export * from './create-role-instance.handler'
export * from './update-role-template.command'
export * from './update-role-template.handler'
export * from './delete-role-template.command'
export * from './delete-role-template.handler'
export * from './set-role-template-enabled.command'
export * from './set-role-template-enabled.handler'
export * from './assign-role-template-permission.command'
export * from './assign-role-template-permission.handler'
export * from './revoke-role-template-permission.command'
export * from './revoke-role-template-permission.handler'
export * from './create-role-instance-from-template.command'
export * from './create-role-instance-from-template.handler'
export * from './ensure-tenant-role-instance-from-template.command'
export * from './ensure-tenant-role-instance-from-template.handler'
export * from './sync-role-navigation-from-template.command'
export * from './sync-role-navigation-from-template.handler'
export * from './update-role.command'
export * from './update-role.handler'
export * from './set-role-enabled.command'
export * from './set-role-enabled.handler'
export * from './delete-role.command'
export * from './delete-role.handler'
export * from './assign-role-permission.command'
export * from './assign-role-permission.handler'
export * from './revoke-role-permission.command'
export * from './revoke-role-permission.handler'
export * from './assign-account-role.command'
export * from './assign-account-role.handler'
export * from './grant-initial-access-for-employee-account.command'
export * from './grant-initial-access-for-employee-account.handler'
export * from './grant-initial-access-for-tenant-account.command'
export * from './grant-initial-access-for-tenant-account.handler'
export * from './revoke-account-role.command'
export * from './revoke-account-role.handler'
export * from './set-account-roles.command'
export * from './set-account-roles.handler'

import { CreateRoleTemplateHandler } from './create-role-template.handler'
import { UpdateRoleTemplateHandler } from './update-role-template.handler'
import { DeleteRoleTemplateHandler } from './delete-role-template.handler'
import { SetRoleTemplateEnabledHandler } from './set-role-template-enabled.handler'
import { AssignRoleTemplatePermissionHandler } from './assign-role-template-permission.handler'
import { RevokeRoleTemplatePermissionHandler } from './revoke-role-template-permission.handler'
import { CreateRoleInstanceHandler } from './create-role-instance.handler'
import { CreateRoleInstanceFromTemplateHandler } from './create-role-instance-from-template.handler'
import { EnsureTenantRoleInstanceFromTemplateHandler } from './ensure-tenant-role-instance-from-template.handler'
import { SyncRoleNavigationFromTemplateHandler } from './sync-role-navigation-from-template.handler'
import { UpdateRoleHandler } from './update-role.handler'
import { SetRoleEnabledHandler } from './set-role-enabled.handler'
import { DeleteRoleHandler } from './delete-role.handler'
import { AssignRolePermissionHandler } from './assign-role-permission.handler'
import { RevokeRolePermissionHandler } from './revoke-role-permission.handler'
import { AssignAccountRoleHandler } from './assign-account-role.handler'
import { GrantInitialAccessForEmployeeAccountHandler } from './grant-initial-access-for-employee-account.handler'
import { GrantInitialAccessForTenantAccountHandler } from './grant-initial-access-for-tenant-account.handler'
import { RevokeAccountRoleHandler } from './revoke-account-role.handler'
import { SetAccountRolesHandler } from './set-account-roles.handler'

export const RoleTemplateCommandHandlers = [
  CreateRoleTemplateHandler,
  UpdateRoleTemplateHandler,
  DeleteRoleTemplateHandler,
  SetRoleTemplateEnabledHandler,
  AssignRoleTemplatePermissionHandler,
  RevokeRoleTemplatePermissionHandler
]

export const RoleInstanceCommandHandlers = [
  CreateRoleInstanceHandler,
  CreateRoleInstanceFromTemplateHandler,
  EnsureTenantRoleInstanceFromTemplateHandler,
  SyncRoleNavigationFromTemplateHandler,
  UpdateRoleHandler,
  SetRoleEnabledHandler,
  DeleteRoleHandler,
  AssignRolePermissionHandler,
  RevokeRolePermissionHandler
]

export const AccountRoleCommandHandlers = [
  AssignAccountRoleHandler,
  GrantInitialAccessForEmployeeAccountHandler,
  GrantInitialAccessForTenantAccountHandler,
  RevokeAccountRoleHandler,
  SetAccountRolesHandler
]

export const RoleCommandHandlers = [
  ...RoleTemplateCommandHandlers,
  ...RoleInstanceCommandHandlers,
  ...AccountRoleCommandHandlers
]
