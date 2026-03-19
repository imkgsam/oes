import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { RevokeRoleTemplatePermissionCommand } from './revoke-role-template-permission.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_TEMPLATE_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(RevokeRoleTemplatePermissionCommand)
export class RevokeRoleTemplatePermissionHandler
  implements ICommandHandler<RevokeRoleTemplatePermissionCommand>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: RevokeRoleTemplatePermissionCommand): Promise<void> {
    const role = await this.roleRepo.findById(command.roleTemplateId)
    if (!role || role.kind !== RoleKind.SYSTEM_TEMPLATE) {
      throw ExceptionFactory.domain(ROLE_TEMPLATE_NOT_FOUND)
    }

    role.removePermissionById(command.permissionId)
    await this.roleRepo.save(role)
  }
}
