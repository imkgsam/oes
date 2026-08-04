import { inspect } from 'node:util'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  TransportPrivateSourceCredentialIssuer
} from './transport-private-source-credential'

const SESSION_CREDENTIAL = 'session.source.credential'
const SUBJECT_TOKEN = 'execution.subject.token'

/** Exercises the transport-private handle without exposing bearer material through ordinary object surfaces. */
describe('transport-private source credential', () => {
  it('retains a verified session credential only inside its AsyncLocal request scope', async () => {
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const handle = issuer.issueVerifiedSessionAccessCredential(SESSION_CREDENTIAL)

    await accessor.run(handle, async () => {
      expect(accessor.useCurrent((credential) => credential)).toBe(SESSION_CREDENTIAL)
      await Promise.resolve()
      expect(accessor.useCurrent((credential) => credential)).toBe(SESSION_CREDENTIAL)
    })

    expect(() => accessor.useCurrent(() => undefined)).toThrow('source credential is required')
  })

  it('keeps a multi-hop ExecutionToken opaque without interpreting any claims locally', () => {
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const handle = issuer.issueVerifiedExecutionTokenSubjectCredential(SUBJECT_TOKEN)

    const observed = accessor.run(handle, () => accessor.useCurrent((credential) => credential))

    expect(observed).toBe(SUBJECT_TOKEN)
  })

  it('redacts bearer material from serialization, stringification, inspection, and enumerable fields', () => {
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const handle = issuer.issueVerifiedExternalAccessCredential(SESSION_CREDENTIAL)
    const rendered = [
      JSON.stringify(handle),
      String(handle),
      inspect(handle),
      Object.keys(handle).join()
    ]

    expect(rendered.join('|')).not.toContain(SESSION_CREDENTIAL)
    expect(JSON.stringify({ sourceCredential: handle })).not.toContain(SESSION_CREDENTIAL)
  })

  it.each([
    '',
    ' session.source.credential',
    'session source credential',
    'Bearer raw.header.value'
  ])('rejects malformed or pre-wrapped credential input without echoing it: %s', (candidate) => {
    const issuer = new TransportPrivateSourceCredentialIssuer()

    expect(() => issuer.issueVerifiedSessionAccessCredential(candidate)).toThrow(
      'Verified source credential is invalid'
    )
    try {
      issuer.issueVerifiedSessionAccessCredential(candidate)
    } catch (error) {
      expect(String(error)).not.toContain(candidate || 'raw.header.value')
    }
  })
})
