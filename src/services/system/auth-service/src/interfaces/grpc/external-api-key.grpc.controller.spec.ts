import { ExternalApiKeyGrpcController } from './external-api-key.grpc.controller'

describe('ExternalApiKeyGrpcController', () => {
  it('maps create to the service and returns only one-time key plus safe id', async () => {
    const service: any = { create: jest.fn().mockResolvedValue({ credentialId: 'c', apiKey: 'oek_live_id.secret' }) }
    const controller = new ExternalApiKeyGrpcController(service)
    const result = await controller.createExternalApiKey({ integrationMachineId: 'm' }, undefined, undefined)
    expect(service.create).toHaveBeenCalled(); expect(result).toEqual({ apiKey: 'oek_live_id.secret', credential: { credentialId: 'c' } }); expect(JSON.stringify(result)).not.toMatch(/verifier|pepper|trust/i)
  })
})

it('maps masked list and safe idempotent revoke responses', async () => {
  const service: any = { list: jest.fn().mockResolvedValue([{ id: 'c', keyIdentifier: 'masked', integrationMachineId: 'm', status: 'ACTIVE' }]), revoke: jest.fn().mockResolvedValue(undefined) }
  const controller = new ExternalApiKeyGrpcController(service)
  const list = await controller.listExternalApiKeys({ integrationMachineId: 'm' }, undefined, undefined)
  const revoke = await controller.revokeExternalApiKey({ credentialId: 'c' }, undefined, undefined)
  expect(list).toEqual({ credentials: [{ credentialId: 'c', keyIdentifier: 'masked', integrationMachineId: 'm', status: 'ACTIVE' }] })
  expect(revoke).toEqual({ credential: { credentialId: 'c', status: 'REVOKED' } })
  expect(JSON.stringify({ list, revoke })).not.toMatch(/secret|verifier|pepper|token/i)
})

it('maps rotate with credentialId only and safe predecessor metadata', async () => {
  const until = new Date('2026-08-08T00:00:00.000Z')
  const service: any = { rotate: jest.fn().mockResolvedValue({ credentialId: 'replacement', apiKey: 'oek_live_new.secret', predecessorValidUntil: until }) }
  const controller = new ExternalApiKeyGrpcController(service)
  const response = await controller.rotateExternalApiKey({ credentialId: 'predecessor' }, undefined, undefined)
  expect(service.rotate).toHaveBeenCalledWith('predecessor', expect.anything())
  expect(response).toEqual({ apiKey: 'oek_live_new.secret', credential: { credentialId: 'replacement' }, predecessorCredentialId: 'predecessor', predecessorValidUntilUnixSeconds: String(Math.floor(until.getTime() / 1000)) })
  expect(JSON.stringify(response)).not.toMatch(/verifier|pepper|token/i)
})
