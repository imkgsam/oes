import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SetAccountRolesCommand } from './set-account-roles.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ROLE_NOT_ASSIGNABLE, ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'
import { AccountRole } from '../../../domain/vo/account-role.value-object'
import { AccountType } from '../../../domain/enums/account-type.enum'
import {
  IDENTITY_ACCOUNT_REFERENCE_PORT,
  IdentityAccountReferencePort
} from '../../ports/identity-account-reference.port'

@CommandHandler(SetAccountRolesCommand)
export class SetAccountRolesHandler implements ICommandHandler<
  SetAccountRolesCommand,
  { roles: Role[]; bindings: AccountRole[] }
> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(IDENTITY_ACCOUNT_REFERENCE_PORT)
    private readonly identityAccountReferencePort: IdentityAccountReferencePort
  ) {}

  /** execute validates the principal and replaces active bindings without deleting binding history. */
  async execute(
    command: SetAccountRolesCommand
  ): Promise<{ roles: Role[]; bindings: AccountRole[] }> {
    assertRoleScopeAccess(command.operatorScope, command.scopeLevel, command.tenantId, {
      requestedTenantId: command.tenantId
    })

    const requestedRoleIds = [...new Set(command.roleIds)]
    const tenantId = command.scopeLevel === ScopeLevel.SYSTEM ? null : command.tenantId!
    const principalReference =
      command.accountType === AccountType.SERVICE
        ? await this.identityAccountReferencePort.getServiceAccountById(command.accountId)
        : await this.identityAccountReferencePort.getAccountById(command.accountId)
    if (
      !principalReference ||
      !principalReference.isActive ||
      principalReference.scopeLevel !== command.scopeLevel ||
      principalReference.tenantId !== tenantId
    ) {
      throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE)
    }
    const assignableRoles =
      command.scopeLevel === ScopeLevel.SYSTEM
        ? await this.roleRepo.findSystemRoles()
        : await this.roleRepo.findTenantRoles(tenantId!)
    const rolesById = new Map(assignableRoles.map((role) => [role.id, role]))
    const expectedRoleKind =
      command.scopeLevel === ScopeLevel.SYSTEM ? RoleKind.SYSTEM_INSTANCE : RoleKind.TENANT_INSTANCE

    for (const roleId of requestedRoleIds) {
      const role = rolesById.get(roleId)
      if (!role) {
        const exists = await this.roleRepo.findById(roleId)
        throw ExceptionFactory.domain(exists ? ROLE_NOT_ASSIGNABLE : ROLE_NOT_FOUND)
      }

      if (role.kind !== expectedRoleKind || role.tenantId !== tenantId || !role.isEnabled) {
        throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE)
      }
    }

    return this.roleRepo.replaceAccountRoles(
      command.accountId,
      tenantId,
      command.scopeLevel,
      command.accountType,
      requestedRoleIds,
      {
        operatorId: command.operatorScope?.operatorId ?? 'system',
        requestId: command.operatorScope?.requestId,
        traceId: command.operatorScope?.traceId
      }
    )
  }
}
