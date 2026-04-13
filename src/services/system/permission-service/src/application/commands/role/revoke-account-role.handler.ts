import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { RevokeAccountRoleCommand } from './revoke-account-role.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'

@CommandHandler(RevokeAccountRoleCommand)
export class RevokeAccountRoleHandler implements ICommandHandler<RevokeAccountRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: RevokeAccountRoleCommand): Promise<void> {
    const role = await this.roleRepo.findById(command.roleId)
    if (!role?.isAssignable) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    assertRoleScopeAccess(
      command.operatorScope,
      role.kind === RoleKind.SYSTEM_INSTANCE ? ScopeLevel.SYSTEM : ScopeLevel.TENANT,
      role.tenantId,
      {
        roleId: role.id
      }
    )

    await this.roleRepo.revokeAccountRole(command.accountId, command.roleId)
  }
}
