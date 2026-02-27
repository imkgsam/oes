import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { RevokeAccountRoleCommand } from './revoke-account-role.command'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { SYMBOLS } from 'src/common/constants/symbols'

@CommandHandler(RevokeAccountRoleCommand)
export class RevokeAccountRoleHandler implements ICommandHandler<RevokeAccountRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: RevokeAccountRoleCommand): Promise<void> {
    await this.roleRepo.revokeAccountRole(command.accountId, command.roleId)
  }
}
