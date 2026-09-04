import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { GatewayVerifiedSourceCredentialBoundary } from '../../../../src/common/grpc/gateway-verified-source-credential.boundary'

const SESSION_CREDENTIAL = 'verified.session.access-token'
const EXTERNAL_CREDENTIAL = 'verified.external.access-token'

/** Exercises Gateway's only credential-supply seam after an upstream verifier has succeeded. */
describe('GatewayVerifiedSourceCredentialBoundary', () => {
  it('supplies verified session and external credentials only inside the transport-private scope', async () => {
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const boundary = new GatewayVerifiedSourceCredentialBoundary(
      {
        requireVerifiedSessionAccessCredential: () => SESSION_CREDENTIAL,
        requireVerifiedExternalAccessCredential: () => EXTERNAL_CREDENTIAL
      },
      new TransportPrivateSourceCredentialIssuer(),
      accessor
    )

    await expect(
      boundary.runWithVerifiedSessionAccessCredential(async () =>
        accessor.useCurrent((credential) => credential)
      )
    ).resolves.toBe(SESSION_CREDENTIAL)
    await expect(
      boundary.runWithVerifiedExternalAccessCredential(async () =>
        accessor.useCurrent((credential) => credential)
      )
    ).resolves.toBe(EXTERNAL_CREDENTIAL)
    expect(() => accessor.useCurrent(() => undefined)).toThrow('source credential is required')
  })

  it('rejects raw HTTP Authorization values rather than treating ordinary headers as verified authority', () => {
    const boundary = new GatewayVerifiedSourceCredentialBoundary(
      {
        requireVerifiedSessionAccessCredential: () => 'Bearer arbitrary.http.authorization',
        requireVerifiedExternalAccessCredential: () => EXTERNAL_CREDENTIAL
      },
      new TransportPrivateSourceCredentialIssuer(),
      new AsyncLocalTransportPrivateSourceCredentialAccessor()
    )

    expect(() => boundary.runWithVerifiedSessionAccessCredential(() => undefined)).toThrow(
      'Verified source credential is invalid'
    )
  })
})
