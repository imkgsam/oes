import { REDACTED, sanitizeLogMeta } from './log-redaction'

describe('sanitizeLogMeta', () => {
  it('should redact secrets and mask pii fields', () => {
    const sanitized = sanitizeLogMeta({
      module: 'auth',
      operation: 'login',
      details: {
        accessToken: 'token-123',
        profile: {
          email: 'alice@example.com',
          phone: '13800138000'
        }
      }
    })

    expect(sanitized).toEqual({
      module: 'auth',
      operation: 'login',
      details: {
        accessToken: REDACTED,
        profile: {
          email: 'a***@example.com',
          phone: '138****8000'
        }
      }
    })
  })
})
