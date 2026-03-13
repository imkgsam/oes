import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AssignRolePermissionCommand } from './assign-role-permission.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ROLE_NOT_FOUND,
  PERMISSION_NOT_FOUND
} from '../../../common/constants/exception-enums/permission-service.errors'

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

    const permission = await this.permissionRepo.findById(command.permissionId)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)

    const vo = new RolePermission(role.id, permission.id, permission.code)
    role.addPermission(vo)

    await this.roleRepo.save(role)
  }
}
