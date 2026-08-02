import { createHash } from 'node:crypto'
import { TrustedExecutionRegistry } from '../../authorization/trusted-execution/trusted-execution-registry'
import { GrpcWorkloadIdentityProvider } from './grpc-workload-identity.provider'

const SPIFFE_ID = 'spiffe://local.oes/ns/oes/sa/site-service'
const CERTIFICATE_DER = Buffer.from('verified-leaf-certificate')

/** Exercises the adapter boundary that turns transport-authenticated peer evidence into Common identity. */
describe('GrpcWorkloadIdentityProvider', () => {
  const registry = new TrustedExecutionRegistry({
    issuer: 'https://auth.local.oes.example',
    audiences: ['urn:oes:service:asset-service'],
    workloadIdentities: [SPIFFE_ID]
  })

  it('derives an immutable certificate-bound identity only from a transport-verified adapter', async () => {
    const call = { transport: 'opaque-call' }
    const adapter = {
      resolveVerifiedPeer: jest.fn(async () => ({
        transportVerified: true as const,
        spiffeId: SPIFFE_ID,
        certificateDer: CERTIFICATE_DER
      }))
    }
    const provider = new GrpcWorkloadIdentityProvider({ registry, adapter })

    const identity = await provider.getVerifiedWorkloadIdentity(call)

    expect(adapter.resolveVerifiedPeer).toHaveBeenCalledWith(call)
    expect(identity).toEqual({
      spiffeId: SPIFFE_ID,
      certificateThumbprint: createHash('sha256').update(CERTIFICATE_DER).digest('base64url')
    })
    expect(Object.isFrozen(identity)).toBe(true)
  })

  it('rejects missing, unverified, and unregistered peer evidence without reading metadata headers', async () => {
    const missing = new GrpcWorkloadIdentityProvider({
      registry,
      adapter: { resolveVerifiedPeer: async () => undefined }
    })
    const unverified = new GrpcWorkloadIdentityProvider({
      registry,
      adapter: {
        resolveVerifiedPeer: async () => ({
          transportVerified: false as const,
          spiffeId: SPIFFE_ID,
          certificateDer: CERTIFICATE_DER
        })
      }
    })
    const unregistered = new GrpcWorkloadIdentityProvider({
      registry,
      adapter: {
        resolveVerifiedPeer: async () => ({
          transportVerified: true as const,
          spiffeId: 'spiffe://local.oes/ns/oes/sa/unknown',
          certificateDer: CERTIFICATE_DER
        })
      }
    })

    await expect(missing.getVerifiedWorkloadIdentity({})).rejects.toThrow('transport')
    await expect(unverified.getVerifiedWorkloadIdentity({})).rejects.toThrow('transport')
    await expect(unregistered.getVerifiedWorkloadIdentity({})).rejects.toThrow('registered')
  })
})
