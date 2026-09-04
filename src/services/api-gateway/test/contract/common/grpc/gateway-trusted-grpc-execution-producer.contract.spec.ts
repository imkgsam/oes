import { Metadata } from '@grpc/grpc-js'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  AsyncLocalTrustedExecutionContextAccessor,
  TransportPrivateSourceCredentialIssuer,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { DownstreamRequestSource } from '../../../../src/common/grpc/gateway-downstream-source.mapper'
import { GatewayTrustedGrpcExecutionProducer } from '../../../../src/common/grpc/gateway-trusted-grpc-execution-producer'
import { GatewayVerifiedSourceCredentialBoundary } from '../../../../src/common/grpc/gateway-verified-source-credential.boundary'

const AUDIENCE = 'urn:oes:service:asset-service'
const TRACEPARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
const SOURCE_CREDENTIAL = 'verified.session.access-token'

/** Builds facts populated by the verified Gateway session boundary rather than an HTTP body. */
function trustedSessionSource(): DownstreamRequestSource {
  return {
    user: {
      holderId: 'account-123',
      userId: 'user-123',
      tenantId: 'tenant-123',
      orgId: 'org-123',
      sid: 'session-123',
      terminal: 'WEB',
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
          sessionTerminal: 'WEB',
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

  it('uses a self-audience subject token as the isolated source for a HUMAN_OBO INTERNAL hop', async () => {
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const sourceCredentialAccessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const selfToken = 'header.payload.signature'
    const targetMetadata = new Metadata()
    const provider = {
      forBusinessCall: jest.fn(),
      forSelfServiceCall: jest.fn(async () => {
        expect(sourceCredentialAccessor.useCurrent((credential) => credential)).toBe(
          SOURCE_CREDENTIAL
        )
        const metadata = new Metadata()
        metadata.set('authorization', `Bearer ${selfToken}`)
        return metadata
      }),
      forInternalCall: jest.fn(async () => {
        expect(sourceCredentialAccessor.useCurrent((credential) => credential)).toBe(selfToken)
        expect(contextAccessor.requireCurrent()).toEqual(
          expect.objectContaining({
            subject: 'account-123',
            tenantId: 'tenant-123',
            sessionId: 'session-123'
          })
        )
        return targetMetadata
      })
    } as unknown as TrustedGrpcMetadataProvider
    const producer = new GatewayTrustedGrpcExecutionProducer(
      contextAccessor,
      provider,
      undefined,
      sourceCredentialAccessor,
      issuer
    )

    const result = await sourceCredentialAccessor.run(
      issuer.issueVerifiedSessionAccessCredential(SOURCE_CREDENTIAL),
      () =>
        producer.forHumanOboInternalCall(
          trustedSessionSource(),
          'urn:oes:service:api-gateway',
          'urn:oes:service:permission-service',
          ['permission.internal.account_navigation.resolve']
        )
    )

    expect(result).toBe(targetMetadata)
    expect(provider.forSelfServiceCall).toHaveBeenCalledWith('urn:oes:service:api-gateway')
    expect(provider.forInternalCall).toHaveBeenCalledWith('urn:oes:service:permission-service', [
      'permission.internal.account_navigation.resolve'
    ])
  })

  it('keeps the verified session bearer in a separate transport-private scope', async () => {
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const sourceCredentialAccessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const boundary = new GatewayVerifiedSourceCredentialBoundary(
      {
        requireVerifiedSessionAccessCredential: () => SOURCE_CREDENTIAL,
        requireVerifiedExternalAccessCredential: () => 'verified.external.access-token'
      },
      new TransportPrivateSourceCredentialIssuer(),
      sourceCredentialAccessor
    )
    const provider = {
      forBusinessCall: jest.fn(async () => {
        expect(sourceCredentialAccessor.useCurrent((credential) => credential)).toBe(
          SOURCE_CREDENTIAL
        )
        const context = contextAccessor.requireCurrent()
        expect(Object.keys(context)).not.toContain('sourceCredential')
        expect(JSON.stringify(context)).not.toContain(SOURCE_CREDENTIAL)
        return new Metadata()
      }),
      forSelfServiceCall: jest.fn(),
      forInternalCall: jest.fn()
    } as unknown as TrustedGrpcMetadataProvider
    const producer = new GatewayTrustedGrpcExecutionProducer(contextAccessor, provider)

    await boundary.runWithVerifiedSessionAccessCredential(() =>
      producer.forBusinessCall(trustedSessionSource(), AUDIENCE, ['asset.read'])
    )

    expect(provider.forBusinessCall).toHaveBeenCalledWith(AUDIENCE, ['asset.read'])
  })

  it('does not promote raw header, body, or ordinary metadata values into source authority', async () => {
    const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
    const sourceCredentialAccessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const provider = {
      forBusinessCall: jest.fn(async () => {
        sourceCredentialAccessor.useCurrent(() => undefined)
        return new Metadata()
      }),
      forSelfServiceCall: jest.fn(),
      forInternalCall: jest.fn()
    } as unknown as TrustedGrpcMetadataProvider
    const producer = new GatewayTrustedGrpcExecutionProducer(contextAccessor, provider)
    const forgedSource = {
      ...trustedSessionSource(),
      authorization: `Bearer ${SOURCE_CREDENTIAL}`,
      headers: { authorization: `Bearer ${SOURCE_CREDENTIAL}` },
      body: { sourceCredential: SOURCE_CREDENTIAL },
      metadata: { authorization: `Bearer ${SOURCE_CREDENTIAL}` }
    }

    await expect(producer.forBusinessCall(forgedSource, AUDIENCE, ['asset.read'])).rejects.toThrow(
      'source credential is required'
    )
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

  it.each(['UNKNOWN', 'web', ' WEB', 'WEB '] as const)(
    'rejects non-canonical verified session terminal %s before exchange',
    async (terminal) => {
      const provider = {
        forBusinessCall: jest.fn(),
        forSelfServiceCall: jest.fn(),
        forInternalCall: jest.fn()
      } as unknown as TrustedGrpcMetadataProvider
      const producer = new GatewayTrustedGrpcExecutionProducer(
        new AsyncLocalTrustedExecutionContextAccessor(),
        provider
      )

      await expect(
        producer.forBusinessCall(
          { ...trustedSessionSource(), user: { ...trustedSessionSource().user!, terminal } },
          AUDIENCE,
          ['asset.read']
        )
      ).rejects.toThrow('session terminal')
      expect(provider.forBusinessCall).not.toHaveBeenCalled()
    }
  )
})
