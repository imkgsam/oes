import { Role } from 'src/domain/aggregates/role.aggregate'
import { RolePermission } from 'src/domain/vo/role-permission.value-object'

export class RoleMapper {
  static toDomain(record: any): Role {
    const permissions = (record.permissions ?? []).map(
      (rp: any) => new RolePermission(rp.roleId, rp.permissionId, rp.permission?.code ?? '')
    )

    return new Role(
      record.id,
      record.name,
      record.code,
      record.tenantId ?? null,
      record.isSystem ?? false,
      record.isEnabled ?? true,
      record.description ?? undefined,
      permissions
    )
  }

  static toPersistent(role: Role) {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      tenantId: role.tenantId,
      isSystem: role.isSystem,
      isEnabled: role.isEnabled,
      description: role.description
    }
  }
}
