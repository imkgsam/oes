import { Test } from '@nestjs/testing'
import { GatewayCollaborationGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { AnnotationCommandGrpcAdapter } from './annotation-command-grpc.adapter'
import { AnnotationQueryGrpcAdapter } from './annotation-query-grpc.adapter'
import { TaskCommandGrpcAdapter } from './task-command-grpc.adapter'
import { TaskQueryGrpcAdapter } from './task-query-grpc.adapter'

/** Proves the Collaboration feature graph resolves its dedicated mTLS client and trusted producer. */
describe('Collaboration dedicated client feature graph', () => {
  const saved = {
    issuer: process.env.AUTH_EXECUTION_ISSUER,
    workload: process.env.OES_WORKLOAD_SPIFFE_ID
  }
  beforeEach(() => {
    process.env.AUTH_EXECUTION_ISSUER = 'https://auth.example.test'
    process.env.OES_WORKLOAD_SPIFFE_ID = 'spiffe://oes/gateway'
  })
  afterAll(() => {
    if (saved.issuer === undefined) delete process.env.AUTH_EXECUTION_ISSUER; else process.env.AUTH_EXECUTION_ISSUER = saved.issuer
    if (saved.workload === undefined) delete process.env.OES_WORKLOAD_SPIFFE_ID; else process.env.OES_WORKLOAD_SPIFFE_ID = saved.workload
  })

  it('resolves all four migrated adapters with dedicated dependencies and without the legacy Collaboration transport token', async () => {
    const module = await Test.createTestingModule({
      providers: [
        TaskCommandGrpcAdapter,
        TaskQueryGrpcAdapter,
        AnnotationCommandGrpcAdapter,
        AnnotationQueryGrpcAdapter,
        GatewayCollaborationGrpcClient,
        GatewayTrustedGrpcExecutionProducer
      ]
    })
      .overrideProvider(GatewayCollaborationGrpcClient)
      .useValue({ getClient: jest.fn() })
      .overrideProvider(GatewayTrustedGrpcExecutionProducer)
      .useValue({ forBusinessCall: jest.fn(), forSelfServiceCall: jest.fn() })
      .compile()
    expect(module.get(GatewayCollaborationGrpcClient)).toBeDefined()
    expect(module.get(GatewayTrustedGrpcExecutionProducer)).toBeDefined()
    expect(module.get(TaskCommandGrpcAdapter)).toBeInstanceOf(TaskCommandGrpcAdapter)
    expect(module.get(TaskQueryGrpcAdapter)).toBeInstanceOf(TaskQueryGrpcAdapter)
    expect(module.get(AnnotationCommandGrpcAdapter)).toBeInstanceOf(AnnotationCommandGrpcAdapter)
    expect(module.get(AnnotationQueryGrpcAdapter)).toBeInstanceOf(AnnotationQueryGrpcAdapter)
  })
})
