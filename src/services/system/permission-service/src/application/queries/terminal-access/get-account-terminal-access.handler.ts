import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { normalizeTerminalAccessList } from '../../../domain/constants/terminal-access-terminal'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'
import { GetAccountTerminalAccessQuery } from './get-account-terminal-access.query'

export interface AccountTerminalAccessResult {
  accountId: string
  tenantId?: string
  scopeLevel: ScopeLevel
  hasOverride: boolean
  effectiveAllowedTerminals: string[]
}

/** GetAccountTerminalAccessHandler returns only the final account terminal access set for management display. */
@QueryHandler(GetAccountTerminalAccessQuery)
export class GetAccountTerminalAccessHandler
  implements IQueryHandler<GetAccountTerminalAccessQuery, AccountTerminalAccessResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.ROLE)
    private readonly roleRepo: RoleRepository,
    @Inject(SYMBOLS.REPO.TERMINAL_ACCESS)
    private readonly terminalAccessRepo: TerminalAccessRepository
  ) {}

  async execute(query: GetAccountTerminalAccessQuery): Promise<AccountTerminalAccessResult> {
    const tenantId = query.scopeLevel === ScopeLevel.SYSTEM ? null : query.tenantId?.trim()
    const accountOverride = await this.terminalAccessRepo.findAccountOverride(
      query.accountId,
      tenantId,
      query.scopeLevel
    )
    const effectiveAllowedTerminals = accountOverride
      ? normalizeTerminalAccessList(accountOverride.allowedTerminals)
      : await this.resolveRoleUnion(query.accountId, tenantId, query.scopeLevel)

    return {
      accountId: query.accountId,
      tenantId: tenantId ?? undefined,
      scopeLevel: query.scopeLevel,
      hasOverride: Boolean(accountOverride),
      effectiveAllowedTerminals
    }
  }

  private async resolveRoleUnion(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel
  ): Promise<string[]> {
    const roles = await this.roleRepo.findAccountRoles(accountId, tenantId, scopeLevel)
    const facts = await this.terminalAccessRepo.findRoleTerminalAccess(roles.map((role) => role.id))
    return normalizeTerminalAccessList(facts.flatMap((fact) => fact.allowedTerminals))
  }
}
