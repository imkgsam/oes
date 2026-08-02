/** Persists only safe API-key lifecycle references; this adapter has no credential or token fields by design. */
export class ExternalApiKeyAuditAdapter {
  constructor(private readonly append: (event: Record<string, unknown>) => Promise<void>) {}
  async record(input: { eventType: string; outcome: string; credentialId?: string; machineId: string; tenantId: string; operatorId?: string; traceId?: string; requestId?: string; correlationId?: string }): Promise<void> {
    await this.append({ service: 'auth-service', module: 'external-api-key', eventType: input.eventType, result: input.outcome, resourceType: 'external_api_key_credential', resourceId: input.credentialId, tenantId: input.tenantId, operatorId: input.operatorId, traceId: input.traceId, details: { machineId: input.machineId, requestId: input.requestId, correlationId: input.correlationId } })
  }
}
