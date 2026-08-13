import { Test } from '@nestjs/testing'
import { GatewayMesGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { MesServiceProxyModule } from '../mes-service.module'

/** Proves the MES feature graph resolves the dedicated mTLS client and trusted producer. */
describe('MES dedicated client feature graph', () => {
  beforeEach(() => {
    process.env.AUTH_EXECUTION_ISSUER = 'https://auth.example.test'
    process.env.OES_WORKLOAD_SPIFFE_ID = 'spiffe://oes/gateway'
  })
  it('compiles with dedicated dependencies', async () => {
    const module = await Test.createTestingModule({ imports: [MesServiceProxyModule] })
      .overrideProvider(GatewayMesGrpcClient).useValue({ getClient: jest.fn() })
      .overrideProvider(GatewayTrustedGrpcExecutionProducer).useValue({ forBusinessCall: jest.fn() })
      .compile()
    expect(module.get(GatewayMesGrpcClient)).toBeDefined()
    expect(module.get(GatewayTrustedGrpcExecutionProducer)).toBeDefined()
  })
})
