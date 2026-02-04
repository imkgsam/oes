import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeleteRoleCommand } from './delete-role.command'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { Role } from 'src/domain/aggregates/role.aggregate'
import { SYMBOLS } from 'src/common/constants/symbols'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { PERMISSION_SERVICE_ERRORS } from '@oes/common/constants/res-codes/permission-service.errors'

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: DeleteRoleCommand): Promise<Role> {
    const existing = await this.roleRepo.findById(command.id)
    if (!existing) {
      throw createBusinessException(PERMISSION_SERVICE_ERRORS.ROLE_NOT_FOUND)
    }

    const deleted = await this.roleRepo.delete(command.id)
    if (!deleted) {
      throw createBusinessException(PERMISSION_SERVICE_ERRORS.ROLE_NOT_FOUND)
    }

    return deleted
  }
}
