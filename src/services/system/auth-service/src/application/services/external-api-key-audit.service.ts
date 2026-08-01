/** Emits a deliberately non-secret lifecycle audit projection for Auth-owned external API credentials. */
export class ExternalApiKeyAuditService {
  constructor(private readonly append: (event: { eventType: string; credentialId?: string; machineId: string; tenantId: string; outcome: string; correlationId?: string }) => Promise<void>) {}
  async record(input: { eventType: 'CREATE' | 'LIST' | 'ROTATE' | 'REVOKE' | 'EXCHANGE'; credentialId?: string; machineId: string; tenantId: string; outcome: string; correlationId?: string }): Promise<void> {
    await this.append({ eventType: input.eventType, credentialId: input.credentialId, machineId: input.machineId, tenantId: input.tenantId, outcome: input.outcome, correlationId: input.correlationId })
  }
}
