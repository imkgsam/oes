import { AccountType } from '../enums/account-type.enum'
import { ScopeLevel } from '../enums/scope-level.enum'

/** AccountRole is the compatibility-facing view of one immutable PrincipalRoleBinding fact. */
export class AccountRole {
  constructor(
    public readonly accountType: AccountType,
    public readonly accountId: string,
    public readonly roleId: string,
    public readonly tenantId: string | null,
    public readonly scopeLevel: ScopeLevel,
    public readonly effectiveAt: Date | null = null,
    public readonly expiresAt: Date | null = null,
    public readonly bindingId: string = '',
    public readonly revokedAt: Date | null = null,
    public readonly revokedByOperatorId: string | null = null,
    public readonly revokeReason: string | null = null,
    public readonly revokeAuditEventId: string | null = null,
    public readonly grantAuditEventId: string | null = null
  ) {}
}
