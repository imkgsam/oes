export class AuditEventEntity {
  constructor(
    public readonly id: string,
    public readonly actorType: 'USER' | 'SERVICE' | 'SYSTEM',
    public readonly actorId: string,
    public readonly action: string,
    public readonly targetType: 'ROLE' | 'PERMISSION' | 'POLICY' | 'ACCOUNT_ROLE' | 'ROLE_PERMISSION',
    public readonly targetId: string,
    public readonly createdAt: Date,
    public readonly tenantId?: string,
    public readonly targetCode?: string,
    public readonly beforeData?: Record<string, unknown>,
    public readonly afterData?: Record<string, unknown>,
    public readonly metadata?: Record<string, unknown>
  ) {}
}
