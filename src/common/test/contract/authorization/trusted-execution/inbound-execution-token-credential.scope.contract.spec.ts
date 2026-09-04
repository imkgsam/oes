import { inboundExecutionTokenCredentialScope } from '../../../../src/authorization/trusted-execution/inbound-execution-token-credential.scope'

const token = Object.freeze({
  issuer: 'https://auth.example',
  audience: 'urn:oes:service:mes-service',
  subject: 'account-1',
  principalType: 'HUMAN' as const,
  clientId: 'gateway',
  tenantId: 'tenant-1',
  permissionCodes: [],
  tokenId: 'jti-1',
  issuedAt: 1,
  notBefore: 1,
  expiresAt: 9999999999,
  certificateThumbprint: 'A'.repeat(43),
  sessionId: 'session-1',
  sessionTerminal: 'WEB' as const
})

/** Proves inbound subject credentials remain request-private and disappear at request completion. */
describe('InboundExecutionTokenCredentialScope', () => {
  it('scopes a verifier-approved public session source to one nested STS operation', async () => {
    const data = {}
    inboundExecutionTokenCredentialScope.preparePublicCorrelation(data, {
      requestId: 'request-public',
      traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01'
    })

    await inboundExecutionTokenCredentialScope.runPrepared(data, async () => {
      await inboundExecutionTokenCredentialScope.runVerifiedSessionSource('verified.access', () =>
        inboundExecutionTokenCredentialScope.run(async () => true)
      )
      await expect(inboundExecutionTokenCredentialScope.run(async () => true)).rejects.toThrow(
        'Transport-private HUMAN OBO subject credential is required'
      )
    })
  })
  it('isolates one non-serializable bearer and cleans it after the callback', async () => {
    const data = {}
    inboundExecutionTokenCredentialScope.prepare(data, 'a.b.c', token)
    await inboundExecutionTokenCredentialScope.runPrepared(data, async () => {
      expect(inboundExecutionTokenCredentialScope.requireVerifiedExecution()).toBe(token)
      await expect(inboundExecutionTokenCredentialScope.run(async () => true)).resolves.toBe(true)
    })
    expect(() => inboundExecutionTokenCredentialScope.requireVerifiedExecution()).toThrow(
      'required'
    )
  })

  it('isolates parallel requests and never serializes the retained bearer', async () => {
    const first = {},
      second = {}
    inboundExecutionTokenCredentialScope.prepare(first, 'first.subject.token', token)
    inboundExecutionTokenCredentialScope.prepare(second, 'second.subject.token', {
      ...token,
      subject: 'account-2',
      tokenId: 'jti-2'
    })

    const values = await Promise.all([
      inboundExecutionTokenCredentialScope.runPrepared(first, async () => {
        await Promise.resolve()
        return inboundExecutionTokenCredentialScope.requireVerifiedExecution().subject
      }),
      inboundExecutionTokenCredentialScope.runPrepared(second, async () => {
        await Promise.resolve()
        return inboundExecutionTokenCredentialScope.requireVerifiedExecution().subject
      })
    ])

    expect(values).toEqual(['account-1', 'account-2'])
    expect(JSON.stringify(inboundExecutionTokenCredentialScope)).not.toContain('subject.token')
  })

  it('invalidates async descendants captured by a completed request', async () => {
    const data = {}
    let leaked: (() => unknown) | undefined
    inboundExecutionTokenCredentialScope.prepare(data, 'current.subject.token', token)
    await inboundExecutionTokenCredentialScope.runPrepared(data, async () => {
      leaked = () => inboundExecutionTokenCredentialScope.requireVerifiedExecution()
      expect(leaked()).toBe(token)
    })

    expect(leaked).toBeDefined()
    expect(() => leaked?.()).toThrow('required')
  })
})
