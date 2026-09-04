import { TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { GatewayVerifiedSourceCredentialVault } from '../../../../src/common/grpc/gateway-verified-source-credential.vault'
import { GatewayVerifiedSourceCredentialScopeInterceptor } from '../../../../src/common/interceptors/gateway-verified-source-credential-scope.interceptor'
import { createGatewaySourceCredentialProviders } from '../../../../src/security/composition/gateway-source-credential.providers'

/** Keeps the private credential lifecycle as explicit singleton composition rather than a hidden request-scoped provider. */
describe('createGatewaySourceCredentialProviders', () => {
  it('registers the vault, opaque issuer/accessor, and scope interceptor explicitly', () => {
    expect(createGatewaySourceCredentialProviders()).toEqual([
      GatewayVerifiedSourceCredentialVault,
      TransportPrivateSourceCredentialIssuer,
      GatewayVerifiedSourceCredentialScopeInterceptor
    ])
  })
})
