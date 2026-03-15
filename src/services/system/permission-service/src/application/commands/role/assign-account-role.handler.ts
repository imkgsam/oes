import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AssignAccountRoleCommand } from './assign-account-role.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ROLE_NOT_FOUND,
  ACCOUNT_ROLE_ALREADY_ASSIGNED
} from '../../../common/constants/exception-enums'

@CommandHandler(AssignAccountRoleCommand)
export class AssignAccountRoleHandler implements ICommandHandler<AssignAccountRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: AssignAccountRoleCommand): Promise<void> {
    const role = await this.roleRepo.findById(command.roleId)
    if (!role) throw ExceptionFactory.domain(ROLE_NOT_FOUND)

    // Check if already assigned
    const existing = await this.roleRepo.findAccountRoles(command.accountId, command.tenantId)
    if (existing.some((r) => r.id === command.roleId)) {
      throw ExceptionFactory.domain(ACCOUNT_ROLE_ALREADY_ASSIGNED)
    }

    await this.roleRepo.assignAccountRole(
      command.accountId,
      command.roleId,
      command.tenantId,
      command.accountType,
    )
  }
}
