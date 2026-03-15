import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { UpdateRoleCommand } from './update-role.command'

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    const role = await this.roleRepo.findById(command.id)
    if (!role) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    if (command.name !== undefined) {
      role.rename(command.name)
    }

    if (command.description !== undefined) {
      role.updateDescription(command.description || undefined)
    }

    return this.roleRepo.save(role)
  }
}
