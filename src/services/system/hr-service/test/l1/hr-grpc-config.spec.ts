import { buildHrManagementGrpcClients } from '../../src/modules/hr-management/hr-management.module'
import { buildHrOnboardingGrpcClients } from '../../src/modules/hr-onboarding/hr-onboarding.module'
import { PARTY_GRPC_CLIENT } from '../../src/infrastructure/adapters/party-registration-grpc.adapter'
import { AUTH_GRPC_CLIENT } from '../../src/infrastructure/adapters/auth-login-bootstrap-grpc.adapter'

describe('HR service downstream gRPC config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.GRPC_SERVICE_PARTY_URL
    delete process.env.PARTY_GRPC_URL
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses party-service port 50053 for employee onboarding person-party registration by default', () => {
    const clients = buildHrManagementGrpcClients()
    const partyClient = clients.find((client) => client.name === PARTY_GRPC_CLIENT)

    expect(partyClient?.options).toMatchObject({
      url: '127.0.0.1:50053'
    })
  })

  it('uses auth-service port 50050 for onboarding login bootstrap by default', () => {
    const clients = buildHrOnboardingGrpcClients()
    const authClient = clients.find((client) => client.name === AUTH_GRPC_CLIENT)

    expect(authClient?.options).toMatchObject({
      url: '127.0.0.1:50050'
    })
  })

  it('prefers the standard GRPC_SERVICE_PARTY_URL while keeping legacy PARTY_GRPC_URL compatibility', () => {
    process.env.GRPC_SERVICE_PARTY_URL = '127.0.0.1:65053'
    process.env.PARTY_GRPC_URL = '127.0.0.1:65055'

    const clients = buildHrManagementGrpcClients()
    const partyClient = clients.find((client) => client.name === PARTY_GRPC_CLIENT)

    expect(partyClient?.options).toMatchObject({
      url: '127.0.0.1:65053'
    })
  })
})
