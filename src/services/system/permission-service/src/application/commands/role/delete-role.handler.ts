import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeleteRoleCommand } from './delete-role.command'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { Role } from 'src/domain/aggregates/role.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ExceptionFactory } from '@oes/common/core/exceptions/exception.factory'
import { ROLE_NOT_FOUND } from 'src/common/constants/exception-enums/permission-service.errors'

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: DeleteRoleCommand): Promise<Role> {
    const existing = await this.roleRepo.findById(command.id)
    if (!existing) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    const deleted = await this.roleRepo.delete(command.id)
    if (!deleted) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    return deleted
  }
}
