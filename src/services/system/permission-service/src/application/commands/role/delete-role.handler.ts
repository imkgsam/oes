import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { DeleteRoleCommand } from './delete-role.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ROLE_DELETE_FORBIDDEN,
  ROLE_NOT_FOUND
} from '../../../common/constants/exception-enums'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: DeleteRoleCommand): Promise<Role> {
    const existing = await this.roleRepo.findById(command.id)
    if (!existing || !existing.isAssignable) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    assertRoleScopeAccess(
      command.operatorScope,
      existing.kind === RoleKind.SYSTEM_INSTANCE ? ScopeLevel.SYSTEM : ScopeLevel.TENANT,
      existing.tenantId,
      { roleId: existing.id }
    )

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
