import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SetAccountRolesCommand } from './set-account-roles.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_ASSIGNABLE, ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'

@CommandHandler(SetAccountRolesCommand)
export class SetAccountRolesHandler implements ICommandHandler<SetAccountRolesCommand, Role[]> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: SetAccountRolesCommand): Promise<Role[]> {
    const requestedRoleIds = [...new Set(command.roleIds)]
    const tenantRoles = await this.roleRepo.findTenantRoles(command.tenantId)
    const tenantRolesById = new Map(tenantRoles.map((role) => [role.id, role]))

    for (const roleId of requestedRoleIds) {
      const role = tenantRolesById.get(roleId)
      if (!role) {
        const exists = await this.roleRepo.findById(roleId)
        throw ExceptionFactory.domain(exists ? ROLE_NOT_ASSIGNABLE : ROLE_NOT_FOUND)
      }

      if (role.kind !== RoleKind.TENANT_INSTANCE || role.tenantId !== command.tenantId) {
        throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE)
      }
    }

    return this.roleRepo.replaceAccountRoles(
      command.accountId,
      command.tenantId,
      command.accountType,
      requestedRoleIds
    )
  }
}
