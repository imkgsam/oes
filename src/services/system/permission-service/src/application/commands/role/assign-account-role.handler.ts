import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { AssignAccountRoleCommand } from './assign-account-role.command'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  ROLE_NOT_FOUND,
  ROLE_NOT_ASSIGNABLE,
  ACCOUNT_ROLE_TIME_WINDOW_INVALID
} from '../../../common/constants/exception-enums'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { AccountType } from '../../../domain/enums/account-type.enum'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'
import {
  IDENTITY_ACCOUNT_REFERENCE_PORT,
  IdentityAccountReferencePort
} from '../../ports/identity-account-reference.port'
import { AccountRole } from '../../../domain/vo/account-role.value-object'

@CommandHandler(AssignAccountRoleCommand)
export class AssignAccountRoleHandler implements ICommandHandler<AssignAccountRoleCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(IDENTITY_ACCOUNT_REFERENCE_PORT)
    private readonly identityAccountReferencePort: IdentityAccountReferencePort
  ) {}

  /** execute validates owner facts and creates exactly one immutable principal-role binding. */
  async execute(command: AssignAccountRoleCommand): Promise<AccountRole> {
    assertRoleScopeAccess(command.operatorScope, command.scopeLevel, command.tenantId, {
      requestedTenantId: command.tenantId
    })

    const role = await this.roleRepo.findById(command.roleId)
    if (!role) throw ExceptionFactory.domain(ROLE_NOT_FOUND)

    const expectedRoleKind =
      command.scopeLevel === ScopeLevel.SYSTEM ? RoleKind.SYSTEM_INSTANCE : RoleKind.TENANT_INSTANCE
    const tenantId = command.scopeLevel === ScopeLevel.SYSTEM ? null : command.tenantId!

    if (role.kind !== expectedRoleKind || role.tenantId !== tenantId || !role.isEnabled) {
      throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE)
    }

    const effectiveAt = command.effectiveAt ? new Date(command.effectiveAt) : null
    const expiresAt = command.expiresAt ? new Date(command.expiresAt) : null

    if (effectiveAt && expiresAt && effectiveAt >= expiresAt) {
      throw ExceptionFactory.domain(ACCOUNT_ROLE_TIME_WINDOW_INVALID)
    }

    await this.assertPrincipalReference(command, tenantId)

    return this.roleRepo.assignAccountRole(
      command.accountId,
      command.roleId,
      tenantId,
      command.scopeLevel,
      command.accountType,
      effectiveAt,
      expiresAt,
      {
        operatorId: command.operatorScope?.operatorId ?? 'system',
        requestId: command.operatorScope?.requestId,
        traceId: command.operatorScope?.traceId
      }
    )
  }

  /** assertPrincipalReference binds the requested HUMAN or MACHINE identifier to Identity-owned scope facts. */
  private async assertPrincipalReference(
    command: AssignAccountRoleCommand,
    tenantId: string | null
  ): Promise<void> {
    const reference =
      command.accountType === AccountType.SERVICE
        ? await this.identityAccountReferencePort.getServiceAccountById(command.accountId)
        : await this.identityAccountReferencePort.getAccountById(command.accountId)

    if (
      !reference ||
      !reference.isActive ||
      reference.scopeLevel !== command.scopeLevel ||
      reference.tenantId !== tenantId
    ) {
      throw ExceptionFactory.domain(ROLE_NOT_ASSIGNABLE, {
        principalId: command.accountId,
        principalType: command.accountType === AccountType.SERVICE ? 'MACHINE' : 'HUMAN',
        expectedScopeLevel: command.scopeLevel,
        expectedTenantId: tenantId,
        actualScopeLevel: reference?.scopeLevel,
        actualTenantId: reference?.tenantId,
        active: reference?.isActive ?? false
      })
    }
  }
}
