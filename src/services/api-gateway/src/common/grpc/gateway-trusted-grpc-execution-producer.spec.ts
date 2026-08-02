import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { DownstreamRequestSource } from './gateway-downstream-source.mapper'
import { GatewayTrustedGrpcExecutionProducer } from './gateway-trusted-grpc-execution-producer'

const AUDIENCE = 'urn:oes:service:asset-service'
const TRACEPARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'

/** Builds facts populated by the verified Gateway session boundary rather than an HTTP body. */
function trustedSessionSource(): DownstreamRequestSource {
  return {
    user: {
      holderId: 'account-123',
      userId: 'user-123',
      tenantId: 'tenant-123',
      orgId: 'org-123',
      sid: 'session-123',
      roles: ['role-that-must-not-propagate'],
      permissions: ['body.authority.must.not.propagate']
    },
    requestId: 'request-123',
    traceId: 'legacy-trace-id-must-not-be-authority',
    traceparent: TRACEPARENT,
    tracestate: 'vendor=value'
  }
}

/** Exercises Gateway's shared root-context wiring without migrating a target-specific adapter. */
describe('GatewayTrustedGrpcExecutionProducer', () => {
  it('builds immutable HUMAN authority from verified session facts and forwards exact BUSINESS declarations', async () => {
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const metadata = new Metadata()
    const provider = {
      forBusinessCall: jest.fn(async () => {
        expect(contextAccessor.requireCurrent()).toEqual({
          subject: 'account-123',
          principalType: 'HUMAN',
          tenantId: 'tenant-123',
          orgId: 'org-123',
          sessionId: 'session-123',
          requestId: 'request-123',
          traceparent: TRACEPARENT,
          tracestate: 'vendor=value'
        })
        expect(Object.isFrozen(contextAccessor.requireCurrent())).toBe(true)
        return metadata
      }),
      forSelfServiceCall: jest.fn(),
      forInternalCall: jest.fn()
    } as unknown as TrustedGrpcMetadataProvider
    const producer = new GatewayTrustedGrpcExecutionProducer(contextAccessor, provider)

    const result = await producer.forBusinessCall(trustedSessionSource(), AUDIENCE, [
      'asset.write',
      'asset.read'
    ])

    expect(result).toBe(metadata)
    expect(provider.forBusinessCall).toHaveBeenCalledWith(AUDIENCE, ['asset.write', 'asset.read'])
  })

  it('routes SELF_SERVICE and INTERNAL calls through the same trusted session root', async () => {
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const provider = {
      forBusinessCall: jest.fn(),
      forSelfServiceCall: jest.fn(async () => new Metadata()),
      forInternalCall: jest.fn(async () => new Metadata())
    } as unknown as TrustedGrpcMetadataProvider
    const producer = new GatewayTrustedGrpcExecutionProducer(contextAccessor, provider)

    await producer.forSelfServiceCall(trustedSessionSource(), AUDIENCE)
    await producer.forInternalCall(trustedSessionSource(), AUDIENCE, ['asset.internal.resolve'])

    expect(provider.forSelfServiceCall).toHaveBeenCalledWith(AUDIENCE)
    expect(provider.forInternalCall).toHaveBeenCalledWith(AUDIENCE, ['asset.internal.resolve'])
  })

  it('derives W3C propagation from the active trusted server span when source headers are absent', async () => {
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const provider = {
      forBusinessCall: jest.fn(async () => {
        expect(contextAccessor.requireCurrent().traceparent).toBe(TRACEPARENT)
        expect(contextAccessor.requireCurrent().tracestate).toBeUndefined()
        return new Metadata()
      }),
      forSelfServiceCall: jest.fn(),
      forInternalCall: jest.fn()
    } as unknown as TrustedGrpcMetadataProvider
    const producer = new GatewayTrustedGrpcExecutionProducer(contextAccessor, provider, {
      getTraceContext: () => ({ traceparent: TRACEPARENT })
    })
    const source = { ...trustedSessionSource(), traceparent: undefined, tracestate: undefined }

    await producer.forBusinessCall(source, AUDIENCE, ['asset.read'])

    expect(provider.forBusinessCall).toHaveBeenCalledTimes(1)
  })

  it('fails closed before producer access when verified session or W3C correlation facts are absent', async () => {
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const provider = {
      forBusinessCall: jest.fn(),
      forSelfServiceCall: jest.fn(),
      forInternalCall: jest.fn()
    } as unknown as TrustedGrpcMetadataProvider
    const producer = new GatewayTrustedGrpcExecutionProducer(contextAccessor, provider)

    await expect(
      producer.forBusinessCall({ ...trustedSessionSource(), user: undefined }, AUDIENCE, [
        'asset.read'
      ])
    ).rejects.toThrow('session')
    await expect(
      producer.forBusinessCall({ ...trustedSessionSource(), traceparent: undefined }, AUDIENCE, [
        'asset.read'
      ])
    ).rejects.toThrow('traceparent')
    expect(provider.forBusinessCall).not.toHaveBeenCalled()
  })
})
