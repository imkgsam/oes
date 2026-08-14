import { createTrustedExecutionContext } from './trusted-execution-context'

describe('TrustedExecutionContext OBO boundary', () => {
  it('retains verified claims without accepting bearer material', () => {
    const context = createTrustedExecutionContext({
      subject: 'account-1',
      principalType: 'HUMAN',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      sessionTerminal: 'WEB',
      requestId: 'request-1',
      traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
    })
    expect(context).not.toHaveProperty('accessToken')
    expect(JSON.stringify(context)).not.toContain('Bearer')
  })
})
