import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ROLE_NOT_FOUND } from '../../../common/constants/exception-enums'
import { SYMBOLS } from '../../../common/constants/symbols'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'
import { assertRoleScopeAccess } from '../../authorization/operator-scope'
import { SetRoleTerminalAccessCommand } from './set-role-terminal-access.command'

/** SetRoleTerminalAccessHandler enforces target role scope before replacing its terminal access defaults. */
@CommandHandler(SetRoleTerminalAccessCommand)
export class SetRoleTerminalAccessHandler implements ICommandHandler<SetRoleTerminalAccessCommand, void> {
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.TERMINAL_ACCESS)
    private readonly terminalAccessRepo: TerminalAccessRepository
  ) {}

  async execute(command: SetRoleTerminalAccessCommand): Promise<void> {
    const role = await this.roleRepo.findById(command.roleId)
    if (!role) {
      throw ExceptionFactory.application(ROLE_NOT_FOUND, { roleId: command.roleId })
    }

    const scopeLevel = role.kind === RoleKind.TENANT_INSTANCE ? ScopeLevel.TENANT : ScopeLevel.SYSTEM
    assertRoleScopeAccess(command.operatorScope, scopeLevel, role.tenantId, {
      roleId: role.id
    })

    await this.terminalAccessRepo.replaceRoleTerminalAccess(command.roleId, command.allowedTerminals)
  }
}
