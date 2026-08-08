import { AsyncLocalTransportPrivateSourceCredentialAccessor, TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { EventEmitter } from 'node:events'
import { of } from 'rxjs'
import { GatewayVerifiedSourceCredentialVault } from '../grpc/gateway-verified-source-credential.vault'
import { GatewayVerifiedSourceCredentialScopeInterceptor } from './gateway-verified-source-credential-scope.interceptor'

/** Proves handler subscription, not just Observable construction, occurs while the opaque credential is scoped. */
describe('GatewayVerifiedSourceCredentialScopeInterceptor', () => {
  it('subscribes to downstream execution in the request-private credential scope and clears it', (done) => {
    const vault = new GatewayVerifiedSourceCredentialVault()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const request = {}
    const response = new EventEmitter()
    vault.admitHumanSession(request, new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential('session.scope.credential'))
    const interceptor = new GatewayVerifiedSourceCredentialScopeInterceptor(vault, accessor)
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    }
    const next = { handle: jest.fn(() => of(accessor.useCurrent((value) => value))) }

    interceptor.intercept(context as never, next).subscribe({
      next: (value) => expect(value).toBe('session.scope.credential'),
      complete: () => {
        expect(next.handle).toHaveBeenCalledTimes(1)
        expect(vault.consume(request)).toBeUndefined()
        done()
      }
    })
  })
})
