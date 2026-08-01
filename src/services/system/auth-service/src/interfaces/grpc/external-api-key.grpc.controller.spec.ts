import { ExternalApiKeyGrpcController } from './external-api-key.grpc.controller'

describe('ExternalApiKeyGrpcController', () => {
  it('maps create to the service and returns only one-time key plus safe id', async () => {
    const service: any = { create: jest.fn().mockResolvedValue({ credentialId: 'c', apiKey: 'oek_live_id.secret' }) }
    const controller = new ExternalApiKeyGrpcController(service)
    const result = await controller.createExternalApiKey({ integrationMachineId: 'm' }, undefined, undefined)
    expect(service.create).toHaveBeenCalled(); expect(result).toEqual({ apiKey: 'oek_live_id.secret', credential: { credentialId: 'c' } }); expect(JSON.stringify(result)).not.toMatch(/verifier|pepper|trust/i)
  })
})
