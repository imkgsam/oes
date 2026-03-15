import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { RevokeRolePermissionCommand } from './revoke-role-permission.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(RevokeRolePermissionCommand)
export class RevokeRolePermissionHandler implements ICommandHandler<RevokeRolePermissionCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: RevokeRolePermissionCommand): Promise<void> {
    const role = await this.roleRepo.findById(command.roleId)
    if (!role) throw ExceptionFactory.domain(ROLE_NOT_FOUND)

    role.removePermissionById(command.permissionId)
    await this.roleRepo.save(role)
  }
}
