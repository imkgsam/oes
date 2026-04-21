export class AccountCandidateEntity {
  // Represents a user account candidate that can establish a scoped web session.
  constructor(
    public readonly accountId: string,
    public readonly tenantId: string | null,
    public readonly tenantName: string | null,
    public readonly scopeLevel: 'SYSTEM' | 'TENANT',
    public readonly displayName: string | null,
    public readonly isEnabled: boolean
  ) {}
}
