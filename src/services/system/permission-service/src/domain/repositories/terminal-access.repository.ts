import { ScopeLevel } from '../enums/scope-level.enum'
import {
  AccountTerminalAccessOverrideFact,
  RoleTerminalAccessFact
} from '../services/terminal-access-resolver.service'

export interface TerminalAccessRepository {
  findRoleTerminalAccess(roleIds: readonly string[]): Promise<RoleTerminalAccessFact[]>
  findAccountOverride(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel
  ): Promise<AccountTerminalAccessOverrideFact | null>
  replaceRoleTerminalAccess(roleId: string, allowedTerminals: readonly string[]): Promise<void>
  replaceAccountOverride(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel,
    allowedTerminals: readonly string[]
  ): Promise<void>
  deleteAccountOverride(accountId: string, tenantId: string | null, scopeLevel: ScopeLevel): Promise<void>
}
