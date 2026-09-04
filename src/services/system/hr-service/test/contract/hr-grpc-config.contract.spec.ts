import { buildHrOnboardingGrpcClients } from '../../src/modules/hr-onboarding/hr-onboarding.module'
import { AUTH_GRPC_CLIENT } from '../../src/infrastructure/adapters/auth-login-bootstrap-grpc.adapter'
import { HrTrustedExecutionModule } from '../../src/modules/hr-trusted-execution.module'
import { HrPartyTrustedGrpcClient } from '../../src/infrastructure/adapters/party-trusted-grpc.client'
import { HrPartyTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/hr-party-trusted-grpc-execution.producer'

describe('HR service downstream gRPC config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses the dedicated Party trusted execution module instead of generic Party registration', () => {
    expect(HrTrustedExecutionModule).toBeDefined()
    expect(HrPartyTrustedGrpcClient).toBeDefined()
    expect(HrPartyTrustedGrpcExecutionProducer).toBeDefined()
  })

  it('uses auth-service port 50050 for onboarding login bootstrap by default', () => {
    const clients = buildHrOnboardingGrpcClients()
    const authClient = clients.find((client) => client.name === AUTH_GRPC_CLIENT)

    expect(authClient?.options).toMatchObject({
      url: '127.0.0.1:50050'
    })
  })

})
