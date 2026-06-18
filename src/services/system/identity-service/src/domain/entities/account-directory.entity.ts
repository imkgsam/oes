export class AccountDirectoryEntity {
  // Represents one account directory row returned to administrative account-management queries.
  constructor(
    public readonly accountId: string,
    public readonly userId: string,
    public readonly tenantId: null | string,
    public readonly tenantPartyId: null | string,
    public readonly scopeLevel: 'SYSTEM' | 'TENANT',
    public readonly displayName: null | string,
    public readonly userDisplayName: null | string,
    public readonly isEnabled: boolean
  ) {}
}
