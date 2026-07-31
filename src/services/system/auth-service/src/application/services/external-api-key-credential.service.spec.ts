import { ExternalApiKeyCredentialService } from './external-api-key-credential.service'

describe('ExternalApiKeyCredentialService', () => {
  it('rejects management without trusted human context before issuing a secret', () => {
    const service = new ExternalApiKeyCredentialService()

    expect(() => service.create({ trustedHuman: false, permitted: true })).toThrow(
      'EXTERNAL_API_KEY_MANAGEMENT_DENIED'
    )
  })

  it('rejects exchange unless the verified gateway internal policy is present', () => {
    const service = new ExternalApiKeyCredentialService()
    const issued = service.create({ trustedHuman: true, permitted: true })

    expect(() => service.exchange(issued.apiKey, { gatewayInternal: false })).toThrow(
      'EXTERNAL_API_KEY_INVALID'
    )
  })
})
