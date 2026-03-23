import {
  AccountRoleBindingResponse,
  PermissionResponse,
  RoleResponse
} from '@oes/common/generated/permission_service'
import { Permission } from '../../domain/aggregates/permission.aggregate'
import { Role } from '../../domain/aggregates/role.aggregate'
import { AccountRole } from '../../domain/vo/account-role.value-object'

export function toPermissionResponse(permission: Permission): PermissionResponse {
  return {
    id: permission.id,
    code: permission.code,
    module: permission.module,
    description: permission.description ?? ''
  }
}

export function toRoleResponse(role: Role): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    code: role.code,
    tenantId: role.tenantId ?? '',
    isSystem: role.isSystem,
    isEnabled: role.isEnabled,
    description: role.description ?? '',
    roleKind: role.kind as any,
    templateRoleId: role.templateRoleId ?? ''
  }
}

export function toAccountRoleBindingResponse(accountRole: AccountRole): AccountRoleBindingResponse {
  return {
    accountId: accountRole.accountId,
    accountType: accountRole.accountType,
    roleId: accountRole.roleId,
    tenantId: accountRole.tenantId
  }
}
