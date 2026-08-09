import { Metadata } from '@grpc/grpc-js'
import { GatewayMachineTrustedGrpcExecutionProducer } from './gateway-machine-trusted-grpc-execution-producer'

/** Verifies MACHINE token exchange preserves verified W3C continuity, including valid unsampled traces. */
describe('GatewayMachineTrustedGrpcExecutionProducer', () => {
  const original = process.env.GATEWAY_MACHINE_PRINCIPAL_ID
  beforeEach(() => { process.env.GATEWAY_MACHINE_PRINCIPAL_ID = 'spiffe://oes/gateway/runtime' })
  afterAll(() => { if (original === undefined) delete process.env.GATEWAY_MACHINE_PRINCIPAL_ID; else process.env.GATEWAY_MACHINE_PRINCIPAL_ID = original })
  it('accepts unsampled flags and passes tracestate into the trusted context', async () => {
    const run = jest.fn((_context, callback) => callback())
    const source = { run: jest.fn((callback) => callback()) }
    const metadata = { forInternalCall: jest.fn().mockResolvedValue(new Metadata()) }
    const producer = new GatewayMachineTrustedGrpcExecutionProducer(source as never, metadata as never, { run } as never)
    await producer.forInternalCall('urn:oes:service:site-service', 'site.internal.runtime.preview.read', { requestId: 'request-1', traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00', tracestate: 'vendor=value' }, async () => undefined)
    expect(run).toHaveBeenCalledWith(expect.objectContaining({ traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00', tracestate: 'vendor=value' }), expect.any(Function))
  })
  it('rejects malformed and all-zero W3C identifiers', async () => {
    const producer = new GatewayMachineTrustedGrpcExecutionProducer({ run: (callback) => callback() } as never, {} as never, {} as never)
    await expect(producer.forInternalCall('urn:oes:service:site-service', 'site.internal.runtime.preview.read', { requestId: 'request-1', traceparent: '00-00000000000000000000000000000000-0000000000000001-00' }, async () => undefined)).rejects.toThrow('MACHINE_TRACE_CONTEXT_REQUIRED')
  })
})
