import { AccountRoleController } from './account-role.controller'
import { NavigationController } from './navigation.controller'
import { PermissionController } from './permission.controller'
import { PolicyInstanceController } from './policy-instance.controller'
import { PolicyInstancePreviewController } from './policy-instance-preview.controller'
import { PolicyController } from './policy.controller'
import { RoleTemplateController } from './role-template.controller'
import { RoleController } from './role.controller'

const httpControllers = [
  PermissionController,
  PolicyInstanceController,
  PolicyInstancePreviewController,
  PolicyController,
  NavigationController,
  RoleController,
  RoleTemplateController,
  AccountRoleController
]

export { httpControllers }
