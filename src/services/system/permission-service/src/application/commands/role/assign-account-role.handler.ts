import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AssignAccountRoleCommand } from './assign-account-role.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ROLE_NOT_FOUND,
  ROLE_NOT_ASSIGNABLE,
  ACCOUNT_ROLE_ALREADY_ASSIGNED,
  ACCOUNT_ROLE_TIME_WINDOW_INVALID
} from '../../../common/constants/exception-enums'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'

@CommandHandler(AssignAccountRoleCommand)
export class AssignAccountRoleHandler implements ICommandHandler<AssignAccountRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository
  ) {}

  async execute(command: AssignAccountRoleCommand): Promise<void> {
    assertRoleScopeAccess(command.operatorScope, command.scopeLevel, command.tenantId, {
      requestedTenantId: command.tenantId
    })

    const role = await this.roleRepo.findById(command.roleId)
    if (!role) throw ExceptionFactory.domain(ROLE_NOT_FOUND)

    const expectedRoleKind =
      command.scopeLevel === ScopeLevel.SYSTEM
        ? RoleKind.SYSTEM_INSTANCE
        : RoleKind.TENANT_INSTANCE
    const tenantId = command.scopeLevel === ScopeLevel.SYSTEM ? null : command.tenantId!

    if (
      role.kind !== expectedRoleKind ||
      role.tenantId !== tenantId ||
      !role.isEnabled
    ) {
      throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE)
    }

    const effectiveAt = command.effectiveAt ? new Date(command.effectiveAt) : null
    const expiresAt = command.expiresAt ? new Date(command.expiresAt) : null

    if (effectiveAt && expiresAt && effectiveAt >= expiresAt) {
      throw ExceptionFactory.domain(ACCOUNT_ROLE_TIME_WINDOW_INVALID)
    }

    // Check if already assigned
    const existing = await this.roleRepo.findAccountRoles(
      command.accountId,
      tenantId,
      command.scopeLevel
    )
    if (existing.some((r) => r.id === command.roleId)) {
      throw ExceptionFactory.domain(ACCOUNT_ROLE_ALREADY_ASSIGNED)
    }

    await this.roleRepo.assignAccountRole(
      command.accountId,
      command.roleId,
      tenantId,
      command.scopeLevel,
      command.accountType,
      effectiveAt,
      expiresAt
    )
  }
}
