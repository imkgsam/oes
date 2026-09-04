import { BrowserActivityGrpcAdapter } from '../../../../../src/modules/browser-activity-bff/adapters/browser-activity-grpc.adapter'

/** Verifies the Browser adapter uses the target-bound producer instead of legacy metadata propagation. */
describe('BrowserActivityGrpcAdapter', () => {
  it('has no legacy metadata factory dependency', () => {
    const source = BrowserActivityGrpcAdapter.toString()
    expect(source).not.toContain('GrpcMetadataPropagationFactory')
    expect(source).toContain('trustedExecutionProducer')
  })
})
