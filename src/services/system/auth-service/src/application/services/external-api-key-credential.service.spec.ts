import {
  ExternalApiKeyCredentialService,
  ExternalApiKeyCredentialStore
} from './external-api-key-credential.service'

const store = (): jest.Mocked<ExternalApiKeyCredentialStore> => ({
  create: jest.fn(),
  findByIdentifier: jest.fn(),
  listByMachine: jest.fn(),
  revoke: jest.fn()
})

describe('ExternalApiKeyCredentialService', () => {
  it('rejects management without trusted human context before issuing a secret', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)

    await expect(service.create({ trustedHuman: false, permitted: true, tenantId: 'tenant-1', integrationMachineId: 'machine-1' })).rejects.toThrow(
      'EXTERNAL_API_KEY_MANAGEMENT_DENIED'
    )
    expect(credentials.create).not.toHaveBeenCalled()
  })

  it('does not accept a caller-supplied gateway flag as exchange trust evidence', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)

    await expect(service.exchange('oek_live_identifier.secret', { trustedGatewayExchange: false as true })).rejects.toThrow(
      'EXTERNAL_API_KEY_INVALID'
    )
  })

  it('rejects exchange before credential lookup when trusted Gateway execution is absent', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)
    await expect(service.exchange('oek_live_identifier.secret', { trustedGatewayExchange: false as true })).rejects.toThrow('EXTERNAL_API_KEY_INVALID')
    expect(credentials.findByIdentifier).not.toHaveBeenCalled()
  })
})
