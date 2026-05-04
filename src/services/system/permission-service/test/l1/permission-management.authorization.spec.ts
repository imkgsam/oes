import 'reflect-metadata'
import { PermissionManagementGrpcController } from '../../src/interfaces/grpc/permission-management.grpc.controller'
import { REQUIRE_MANAGEMENT_PERMISSION_METADATA_KEY } from '../../src/interfaces/decorators'
import {
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  ROLE_INSTANCE_PERMISSION_CODES,
  ROLE_TEMPLATE_PERMISSION_CODES
} from '../../src/scripts/permission-catalog'

// Verifies role template and role instance gRPC endpoints no longer share coarse legacy role permissions.
describe('permission management gRPC authorization metadata', () => {
  const prototype = PermissionManagementGrpcController.prototype

  function requiredPermission(methodName: keyof PermissionManagementGrpcController): string | undefined {
    return Reflect.getMetadata(
      REQUIRE_MANAGEMENT_PERMISSION_METADATA_KEY,
      prototype[methodName]
    )
  }

  it.each([
    ['createRoleTemplate', ROLE_TEMPLATE_PERMISSION_CODES.CREATE],
    ['updateRoleTemplate', ROLE_TEMPLATE_PERMISSION_CODES.UPDATE],
    ['deleteRoleTemplate', ROLE_TEMPLATE_PERMISSION_CODES.DELETE],
    ['setRoleTemplateEnabled', ROLE_TEMPLATE_PERMISSION_CODES.UPDATE],
    ['listRoleTemplates', ROLE_TEMPLATE_PERMISSION_CODES.LIST],
    ['getRoleTemplateById', ROLE_TEMPLATE_PERMISSION_CODES.GET_BY_ID],
    ['listRoleTemplatePermissions', ROLE_TEMPLATE_PERMISSION_CODES.GET_BY_ID],
    ['assignRoleTemplatePermission', ROLE_TEMPLATE_PERMISSION_CODES.ASSIGN_PERMISSIONS],
    ['revokeRoleTemplatePermission', ROLE_TEMPLATE_PERMISSION_CODES.ASSIGN_PERMISSIONS]
  ] as const)('uses %s-specific authorization for %s', (methodName, expectedCode) => {
    expect(requiredPermission(methodName)).toBe(expectedCode)
  })

  it.each([
    ['createRoleInstance', ROLE_INSTANCE_PERMISSION_CODES.CREATE],
    ['createRoleInstanceFromTemplate', ROLE_INSTANCE_PERMISSION_CODES.CREATE_FROM_TEMPLATE],
    ['updateRole', ROLE_INSTANCE_PERMISSION_CODES.UPDATE],
    ['setRoleEnabled', ROLE_INSTANCE_PERMISSION_CODES.UPDATE],
    ['deleteRole', ROLE_INSTANCE_PERMISSION_CODES.DELETE],
    ['listRoleInstances', ROLE_INSTANCE_PERMISSION_CODES.LIST],
    ['getRoleById', ROLE_INSTANCE_PERMISSION_CODES.GET_BY_ID],
    ['listRolePermissions', ROLE_INSTANCE_PERMISSION_CODES.GET_BY_ID],
    ['assignRolePermission', ROLE_INSTANCE_PERMISSION_CODES.ASSIGN_PERMISSIONS],
    ['revokeRolePermission', ROLE_INSTANCE_PERMISSION_CODES.ASSIGN_PERMISSIONS],
    ['syncRoleNavigationFromTemplate', ROLE_INSTANCE_PERMISSION_CODES.SYNC_FROM_TEMPLATE],
    ['setRoleNavigationVisibility', ROLE_INSTANCE_PERMISSION_CODES.UPDATE],
    ['setRoleLandingPolicies', ROLE_INSTANCE_PERMISSION_CODES.UPDATE]
  ] as const)('uses %s-specific authorization for %s', (methodName, expectedCode) => {
    expect(requiredPermission(methodName)).toBe(expectedCode)
  })

  it('keeps account role assignment on the account role permission boundary', () => {
    expect(requiredPermission('assignAccountRole')).toBe(
      PERMISSION_MANAGEMENT_PERMISSION_CODES.ASSIGN_ACCOUNT_ROLE
    )
    expect(requiredPermission('setAccountRoles')).toBe(
      PERMISSION_MANAGEMENT_PERMISSION_CODES.SET_ACCOUNT_ROLES
    )
  })
})
