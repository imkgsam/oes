import { createHash } from 'node:crypto'
import { TrustedExecutionRegistry } from '../../authorization/trusted-execution/trusted-execution-registry'
import { GrpcWorkloadIdentityProvider } from './grpc-workload-identity.provider'

const SPIFFE_ID = 'spiffe://local.oes/ns/oes/sa/site-service'
const CERTIFICATE_DER = Buffer.from('MIICojCCAYoCCQDDtU4X9sC6WDANBgkqhkiG9w0BAQsFADATMREwDwYDVQQDDAhvZXMtdGVzdDAeFw0yNjA4MDcwODAxMzhaFw0yNjA5MDYwODAxMzhaMBMxETAPBgNVBAMMCG9lcy10ZXN0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnxVOO0q9TFE1eIEUSsrrkT9XfXbFsmXxriESezrPMU0GntDbX1I9XV7kQckbJZtp9qYOwb1W+sxSsaymJYCfA91GaXjjGCSRokcyceuabzp4mAV1BDfwHnSEQyGgVEz61ZCgCOnb0VhZOO2ikxO2MJb90XSQiv7eIjYH6qoLzX6F6cNQ7H/XZyZUHjwvK1ihIg3EqE4lLhfh52xWQG7VyP4wImFA8r4K5EfHkjCYg9SP0E0R7qjN1MQb6bMt55ZeKWx4ttXNSUUjnAwwGuZdmS4LEVfIx9DZYXcals2xhtxLLBreIgE/kIE7VmkbT9r2eHOIoncp+KQ1WJNBrNhAowIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBe6D1n+LnYJkbrSi1OizQ4lWTksVcUYx6ofHWbdqRY5v5FygaGd/KffbthErTSM2C2iLCuQd1+Q+3nzBcMEZBSyrWuvUp6pyvhCGBTsYYPajl/dzbtXnaIghrNbmuNN3gOOwrVhHI/Sl7xioQQpIJxG5n+wiWWsDxVTUAeL2VHJ7ZwIo3K7UtLWx3pJ8ePydcUjOIVdxc4KUZJ54HESOuY5GUZBaHfu53LQraDnlbXMAiQBOJKoM+WmP2eFYbzCqKJH/ELR0jLcIS+2VLd+Zt9+7Dd0D6GPCurKQqxfKK9AKml+/Z3lGbaSS4dwZZieJ0FdOl81l1expmDahH6Cui1', 'base64')

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

  it('derives issuance-only leaf expiry from the same verified DER without widening global identity facts', async () => {
    const provider = new GrpcWorkloadIdentityProvider({ registry, adapter: { resolveVerifiedPeer: async () => ({ transportVerified: true as const, spiffeId: SPIFFE_ID, certificateDer: CERTIFICATE_DER }) } })
    const issuanceIdentity = await provider.getVerifiedWorkloadIssuanceIdentity({})
    expect(issuanceIdentity.certificateNotAfter).toBeInstanceOf(Date)
    expect(issuanceIdentity.certificateNotAfter.getTime()).toBeGreaterThan(Date.now())
    await expect(provider.getVerifiedWorkloadIdentity({})).resolves.not.toHaveProperty('certificateNotAfter')
  })
})
