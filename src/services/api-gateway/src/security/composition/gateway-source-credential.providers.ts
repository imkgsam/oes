import type { Provider } from '@nestjs/common'
import { TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { GatewayVerifiedSourceCredentialVault } from '../../common/grpc/gateway-verified-source-credential.vault'
import { GatewayVerifiedSourceCredentialScopeInterceptor } from '../../common/interceptors/gateway-verified-source-credential-scope.interceptor'

/** Provides the singleton private-vault lifecycle dependencies in one explicit Gateway-owned composition seam. */
export function createGatewaySourceCredentialProviders(): Provider[] {
  return [
    GatewayVerifiedSourceCredentialVault,
    TransportPrivateSourceCredentialIssuer,
    GatewayVerifiedSourceCredentialScopeInterceptor
  ]
}
