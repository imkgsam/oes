import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  createTrustedExecutionContext,
  TransportPrivateSourceCredentialIssuer
} from '../../authorization/trusted-execution'
import { ExecutionTokenExchangeSourceCredentialCarrier } from './execution-token-exchange-source-credential.carrier'

const SOURCE_CREDENTIAL = 'session.source.credential'
const TRACEPARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'

/** Builds correlation facts that deliberately contain no source bearer credential. */
function trustedContext() {
  return createTrustedExecutionContext({
    subject: 'account-123',
    principalType: 'HUMAN',
    tenantId: 'tenant-123',
    sessionId: 'session-123',
    requestId: 'request-123',
    traceparent: TRACEPARENT,
    tracestate: 'vendor=value'
  })
}

/** Proves only the dedicated STS exchange carrier can emit the current opaque source credential. */
describe('ExecutionTokenExchangeSourceCredentialCarrier', () => {
  it('emits the source credential only as Bearer metadata with controlled correlation fields', () => {
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const carrier = new ExecutionTokenExchangeSourceCredentialCarrier(accessor)

    const metadata = accessor.run(
      issuer.issueVerifiedSessionAccessCredential(SOURCE_CREDENTIAL),
      () => carrier.createMetadata(trustedContext())
    )

    expect(metadata.get('authorization')).toEqual([`Bearer ${SOURCE_CREDENTIAL}`])
    expect(metadata.get('x-request-id')).toEqual(['request-123'])
    expect(metadata.get('traceparent')).toEqual([TRACEPARENT])
    expect(metadata.get('tracestate')).toEqual(['vendor=value'])
    expect(metadata.get('x-trace-id')).toEqual(['4bf92f3577b34da6a3ce929d0e0e4736'])
    expect(metadata.get('x-operator-context')).toEqual([])
    expect(metadata.get('x-internal-service-name')).toEqual([])
  })

  it('ignores forged body/header/ordinary metadata authority and requires the private scope', () => {
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const carrier = new ExecutionTokenExchangeSourceCredentialCarrier(accessor)
    const forged = {
      ...trustedContext(),
      authorization: 'Bearer forged.header',
      body: { sourceCredential: 'forged.body' },
      metadata: { authorization: 'Bearer forged.metadata' }
    }

    expect(() => carrier.createMetadata(forged)).toThrow('source credential is required')
  })

  it('carries a multi-hop signed ExecutionToken exactly without parsing or rewriting it', () => {
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const carrier = new ExecutionTokenExchangeSourceCredentialCarrier(accessor)
    const subjectToken = 'opaque.upstream.execution-token'

    const metadata = accessor.run(
      issuer.issueVerifiedExecutionTokenSubjectCredential(subjectToken),
      () => carrier.createMetadata(trustedContext())
    )

    expect(metadata.get('authorization')).toEqual([`Bearer ${subjectToken}`])
  })

  it('partitions OBO cache entries with a stable irreversible subject reference', () => {
    const issuer = new TransportPrivateSourceCredentialIssuer()
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const carrier = new ExecutionTokenExchangeSourceCredentialCarrier(accessor)
    const first = accessor.run(
      issuer.issueVerifiedExecutionTokenSubjectCredential('first.subject.token'),
      () => carrier.referenceCurrent()
    )
    const repeated = accessor.run(
      issuer.issueVerifiedExecutionTokenSubjectCredential('first.subject.token'),
      () => carrier.referenceCurrent()
    )
    const second = accessor.run(
      issuer.issueVerifiedExecutionTokenSubjectCredential('second.subject.token'),
      () => carrier.referenceCurrent()
    )

    expect(first).toBe(repeated)
    expect(first).not.toBe(second)
    expect(first).not.toContain('subject.token')
  })
})
