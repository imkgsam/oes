export class ServiceAccountEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string | null,
    public readonly scopeLevel: string,
    public readonly type: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string | null,
    public readonly disabledAt: Date | null,
    public readonly disabledBy: string | null
  ) {}
}
