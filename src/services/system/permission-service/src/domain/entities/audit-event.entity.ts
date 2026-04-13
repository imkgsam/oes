/**
 * AuditEventEntity represents one permission management audit record in the shared envelope read shape.
 */
export class AuditEventEntity {
  constructor(
    public readonly eventId: string,
    public readonly service: string,
    public readonly module: string,
    public readonly eventType: string,
    public readonly occurredAt: Date,
    public readonly result: string,
    public readonly operatorId: string | undefined,
    public readonly operatorType: string,
    public readonly tenantId: string | undefined,
    public readonly orgId: string | undefined,
    public readonly traceId: string | undefined,
    public readonly resourceType: string,
    public readonly resourceId: string | undefined,
    public readonly details: Record<string, unknown>
  ) {}
}
