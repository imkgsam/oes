import { AccountType } from '../enums/account-type.enum'
import { ScopeLevel } from '../enums/scope-level.enum'

/** Value object representing the binding between an account and a role */
export class AccountRole {
  constructor(
    public readonly accountType: AccountType,
    public readonly accountId: string,
    public readonly roleId: string,
    public readonly tenantId: string | null,
    public readonly scopeLevel: ScopeLevel,
    public readonly effectiveAt: Date | null = null,
    public readonly expiresAt: Date | null = null
  ) {}
}
