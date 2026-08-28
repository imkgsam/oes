import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { GatewayPermissionTrustedMetadata } from './gateway-permission-trusted-metadata.provider'
import { GatewayVerifiedSourceCredentialVault } from './gateway-verified-source-credential.vault'

describe('GatewayPermissionTrustedMetadata', () => {
  it('borrows the verified request credential for the exact Permission HUMAN_OBO exchange', async () => {
    const request = {
      requestId: 'request-1',
      headers: { traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01' },
      user: { principalId: 'principal-1', tenantId: 'tenant-1', sessionId: 'session-1' }
    }
    const vault = new GatewayVerifiedSourceCredentialVault()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    vault.admitHumanSession(
      request,
      new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential(
        'verified.session.token'
      )
    )
    const forInternalCall = jest.fn().mockImplementation(async () => {
      expect(accessor.useCurrent(() => true)).toBe(true)
      return { authorization: 'redacted' }
    })
    const provider = new GatewayPermissionTrustedMetadata(
      { forInternalCall } as never,
      vault,
      accessor
    )

    await expect(provider.create(request as never)).resolves.toEqual({ authorization: 'redacted' })
    expect(forInternalCall).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'request-1', user: request.user }),
      'urn:oes:service:permission-service',
      ['permission.internal.permission.check']
    )
    expect(vault.consume(request)).toBeDefined()
  })

  it('fails closed before exchange when no verified request credential was admitted', async () => {
    const forInternalCall = jest.fn()
    const provider = new GatewayPermissionTrustedMetadata(
      { forInternalCall } as never,
      new GatewayVerifiedSourceCredentialVault(),
      new AsyncLocalTransportPrivateSourceCredentialAccessor()
    )

    await expect(provider.create({ headers: {}, user: {} } as never)).rejects.toThrow(
      'Verified source credential is required'
    )
    expect(forInternalCall).not.toHaveBeenCalled()
  })

  it('propagates issuance failures and never falls back outside the private scope', async () => {
    const request = { headers: {}, user: { principalId: 'principal-1' } }
    const vault = new GatewayVerifiedSourceCredentialVault()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    vault.admitHumanSession(
      request,
      new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential('stale')
    )
    const provider = new GatewayPermissionTrustedMetadata(
      { forInternalCall: jest.fn().mockRejectedValue(new Error('cnf mismatch')) } as never,
      vault,
      accessor
    )

    await expect(provider.create(request as never)).rejects.toThrow('cnf mismatch')
  })
})
