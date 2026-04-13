import { Role } from '../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../domain/enums/role-kind.enum'
import { RolePermission } from '../../domain/vo/role-permission.value-object'

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
      (record.kind as RoleKind | undefined) ??
        (record.isSystem ? RoleKind.SYSTEM_TEMPLATE : RoleKind.TENANT_INSTANCE),
      record.isEnabled ?? true,
      record.description ?? undefined,
      record.templateRoleId ?? null,
      permissions
    )
  }

  static toPersistent(role: Role) {
    const scopeKey =
      role.kind === RoleKind.TENANT_INSTANCE
        ? role.tenantId!
        : role.kind === RoleKind.SYSTEM_INSTANCE
          ? '__SYSTEM__'
          : '__SYSTEM_TEMPLATE__'

    return {
      id: role.id,
      name: role.name,
      code: role.code,
      tenantId: role.tenantId,
      scopeKey,
      kind: role.kind,
      templateRoleId: role.templateRoleId,
      isEnabled: role.isEnabled,
      description: role.description
    }
  }
}
