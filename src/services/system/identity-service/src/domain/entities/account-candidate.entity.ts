export class AccountCandidateEntity {
  constructor(
    public readonly accountId: string,
    public readonly tenantId: string,
    public readonly displayName: string | null,
    public readonly isEnabled: boolean
  ) {}
}
