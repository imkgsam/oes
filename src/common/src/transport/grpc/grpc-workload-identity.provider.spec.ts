import { GrpcWorkloadIdentityProvider } from './grpc-workload-identity.provider'

/** Proves gRPC runtime accepts workload identity only from a verified mTLS boundary adapter. */
describe('GrpcWorkloadIdentityProvider', () => {
  it('returns the verified SPIFFE identity and certificate without inspecting caller-controlled metadata', () => {
    const provider = new GrpcWorkloadIdentityProvider()

    expect(
      provider.resolve({
        verifiedByTransport: true,
        spiffeId: 'spiffe://local.oes.example/workload/caller',
        certificateDer: Buffer.from('leaf-certificate')
      })
    ).toEqual({
      spiffeId: 'spiffe://local.oes.example/workload/caller',
      certificateDer: Buffer.from('leaf-certificate')
    })
  })

  it('rejects an unverified peer even when it presents a SPIFFE-looking value', () => {
    const provider = new GrpcWorkloadIdentityProvider()

    expect(() =>
      provider.resolve({
        verifiedByTransport: false,
        spiffeId: 'spiffe://local.oes.example/workload/forged',
        certificateDer: Buffer.from('forged-certificate')
      })
    ).toThrow('verified mTLS')
  })
})
