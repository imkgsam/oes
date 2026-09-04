import { ExternalApiKeyAuditService } from './external-api-key-audit.service'
describe('ExternalApiKeyAuditService', () => {
  it('projects only safe lifecycle references and outcome', async () => {
    const append = jest.fn()
    await new ExternalApiKeyAuditService(append).record({ eventType: 'EXCHANGE', credentialId: 'credential-1', machineId: 'machine-1', tenantId: 'tenant-1', outcome: 'DENIED' })
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ credentialId: 'credential-1', outcome: 'DENIED' }))
    expect(JSON.stringify(append.mock.calls)).not.toMatch(/oek_live|pepper|verifier|access_token/i)
  })
})
