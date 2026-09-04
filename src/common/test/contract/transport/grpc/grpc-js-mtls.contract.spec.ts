const { createHash, X509Certificate } = require('node:crypto')
const { writeFileSync, mkdirSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const {
  GrpcJsVerifiedPeerAdapter,
  assertGrpcCertificateWorkloadIdentity,
  readLocalVerifiedWorkloadIdentity,
  readSpiffeId
} = require('../../../../src/transport/grpc/grpc-js-mtls')

const CERT = `-----BEGIN CERTIFICATE-----
MIIC8zCCAdugAwIBAgIJAOKGUgfo1CVQMA0GCSqGSIb3DQEBCwUAMCAxHjAcBgNV
BAMMFW9lcy1sb2NhbC1hdXRoLXdvcmtlcjAeFw0yNjA4MDExNjIzNDNaFw0zNjA3
MjkxNjIzNDNaMCAxHjAcBgNVBAMMFW9lcy1sb2NhbC1hdXRoLXdvcmtlcjCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMm5KsAfHjCWE5m5RXuomsx3HtVs
L3dvK7sf+ggLT+p+06O5sQtao5RSCVhQIChKQBvKu1hPEWq9SHUz45VGOgBV1UgA
ro/r4oZJiyPS1QqT2NSDjoj6r7p43WhqfQMRICsOwv2zGIAzyfa24a9v5wRtF2qT
v2gBHNhgxBf9F3d7cw9whCa5b9tXfbEWQJcttvzJnwsrSdMe+IHbyxsv/If9oq4x
knDer2K1BfwC+xF0WRZk3ZWEXMS0e0+84hnkERAeatFQjl3WUjdX+2kn3p3zrip5
TwA9pxYWHjbn1POKIMASNGjIIwIs4OmY2/4U4dnJcOw2BAC1w8tEjSTsF5sCAwEA
AaMwMC4wLAYDVR0RBCUwI4Yhc3BpZmZlOi8vbG9jYWwub2VzL25zL29lcy9zYS9h
dXRoMA0GCSqGSIb3DQEBCwUAA4IBAQAJlxVMrNCH/fyyOlmAB4QLUrlPdqzHdeMi
ty4kDggcQ+k17LJJ1kY+mDcYEBZWSIZOC1OoEJMUnYADvvAXgHMjYO8Eql7ytazb
QU2DpxPg00sU0blUnhrY7lklovUMcwVpqd+j4oJwEKtKnPlMm5J6Ha4LwreSp9SA
4U5hMfy4tYFxrYxK4AlZGI5Igk2j6LDFYGvqNwRFxAqHT6AcgKMYyuRi0yIe9w+G
7qJSkVn6EPhU3gJk/QKv+Rel3htADYPIC207rjj8KJYiaDAi0i/sL0HK92vpGN2b
XddKHIMhiTpcedP5SUOuQZv7wRk+WKEGl0+uz3yPd7VshTJw9AKs
-----END CERTIFICATE-----
`

describe('grpc-js mTLS helpers', () => {
  it('extracts and verifies one SPIFFE identity from grpc-js auth context', async () => {
    const adapter = new GrpcJsVerifiedPeerAdapter()
    await expect(
      adapter.resolveVerifiedPeer({
        getAuthContext: () => ({
          transportSecurityType: 'ssl',
          sslPeerCertificate: {
            raw: Buffer.from('peer-der'),
            subjectaltname: 'URI:spiffe://local.oes/ns/oes/sa/auth-service'
          }
        })
      })
    ).resolves.toEqual({
      transportVerified: true,
      spiffeId: 'spiffe://local.oes/ns/oes/sa/auth-service',
      certificateDer: Buffer.from('peer-der')
    })
  })

  it('derives the local verified workload identity from the configured certificate files', () => {
    const directory = join(tmpdir(), `grpc-js-mtls-${Date.now()}`)
    mkdirSync(directory, { recursive: true })
    const certPath = join(directory, 'cert.pem')
    writeFileSync(certPath, CERT)

    const identity = readLocalVerifiedWorkloadIdentity({
      OES_GRPC_TLS_ENABLED: 'true',
      OES_GRPC_TLS_MIN_VERSION: 'TLSv1.2',
      OES_GRPC_TLS_CA_PATH: certPath,
      OES_GRPC_TLS_CERT_PATH: certPath,
      OES_GRPC_TLS_KEY_PATH: certPath,
      OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes/ns/oes/sa/auth'
    })

    expect(identity).toEqual({
      spiffeId: 'spiffe://local.oes/ns/oes/sa/auth',
      certificateThumbprint: createHash('sha256')
        .update(new X509Certificate(CERT).raw)
        .digest('base64url')
    })
  })

  it('fails when the certificate SAN does not exactly match the configured workload identity', () => {
    expect(() =>
      assertGrpcCertificateWorkloadIdentity(
        'URI:spiffe://local.oes/ns/oes/sa/auth-service',
        'spiffe://local.oes/ns/oes/sa/auth'
      )
    ).toThrow('gRPC TLS certificate SPIFFE identity does not match OES_WORKLOAD_SPIFFE_ID')
    expect(readSpiffeId('DNS:example.com, URI:spiffe://local.oes/ns/oes/sa/auth')).toBe(
      'spiffe://local.oes/ns/oes/sa/auth'
    )
  })
})
