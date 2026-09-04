import 'reflect-metadata'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import { PermissionManagementGrpcController } from '../interfaces/grpc/permission-management.grpc.controller'
import { PermissionFoundationTrustedExecutionGuard } from '../modules/authorization/permission-trusted-execution.module'
import {
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  ROLE_INSTANCE_PERMISSION_CODES,
  ROLE_TEMPLATE_PERMISSION_CODES
} from '../scripts/permission-catalog'

// Verifies role template and role instance gRPC endpoints declare exact ET-enforced BUSINESS Codes.
describe('permission management trusted gRPC authorization metadata', () => {
  const prototype = PermissionManagementGrpcController.prototype

  /** Reads one exact Code only from the frozen BUSINESS execution declaration. */
  function requiredPermission(
    methodName: keyof PermissionManagementGrpcController
  ): string | undefined {
    const declaration = getRpcAuthorizationModeDeclaration(prototype, methodName)
    expect(declaration?.mode).toBe('BUSINESS')
    return declaration?.mode === 'BUSINESS' && 'all' in declaration.permissions
      ? declaration.permissions.all[0]
      : undefined
  }

  it('binds every Permission management declaration to the trusted ET guard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, PermissionManagementGrpcController)).toEqual(
      expect.arrayContaining([PermissionFoundationTrustedExecutionGuard])
    )
  })

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

  it('uses dedicated authorization for terminal access management', () => {
    expect(requiredPermission('getRoleTerminalAccess')).toBe(
      PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_TERMINAL_ACCESS
    )
    expect(requiredPermission('setRoleTerminalAccess')).toBe(
      PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ROLE_TERMINAL_ACCESS
    )
    expect(requiredPermission('getAccountTerminalAccess')).toBe(
      PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_TERMINAL_ACCESS
    )
    expect(requiredPermission('replaceAccountTerminalAccessOverride')).toBe(
      PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_TERMINAL_ACCESS
    )
    expect(requiredPermission('deleteAccountTerminalAccessOverride')).toBe(
      PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_TERMINAL_ACCESS
    )
  })
})
