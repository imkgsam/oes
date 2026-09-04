import { createOesCloudEvent, decodeCloudEvent } from '../../../../src/events'
import {
  AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT,
  AUTH_SERVICE_EVENT_OWNER,
  type AuthExecutionTokenRevokedEventData,
} from '../../../../src/contracts/auth_service/events'

/** Verifies the single frozen Auth emergency-revocation fact shared by producers and consumers. */
describe('Auth execution-token revocation event contract', () => {
  const data: AuthExecutionTokenRevokedEventData = {
    selectorKind: 'TOKEN_JTI',
    selectorRef: 'jti:token-1',
    revocationVersion: 7,
    effectiveAt: '2026-07-29T08:00:00.000Z',
    denyUntil: '2026-07-29T08:06:00.000Z',
    reasonCode: 'TOKEN_COMPROMISE',
  }

  it('defines the frozen Auth-owned security-critical v1 fact', () => {
    expect(AUTH_SERVICE_EVENT_OWNER).toBe('auth-service')
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT).toMatchObject({
      eventType: 'auth.execution-token.revoked',
      eventVersion: 1,
      ownerService: 'auth-service',
      transportProfile: 'SECURITY_CRITICAL',
    })
  })

  it('round-trips the exact payload through the Event-owned SYSTEM envelope', () => {
    const event = createOesCloudEvent({
      contract: AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT,
      eventId: 'event-1',
      occurredAt: data.effectiveAt,
      executionScope: 'SYSTEM',
      traceId: 'trace-1',
      correlationId: 'correlation-1',
      auditRef: 'audit-1',
      data,
    })

    expect(decodeCloudEvent(Buffer.from(JSON.stringify(event)), AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT)).toEqual(event)
    expect(event).not.toHaveProperty('subject')
    expect(event).not.toHaveProperty('oestenantid')
    expect(event.data).not.toHaveProperty('auditRef')
    expect(event.data).not.toHaveProperty('traceId')
    expect(event.data).not.toHaveProperty('correlationId')
    expect(event).toMatchObject({ oesauditref: 'audit-1', oestraceid: 'trace-1', oescorrelationid: 'correlation-1' })
  })

  it('rejects payload aliases, uncontracted secrets, and stale selector versions', () => {
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData({ ...data, schema_version: 1 })).toBe(false)
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData({ ...data, accessToken: 'bearer-value' })).toBe(false)
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData({ ...data, revocationVersion: 0 })).toBe(false)
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData({ ...data, reasonCode: 'operator supplied narrative' })).toBe(false)
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData(data)).toBe(true)
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData({ ...data, auditRef: 'audit-1' })).toBe(false)
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData({ ...data, traceId: 'trace-1' })).toBe(false)
    expect(AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT.validateData({ ...data, correlationId: 'correlation-1' })).toBe(false)
  })
})
