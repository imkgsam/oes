import { toExternalApiKeyCredentialView } from './external-api-key-credential.view'
describe('external API-key credential view', () => {
  it('never projects verifier or verifier-key data', () => {
    const view = toExternalApiKeyCredentialView({
      id: 'c',
      integrationMachineId: 'm',
      tenantId: 't',
      keyIdentifier: 'id',
      status: 'ACTIVE',
      createdAt: new Date(),
      expiresAt: new Date(),
      verifier: 'secret',
      verifierKeyVersion: 'verifier-v1'
    })
    expect(JSON.stringify(view)).not.toMatch(/secret|verifier-v1/)
  })
})
