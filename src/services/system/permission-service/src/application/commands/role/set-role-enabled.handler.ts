import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { SetRoleEnabledCommand } from './set-role-enabled.command'

@CommandHandler(SetRoleEnabledCommand)
export class SetRoleEnabledHandler implements ICommandHandler<SetRoleEnabledCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: SetRoleEnabledCommand): Promise<Role> {
    const role = await this.roleRepo.findById(command.id)
    if (!role) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    command.isEnabled ? role.enable() : role.disable()

    return this.roleRepo.save(role)
  }
}
