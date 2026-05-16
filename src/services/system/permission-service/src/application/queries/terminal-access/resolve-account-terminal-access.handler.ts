import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTHORIZATION_DENIED } from '../../../common/constants/exception-enums'
import { SYMBOLS } from '../../../common/constants/symbols'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'
import {
  TerminalAccessResolution,
  TerminalAccessResolverService
} from '../../../domain/services/terminal-access-resolver.service'
import { ResolveAccountTerminalAccessQuery } from './resolve-account-terminal-access.query'

/** ResolveAccountTerminalAccessHandler assembles account role facts and delegates terminal access policy resolution. */
@QueryHandler(ResolveAccountTerminalAccessQuery)
export class ResolveAccountTerminalAccessHandler
  implements IQueryHandler<ResolveAccountTerminalAccessQuery, TerminalAccessResolution>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.TERMINAL_ACCESS)
    private readonly terminalAccessRepo: TerminalAccessRepository,
    private readonly resolver: TerminalAccessResolverService
  ) {}

  async execute(query: ResolveAccountTerminalAccessQuery): Promise<TerminalAccessResolution> {
    const tenantId = query.scopeLevel === ScopeLevel.SYSTEM ? null : query.tenantId?.trim()
    if (query.scopeLevel === ScopeLevel.TENANT && !tenantId) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        reason: 'tenant terminal access resolution requires tenantId'
      })
    }

    const roles = await this.roleRepo.findAccountRoles(query.accountId, tenantId, query.scopeLevel)
    const roleIds = roles.map((role) => role.id)
    const accountOverride = await this.terminalAccessRepo.findAccountOverride(
      query.accountId,
      tenantId,
      query.scopeLevel
    )
    const roleTerminalAccess = accountOverride
      ? []
      : await this.terminalAccessRepo.findRoleTerminalAccess(roleIds)

    return this.resolver.resolve({
      terminal: query.terminal,
      activeRoleIds: roleIds,
      roleTerminalAccess,
      accountOverride
    })
  }
}
