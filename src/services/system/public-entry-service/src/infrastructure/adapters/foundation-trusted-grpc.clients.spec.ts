import { Metadata } from '@grpc/grpc-js'
import { ClientProxyFactory } from '@nestjs/microservices'
import { inboundExecutionTokenCredentialScope } from '@oes/common/authorization'
import { readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { of } from 'rxjs'
import {
  buildPublicEntryMachineSourceCredentialMetadata,
  PUBLICENTRY_FOUNDATION_TARGETS,
  PublicEntryFoundationTrustedGrpcExecutionProducer,
  requirePublicEntryFoundationTarget
} from './foundation-trusted-grpc.clients'

jest.mock('@oes/common/transport', () => ({
  ...jest.requireActual('@oes/common/transport'),
  createGrpcClientCredentials: jest.fn(() => ({ mtls: true })),
  readLocalVerifiedWorkloadIdentity: jest.fn()
}))

const verifiedHumanExecution = Object.freeze({
  issuer: 'https://auth.local.oes.example',
  audience: 'urn:oes:service:public-entry-service',
  subject: 'account-701',
  principalType: 'HUMAN' as const,
  clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
  tenantId: 'tenant-701',
  orgId: 'org-701',
  permissionCodes: ['public-entry.business-card.read'],
  tokenId: 'token-701',
  issuedAt: 1,
  notBefore: 1,
  expiresAt: 9999999999,
  certificateThumbprint: 'A'.repeat(43),
  sessionId: 'session-701',
  sessionTerminal: 'WEB' as const,
  authzVersion: 7
})

/** Proves PublicEntry's target-bound profiles are exact, immutable and wildcard-free. */
describe('PublicEntry foundation trusted gRPC targets', () => {
  const savedEnvironment = {
    issuer: process.env.AUTH_EXECUTION_ISSUER,
    workloadSpiffeId: process.env.OES_WORKLOAD_SPIFFE_ID
  }

  afterEach(() => {
    if (savedEnvironment.issuer === undefined) delete process.env.AUTH_EXECUTION_ISSUER
    else process.env.AUTH_EXECUTION_ISSUER = savedEnvironment.issuer
    if (savedEnvironment.workloadSpiffeId === undefined) delete process.env.OES_WORKLOAD_SPIFFE_ID
    else process.env.OES_WORKLOAD_SPIFFE_ID = savedEnvironment.workloadSpiffeId
    jest.mocked(readLocalVerifiedWorkloadIdentity).mockReset()
    jest.restoreAllMocks()
  })

  it('contains only the frozen target set', () => {
    expect(Object.keys(PUBLICENTRY_FOUNDATION_TARGETS)).toEqual([
      'identity-service',
      'permission-service',
      'hr-service',
      'tenant-org-service'
    ])
    for (const target of Object.keys(PUBLICENTRY_FOUNDATION_TARGETS) as Array<
      keyof typeof PUBLICENTRY_FOUNDATION_TARGETS
    >) {
      const profile = requirePublicEntryFoundationTarget(target)
      expect(profile.audience).toBe(`urn:oes:service:${target}`)
      expect(profile.audience).not.toContain('*')
      expect(Object.isFrozen(profile)).toBe(true)
    }
  })

  it('propagates only verified public correlation to the Auth machine-source bootstrap', () => {
    const request = {}
    inboundExecutionTokenCredentialScope.preparePublicCorrelation(request, {
      requestId: 'public-card-request-701',
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
      tracestate: 'oes=public-card'
    })

    const metadata = inboundExecutionTokenCredentialScope.runPrepared(request, () =>
      buildPublicEntryMachineSourceCredentialMetadata()
    )
    expect(metadata.getMap()).toEqual({
      'x-request-id': 'public-card-request-701',
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
      tracestate: 'oes=public-card'
    })
  })

  it('fails closed when the machine-source bootstrap has no verified request correlation', () => {
    expect(() => buildPublicEntryMachineSourceCredentialMetadata()).toThrow(
      'Transport-private HUMAN OBO subject credential is required'
    )
  })

  it('carries exact HUMAN_OBO source and correlation metadata through the Auth exchange', async () => {
    process.env.AUTH_EXECUTION_ISSUER = 'https://auth.local.oes.example'
    process.env.OES_WORKLOAD_SPIFFE_ID =
      'spiffe://local.oes.internal/ns/oes/sa/public-entry-service'
    jest.mocked(readLocalVerifiedWorkloadIdentity).mockReturnValue({
      spiffeId: process.env.OES_WORKLOAD_SPIFFE_ID,
      certificateThumbprint: 'B'.repeat(43)
    })

    let exchangeMetadata: Metadata | undefined
    const exchangeExecutionToken = jest.fn((request, metadata: Metadata) => {
      exchangeMetadata = metadata
      return of({
        accessToken: 'exchanged.header.signature',
        tokenType: 'Bearer',
        expiresAtUnixSeconds: String(Math.floor(Date.now() / 1000) + 300),
        expiresInSeconds: '300',
        kid: 'public-entry-test-kid',
        grantedPermissionCodes: request.requestedPermissionCodes,
        grantedAudience: request.targetAudience
      })
    })
    jest.spyOn(ClientProxyFactory, 'create').mockReturnValue({
      getService: jest.fn(() => ({ exchangeExecutionToken }))
    } as never)

    const rpcData = {}
    const correlation = {
      requestId: 'public-card-request-702',
      traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
      tracestate: 'oes=public-card-human'
    }
    inboundExecutionTokenCredentialScope.prepare(
      rpcData,
      'source.header.signature',
      verifiedHumanExecution,
      correlation
    )

    const metadata = await inboundExecutionTokenCredentialScope.runPrepared(rpcData, () =>
      new PublicEntryFoundationTrustedGrpcExecutionProducer().forInternalCall(
        'permission-service',
        'permission.internal.permission.check'
      )
    )

    expect(exchangeExecutionToken).toHaveBeenCalledWith(
      {
        targetAudience: 'urn:oes:service:permission-service',
        requestedPermissionCodes: ['permission.internal.permission.check']
      },
      expect.any(Metadata)
    )
    expect(exchangeMetadata?.getMap()).toEqual({
      authorization: 'Bearer source.header.signature',
      'x-request-id': correlation.requestId,
      traceparent: correlation.traceparent,
      'x-trace-id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      tracestate: correlation.tracestate
    })
    expect(metadata.getMap()).toEqual({
      authorization: 'Bearer exchanged.header.signature',
      'x-request-id': correlation.requestId,
      traceparent: correlation.traceparent,
      'x-trace-id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      tracestate: correlation.tracestate
    })
  })
})
