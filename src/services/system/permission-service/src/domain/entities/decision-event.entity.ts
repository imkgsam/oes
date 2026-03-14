export class DecisionEventEntity {
  constructor(
    public readonly id: string,
    public readonly accountId: string,
    public readonly permissionCode: string,
    public readonly evaluationMode: 'RBAC' | 'RBAC_ABAC',
    public readonly decision: 'ALLOW' | 'DENY',
    public readonly createdAt: Date,
    public readonly tenantId?: string,
    public readonly resourceType?: string,
    public readonly resourceId?: string,
    public readonly matchedPolicyId?: string,
    public readonly matchedPolicyName?: string,
    public readonly reason?: string,
    public readonly requestContext?: Record<string, unknown>
  ) {}
}
