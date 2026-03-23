export class AccountSummaryEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly displayName: string | null,
    public readonly isEnabled: boolean
  ) {}
}
