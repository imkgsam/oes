import { AccountRoleController } from './account-role.controller'
import { PermissionController } from './permission.controller'
import { RoleTemplateController } from './role-template.controller'
import { RoleController } from './role.controller'

const httpControllers = [
  PermissionController,
  RoleController,
  RoleTemplateController,
  AccountRoleController
]

export { httpControllers }
