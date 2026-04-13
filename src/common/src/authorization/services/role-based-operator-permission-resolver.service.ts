import { Injectable } from '@nestjs/common'
import { PermissionServicePermissionReadAdaptor } from '../adaptors'
import { OperatorContextPayload, OperatorPermissionResolver } from '../types'

@Injectable()
export class RoleBasedOperatorPermissionResolver implements OperatorPermissionResolver {
  constructor(
    private readonly permissionReadAdaptor: PermissionServicePermissionReadAdaptor
  ) {}

  async resolvePermissions(operatorContext: OperatorContextPayload): Promise<string[]> {
    const roleIds = this.getRoleIds(operatorContext)

    if (roleIds.length === 0) {
      return []
    }

    const permissionGroups = await Promise.all(
      roleIds.map((roleId) => this.permissionReadAdaptor.listPermissionCodesByRoleId(roleId))
    )

    return [...new Set(permissionGroups.flat())]
  }

  private getRoleIds(operatorContext: OperatorContextPayload): string[] {
    return [...new Set((operatorContext.operator_roles ?? []).map((roleId) => roleId.trim()))].filter(
      (roleId) => roleId.length > 0
    )
  }
}
