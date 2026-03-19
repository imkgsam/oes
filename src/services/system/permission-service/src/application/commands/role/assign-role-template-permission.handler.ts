import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AssignRoleTemplatePermissionCommand } from './assign-role-template-permission.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { RolePermission } from '../../../domain/vo/role-permission.value-object'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  PERMISSION_NOT_FOUND,
  ROLE_TEMPLATE_NOT_FOUND
} from '../../../common/constants/exception-enums'

@CommandHandler(AssignRoleTemplatePermissionCommand)
export class AssignRoleTemplatePermissionHandler
  implements ICommandHandler<AssignRoleTemplatePermissionCommand>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: AssignRoleTemplatePermissionCommand): Promise<void> {
    const role = await this.roleRepo.findById(command.roleTemplateId)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    const permission = await this.permissionRepo.findById(command.permissionId)
    if (!permission) throw ExceptionFactory.domain(PERMISSION_NOT_FOUND)

    role.addPermission(new RolePermission(role.id, permission.id, permission.code))
    await this.roleRepo.save(role)
  }
}
