import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { UpdateRoleCommand } from './update-role.command'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: UpdateRoleCommand): Promise<Role> {
    const role = await this.roleRepo.findById(command.id)
    if (!role || !role.isAssignable) {
      throw ExceptionFactory.domain(ROLE_NOT_FOUND)
    }

    assertRoleScopeAccess(
      command.operatorScope,
      role.kind === RoleKind.SYSTEM_INSTANCE ? ScopeLevel.SYSTEM : ScopeLevel.TENANT,
      role.tenantId,
      { roleId: role.id }
    )

    if (command.name !== undefined) {
      role.rename(command.name)
    }

    if (command.description !== undefined) {
      role.updateDescription(command.description || undefined)
    }

    return this.roleRepo.save(role)
  }
}
