import { Metadata } from '@grpc/grpc-js'
import { CertificateBoundExecutionTokenCache } from '../../../../src/authorization/trusted-execution/certificate-bound-execution-token-cache'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  createTrustedExecutionContext
} from '../../../../src/authorization/trusted-execution/trusted-execution-context'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '../../../../src/authorization/trusted-execution/transport-private-source-credential'
import {
  ExecutionTokenExchangeClient,
  TrustedGrpcMetadataProvider
} from '../../../../src/authorization/trusted-execution/trusted-grpc-metadata-provider'
import { TrustedExecutionRegistry } from '../../../../src/authorization/trusted-execution/trusted-execution-registry'

const NOW_SECONDS = 1_800_000_000
const AUDIENCE = 'urn:oes:service:asset-service'
const SPIFFE_ID = 'spiffe://local.oes/ns/oes/sa/api-gateway'
const THUMBPRINT = 'n4bQgYhMfWWaL-qgxVrQFaO_Tc3T6Wf6Qpq5bKz7g8A'
const TRACEPARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
const SOURCE_CREDENTIAL = 'verified.session.source-credential'

/** Builds one immutable HUMAN execution root for metadata-provider tests. */
function executionContext(tenantId = 'tenant-123') {
  return createTrustedExecutionContext({
    subject: 'account-123',
    principalType: 'HUMAN',
    tenantId,
    orgId: 'org-123',
    sessionId: 'session-123',
    authzVersion: 7,
    requestId: 'request-123',
    traceparent: TRACEPARENT,
    tracestate: 'vendor=value'
  })
}

/** Builds the provider with a controllable exchange port and local certificate identity. */
function providerFixture(exchange: ExecutionTokenExchangeClient) {
  const contextAccessor = new AsyncLocalTrustedExecutionContextAccessor()
  const sourceCredentialAccessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
  const sourceCredentialIssuer = new TransportPrivateSourceCredentialIssuer()
  let certificateThumbprint = THUMBPRINT
  const provider = new TrustedGrpcMetadataProvider({
    contextAccessor,
    registry: new TrustedExecutionRegistry({
      issuer: 'https://auth.local.oes.example',
      audiences: [AUDIENCE],
      workloadIdentities: [SPIFFE_ID]
    }),
    tokenCache: new CertificateBoundExecutionTokenCache({
      now: () => NOW_SECONDS,
      refreshMarginSeconds: 30
    }),
    exchangeClient: exchange,
    sourceCredentialAccessor,
    localWorkloadIdentity: {
      getVerifiedWorkloadIdentity: async () => ({
        spiffeId: SPIFFE_ID,
        certificateThumbprint
      })
    },
    now: () => NOW_SECONDS
  })

  return {
    contextAccessor,
    provider,
    run: <T>(
      context: ReturnType<typeof executionContext>,
      callback: () => T,
      sourceCredential = SOURCE_CREDENTIAL
    ) =>
      sourceCredentialAccessor.run(
        sourceCredentialIssuer.issueVerifiedSessionAccessCredential(sourceCredential),
        () => contextAccessor.run(context, callback)
      ),
    rotateCertificate: () => {
      certificateThumbprint = 'A'.repeat(43)
    }
  }
}

