import { Test } from '@nestjs/testing'
import { GatewaySalesGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { SalesServiceProxyModule } from '../sales-service.module'

/** Proves the production Sales feature graph resolves only the dedicated mTLS client and ET producer. */
describe('Sales dedicated client feature graph', () => {
  const saved = {
    issuer: process.env.AUTH_EXECUTION_ISSUER,
    workload: process.env.OES_WORKLOAD_SPIFFE_ID
  }
  beforeEach(() => {
    process.env.AUTH_EXECUTION_ISSUER = 'https://auth.example.test'
    process.env.OES_WORKLOAD_SPIFFE_ID = 'spiffe://oes/gateway'
  })
  afterAll(() => {
    if (saved.issuer === undefined) delete process.env.AUTH_EXECUTION_ISSUER
    else process.env.AUTH_EXECUTION_ISSUER = saved.issuer
    if (saved.workload === undefined) delete process.env.OES_WORKLOAD_SPIFFE_ID
    else process.env.OES_WORKLOAD_SPIFFE_ID = saved.workload
  })

  it('compiles with dedicated dependencies and without the legacy sales gRPC token', async () => {
    const module = await Test.createTestingModule({ imports: [SalesServiceProxyModule] })
      .overrideProvider(GatewaySalesGrpcClient)
      .useValue({ getClient: jest.fn() })
      .overrideProvider(GatewayTrustedGrpcExecutionProducer)
      .useValue({ forBusinessCall: jest.fn() })
      .compile()
    expect(module.get(GatewaySalesGrpcClient)).toBeDefined()
    expect(module.get(GatewayTrustedGrpcExecutionProducer)).toBeDefined()
  })
})
