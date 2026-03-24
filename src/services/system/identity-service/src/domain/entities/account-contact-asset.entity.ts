export class AccountContactAssetEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly accountId: string,
    public readonly type: string,
    public readonly value: string,
    public readonly status: string,
    public readonly isPrimary: boolean,
    public readonly assignedAt: Date,
    public readonly revokedAt: Date | null
  ) {}
}
