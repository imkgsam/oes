import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AssignRolePermissionCommand } from './assign-role-permission.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { PermissionKind } from '../../../domain/enums/permission-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ROLE_NOT_FOUND,
  ROLE_NOT_ASSIGNABLE,
  PERMISSION_NOT_FOUND,
  PERMISSION_NOT_ROLE_ASSIGNABLE
} from '../../../common/constants/exception-enums'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'

@CommandHandler(AssignRolePermissionCommand)
export class AssignRolePermissionHandler implements ICommandHandler<AssignRolePermissionCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: AssignRolePermissionCommand): Promise<void> {
    const role = await this.roleRepo.findById(command.roleId)
    if (!role) throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    if (!role.isAssignable) {
      throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE)
    }
    if (!role.allowTenantPermissionOverride || role.isProtected) {
      throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE, {
        roleId: role.id,
        roleCode: role.code,
        allowTenantPermissionOverride: role.allowTenantPermissionOverride,
        isProtected: role.isProtected
      })
    }

    assertRoleScopeAccess(
      command.operatorScope,
      role.kind === RoleKind.SYSTEM_INSTANCE ? ScopeLevel.SYSTEM : ScopeLevel.TENANT,
      role.tenantId,
      {
        roleId: role.id
      }
    )

    const permission = await this.permissionRepo.findById(command.permissionId)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)
    if (permission.kind === PermissionKind.INTERNAL) {
      throw ExceptionFactory.domain(PERMISSION_NOT_ROLE_ASSIGNABLE, {
        permissionCode: permission.code
      })
    }

    const vo = new RolePermission(role.id, permission.id, permission.code)
    role.addPermission(vo)

    await this.roleRepo.save(role)
  }
}
