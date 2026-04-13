export class AccountSummaryEntity {
  // Represents the selected user account summary used by authentication and session context flows.
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tenantId: string | null,
    public readonly scopeLevel: 'SYSTEM' | 'TENANT',
    public readonly displayName: string | null,
    public readonly isEnabled: boolean
  ) {}
}
