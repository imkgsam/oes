import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from '@oes/common/authorization'
import { GatewayVerifiedSourceCredentialVault } from '../../../../src/common/grpc/gateway-verified-source-credential.vault'

/** Exercises request-keyed credential isolation without exposing bearer material through request state. */
describe('GatewayVerifiedSourceCredentialVault', () => {
  it('consumes each human session handle once and isolates concurrent requests', () => {
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const vault = new GatewayVerifiedSourceCredentialVault()
    const first = {}
    const second = {}
    const firstHandle = issuer.issueVerifiedSessionAccessCredential('session.credential.one')
    const secondHandle = issuer.issueVerifiedSessionAccessCredential('session.credential.two')

    vault.admitHumanSession(first, firstHandle)
    vault.admitHumanSession(second, secondHandle)

    expect(vault.consume(first)).toEqual({ kind: 'HUMAN_SESSION', credential: firstHandle })
    expect(vault.consume(first)).toBeUndefined()
    expect(vault.consume(second)).toEqual({ kind: 'HUMAN_SESSION', credential: secondHandle })
  })

  it('retains only opaque, non-enumerable bearer handles', () => {
    const vault = new GatewayVerifiedSourceCredentialVault()
    const request = {}
    const handle =
      new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential(
        'session.credential.redacted'
      )

    vault.admitHumanSession(request, handle)
    const entry = vault.consume(request)!

    expect(JSON.stringify(entry)).not.toContain('session.credential.redacted')
    expect(String(entry.credential)).not.toContain('session.credential.redacted')
    expect(
      new AsyncLocalTransportPrivateSourceCredentialAccessor().run(entry.credential, () => true)
    ).toBe(true)
  })

  it('borrows an admitted credential without consuming the later handler scope', () => {
    const vault = new GatewayVerifiedSourceCredentialVault()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const request = {}
    vault.admitHumanSession(
      request,
      new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential('opaque')
    )

    expect(vault.run(request, accessor, () => accessor.useCurrent(() => 'scoped'))).toBe('scoped')
    expect(vault.consume(request)).toBeDefined()
  })

  it('cleans later-guard rejections and terminal response events idempotently', () => {
    const vault = new GatewayVerifiedSourceCredentialVault()
    const request = {}
    const response = new (require('node:events').EventEmitter)()
    const credential =
      new TransportPrivateSourceCredentialIssuer().issueVerifiedSessionAccessCredential(
        'session.lifecycle.credential'
      )

    vault.admitHumanSession(request, credential, response)
    response.emit('finish')
    response.emit('close')
    vault.clear(request)

    expect(vault.consume(request)).toBeUndefined()
    expect(response.listenerCount('finish')).toBe(0)
    expect(response.listenerCount('close')).toBe(0)
  })
})
