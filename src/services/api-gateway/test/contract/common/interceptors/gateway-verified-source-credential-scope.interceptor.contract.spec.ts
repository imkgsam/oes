import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { EventEmitter } from 'node:events'
import { Observable, of, throwError } from 'rxjs'
import { GatewayVerifiedSourceCredentialVault } from '../../../../src/common/grpc/gateway-verified-source-credential.vault'
import { GatewayVerifiedSourceCredentialScopeInterceptor } from '../../../../src/common/interceptors/gateway-verified-source-credential-scope.interceptor'

/** Proves handler subscription, not just Observable construction, occurs while the opaque credential is scoped. */
describe('GatewayVerifiedSourceCredentialScopeInterceptor', () => {
  it('subscribes to downstream execution in the request-private credential scope and clears it', (done) => {
    const vault = new GatewayVerifiedSourceCredentialVault()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const request = {}
    const response = new EventEmitter()
    vault.admitHumanSession(
      request,
      new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential(
        'session.scope.credential'
      ),
      response
    )
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
        expect(response.listenerCount('finish')).toBe(0)
        expect(response.listenerCount('close')).toBe(0)
        done()
      }
    })
  })

  it('fails a protected request without a vault entry before downstream handling', () => {
    const interceptor = new GatewayVerifiedSourceCredentialScopeInterceptor(
      new GatewayVerifiedSourceCredentialVault(),
      new AsyncLocalTransportPrivateSourceCredentialAccessor()
    )
    const next = { handle: jest.fn(() => of('downstream')) }
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'account-1' } }),
        getResponse: () => new EventEmitter()
      })
    }

    expect(() => interceptor.intercept(context as never, next)).toThrow(
      'Verified source credential'
    )
    expect(next.handle).not.toHaveBeenCalled()
  })

  it('cleans the private scope after a downstream error', (done) => {
    const vault = new GatewayVerifiedSourceCredentialVault()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const request = {}
    const response = new EventEmitter()
    vault.admitHumanSession(
      request,
      new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential(
        'session.error'
      ),
      response
    )
    const interceptor = new GatewayVerifiedSourceCredentialScopeInterceptor(vault, accessor)
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    }

    interceptor
      .intercept(context as never, {
        handle: () => throwError(() => new Error('downstream failure'))
      })
      .subscribe({
        error: () => {
          expect(vault.consume(request)).toBeUndefined()
          expect(response.listenerCount('finish')).toBe(0)
          expect(response.listenerCount('close')).toBe(0)
          done()
        }
      })
  })

  it('cleans timeout cancellation and disconnect paths without cross-request credential leakage', () => {
    const vault = new GatewayVerifiedSourceCredentialVault()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const firstRequest = {}
    const secondRequest = {}
    const firstResponse = new EventEmitter()
    const secondResponse = new EventEmitter()
    const issuer = new TransportPrivateSourceCredentialIssuer()
    vault.admitHumanSession(
      firstRequest,
      issuer.issueVerifiedSessionAccessCredential('session.one'),
      firstResponse
    )
    vault.admitHumanSession(
      secondRequest,
      issuer.issueVerifiedSessionAccessCredential('session.two'),
      secondResponse
    )
    const interceptor = new GatewayVerifiedSourceCredentialScopeInterceptor(vault, accessor)
    const first = interceptor
      .intercept(
        {
          getType: () => 'http',
          switchToHttp: () => ({ getRequest: () => firstRequest, getResponse: () => firstResponse })
        } as never,
        { handle: () => new Observable(() => undefined) }
      )
      .subscribe()
    const second = interceptor
      .intercept(
        {
          getType: () => 'http',
          switchToHttp: () => ({
            getRequest: () => secondRequest,
            getResponse: () => secondResponse
          })
        } as never,
        { handle: () => new Observable(() => undefined) }
      )
      .subscribe()

    first.unsubscribe()
    secondResponse.emit('close')

    expect(vault.consume(firstRequest)).toBeUndefined()
    expect(vault.consume(secondRequest)).toBeUndefined()
    expect(firstResponse.listenerCount('finish')).toBe(0)
    expect(secondResponse.listenerCount('close')).toBe(0)
    second.unsubscribe()
  })
})
