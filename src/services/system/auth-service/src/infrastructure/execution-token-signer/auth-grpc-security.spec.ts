import {
  assertAuthCertificateWorkloadIdentity,
  AuthGrpcVerifiedPeerAdapter,
  readAuthGrpcTlsConfig
} from './auth-grpc-security'

/** Proves Auth accepts only mTLS-authenticated SPIFFE peer facts and a complete frozen TLS deployment configuration. */
describe('Auth gRPC DG-1 security', () => {
  const environment = {
    OES_GRPC_TLS_ENABLED: 'true',
    OES_GRPC_TLS_CA_PATH: '/trust/ca.pem',
    OES_GRPC_TLS_CERT_PATH: '/trust/cert.pem',
    OES_GRPC_TLS_KEY_PATH: '/trust/key.pem',
    OES_GRPC_TLS_MIN_VERSION: 'TLSv1.2',
    OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes.internal/ns/oes/sa/auth-service'
  }

  it('reads only a complete mTLS configuration', () => {
    expect(readAuthGrpcTlsConfig(environment as NodeJS.ProcessEnv)).toEqual(
      expect.objectContaining({
        caPath: '/trust/ca.pem',
        workloadSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/auth-service'
      })
    )
    expect(() => readAuthGrpcTlsConfig({ ...environment, OES_GRPC_TLS_ENABLED: 'false' })).toThrow(
      'mTLS is required'
    )
    expect(() => readAuthGrpcTlsConfig({ ...environment, OES_GRPC_TLS_KEY_PATH: '' })).toThrow(
      'is required'
    )
  })

  it('derives a peer identity only from grpc-js authenticated TLS facts', async () => {
    const adapter = new AuthGrpcVerifiedPeerAdapter()
    await expect(
      adapter.resolveVerifiedPeer({
        getAuthContext: () => ({
          transportSecurityType: 'ssl',
          sslPeerCertificate: {
            raw: Buffer.from('leaf'),
            subjectaltname: 'URI:spiffe://local.oes.internal/ns/oes/sa/api-gateway, DNS:api-gateway'
          }
        })
      })
    ).resolves.toEqual({
      transportVerified: true,
      spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
      certificateDer: Buffer.from('leaf')
    })
    await expect(
      adapter.resolveVerifiedPeer({
        getAuthContext: () => ({
          transportSecurityType: 'insecure',
          sslPeerCertificate: {
            raw: Buffer.from('leaf'),
            subjectaltname: 'URI:spiffe://local.oes.internal/ns/oes/sa/api-gateway'
          }
        })
      })
    ).resolves.toBeUndefined()
  })

  it('rejects a certificate whose SPIFFE URI merely prefixes the configured Auth workload', () => {
    expect(() =>
      assertAuthCertificateWorkloadIdentity(
        'URI:spiffe://local.oes.internal/ns/oes/sa/auth-service-untrusted',
        environment.OES_WORKLOAD_SPIFFE_ID
      )
    ).toThrow('does not match')
  })
})
