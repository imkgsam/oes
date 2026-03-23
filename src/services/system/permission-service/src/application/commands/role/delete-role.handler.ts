import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeleteRoleCommand } from './delete-role.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ROLE_DELETE_FORBIDDEN,
  ROLE_NOT_FOUND
} from '../../../common/constants/exception-enums'

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: DeleteRoleCommand): Promise<Role> {
    const existing = await this.roleRepo.findById(command.id)
    if (!existing || existing.kind !== RoleKind.TENANT_INSTANCE) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    const [hasAssignedAccounts, hasAssignedPermissions] = await Promise.all([
      this.roleRepo.hasAssignedAccounts(command.id),
      this.roleRepo.hasAssignedPermissions(command.id)
    ])

    if (hasAssignedAccounts || hasAssignedPermissions) {
      throw ExceptionFactory.domain(ROLE_DELETE_FORBIDDEN)
    }

    const deleted = await this.roleRepo.delete(command.id)
    if (!deleted) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    return deleted
  }
}