/** Exercises the frozen single provider boundary for authority, cache, and trace propagation. */
describe('TrustedGrpcMetadataProvider', () => {
  it('exchanges only exact target authority and emits bearer plus W3C correlation metadata', async () => {
    const exchange: ExecutionTokenExchangeClient = {
      exchange: jest.fn(async (request) => ({
        accessToken: 'e30.e30.c2ln',
        tokenType: 'Bearer',
        expiresAtUnixSeconds: NOW_SECONDS + 240,
        expiresInSeconds: 240,
        kid: 'key-1',
        grantedPermissionCodes: request.requestedPermissionCodes,
        grantedAudience: request.targetAudience
      }))
    }
    const fixture = providerFixture(exchange)

    const metadata = await fixture.run(executionContext(), () =>
      fixture.provider.forBusinessCall(AUDIENCE, ['asset.write', ' asset.read '])
    )

    expect(exchange.exchange).toHaveBeenCalledWith(
      {
        targetAudience: AUDIENCE,
        requestedPermissionCodes: ['asset.read', 'asset.write']
      },
      expect.any(Metadata)
    )
    expect(Object.keys((exchange.exchange as jest.Mock).mock.calls[0][0])).toEqual([
      'targetAudience',
      'requestedPermissionCodes'
    ])
    const exchangeMetadata = (exchange.exchange as jest.Mock).mock.calls[0][1] as Metadata
    expect(exchangeMetadata.get('authorization')).toEqual([`Bearer ${SOURCE_CREDENTIAL}`])
    expect(exchangeMetadata.get('x-operator-context')).toEqual([])
    expect(metadata).toBeInstanceOf(Metadata)
    expect(metadata.get('authorization')).toEqual(['Bearer e30.e30.c2ln'])
    expect(metadata.get('x-request-id')).toEqual(['request-123'])
    expect(metadata.get('x-trace-id')).toEqual(['4bf92f3577b34da6a3ce929d0e0e4736'])
    expect(metadata.get('traceparent')).toEqual([TRACEPARENT])
    expect(metadata.get('tracestate')).toEqual(['vendor=value'])
    expect(metadata.get('x-internal-service-name')).toEqual([])
    expect(metadata.get('x-operator-context')).toEqual([])
    expect(JSON.stringify(executionContext())).not.toContain(SOURCE_CREDENTIAL)
    expect(JSON.stringify(metadata.getMap())).not.toContain(SOURCE_CREDENTIAL)
  })

  it('reuses only an exact authority and current certificate binding', async () => {
    let tokenSequence = 0
    const exchange: ExecutionTokenExchangeClient = {
      exchange: jest.fn(async (request) => {
        tokenSequence += 1
        return {
          accessToken: `e30.e30.c2ln${tokenSequence}`,
          tokenType: 'Bearer',
          expiresAtUnixSeconds: NOW_SECONDS + 240,
          expiresInSeconds: 240,
          kid: `key-${tokenSequence}`,
          grantedPermissionCodes: request.requestedPermissionCodes,
          grantedAudience: request.targetAudience
        }
      })
    }
    const fixture = providerFixture(exchange)

    await fixture.run(executionContext(), () =>
      fixture.provider.forInternalCall(AUDIENCE, ['asset.internal.resolve'])
    )
    await fixture.run(
      executionContext(),
      () => fixture.provider.forInternalCall(AUDIENCE, ['asset.internal.resolve']),
      'rotated.session.source-credential'
    )
    await fixture.run(executionContext('tenant-456'), () =>
      fixture.provider.forInternalCall(AUDIENCE, ['asset.internal.resolve'])
    )
    fixture.rotateCertificate()
    await fixture.run(executionContext(), () =>
      fixture.provider.forInternalCall(AUDIENCE, ['asset.internal.resolve'])
    )

    expect(exchange.exchange).toHaveBeenCalledTimes(4)
  })

  it('uses the controlled empty permission set only for SELF_SERVICE', async () => {
    const exchange: ExecutionTokenExchangeClient = {
      exchange: jest.fn(async (request) => ({
        accessToken: 'e30.e30.c2ln',
        tokenType: 'Bearer',
        expiresAtUnixSeconds: NOW_SECONDS + 240,
        expiresInSeconds: 240,
        kid: 'key-1',
        grantedPermissionCodes: request.requestedPermissionCodes,
        grantedAudience: request.targetAudience
      }))
    }
    const fixture = providerFixture(exchange)

    await fixture.run(executionContext(), () => fixture.provider.forSelfServiceCall(AUDIENCE))

    expect(exchange.exchange).toHaveBeenCalledWith(
      {
        targetAudience: AUDIENCE,
        requestedPermissionCodes: []
      },
      expect.any(Metadata)
    )
    await expect(
      fixture.run(executionContext(), () => fixture.provider.forBusinessCall(AUDIENCE, []))
    ).rejects.toThrow('BUSINESS')
  })

  it('fails closed on absent trusted context or an authority-mismatched STS response', async () => {
    const exchange: ExecutionTokenExchangeClient = {
      exchange: jest.fn(async () => ({
        accessToken: 'e30.e30.c2ln',
        tokenType: 'Bearer',
        expiresAtUnixSeconds: NOW_SECONDS + 240,
        expiresInSeconds: 240,
        kid: 'key-1',
        grantedPermissionCodes: ['asset.write'],
        grantedAudience: 'urn:oes:service:other-service'
      }))
    }
    const fixture = providerFixture(exchange)

    await expect(fixture.provider.forBusinessCall(AUDIENCE, ['asset.read'])).rejects.toThrow(
      'Trusted execution context'
    )
    await expect(
      fixture.contextAccessor.run(executionContext(), () =>
        fixture.provider.forBusinessCall(AUDIENCE, ['asset.read'])
      )
    ).rejects.toThrow('source credential')
    await expect(
      fixture.run(executionContext(), () =>
        fixture.provider.forBusinessCall(AUDIENCE, ['asset.read'])
      )
    ).rejects.toThrow('audience')
  })
})
