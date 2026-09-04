import { ListLoginHistoryHandler } from './list-login-history.handler'
import { ListLoginHistoryQuery } from './list-login-history.query'

describe('ListLoginHistoryHandler', () => {
  it('queries the audit repository with self-bound login event filters', async () => {
    const auditRepository = {
      list: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: 'cursor-1'
      })
    } as any
    const handler = new ListLoginHistoryHandler(auditRepository)

    await handler.execute(
      new ListLoginHistoryQuery({
        userId: 'user-1',
        result: 'FAILED',
        occurredAtFrom: '2026-04-10T00:00:00.000Z',
        occurredAtTo: '2026-04-11T00:00:00.000Z',
        cursor: 'cursor-prev',
        pageSize: 20
      })
    )

    expect(auditRepository.list).toHaveBeenCalledWith({
      operatorId: 'user-1',
      eventTypes: ['LOGIN_SUCCEEDED', 'LOGIN_FAILED', 'TERMINAL_ACCESS_DENIED'],
      result: 'REJECTED',
      occurredAtFrom: new Date('2026-04-10T00:00:00.000Z'),
      occurredAtTo: new Date('2026-04-11T00:00:00.000Z'),
      cursor: 'cursor-prev',
      pageSize: 20
    })
  })

  it('includes terminal login denial events while excluding refresh and validation noise', async () => {
    const auditRepository = {
      list: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: undefined
      })
    } as any
    const handler = new ListLoginHistoryHandler(auditRepository)

    await handler.execute(
      new ListLoginHistoryQuery({
        userId: 'user-1'
      })
    )

    const eventTypes = auditRepository.list.mock.calls[0][0].eventTypes
    expect(eventTypes).toEqual(['LOGIN_SUCCEEDED', 'LOGIN_FAILED', 'TERMINAL_ACCESS_DENIED'])
    expect(eventTypes).not.toContain('SESSION_REFRESH_DENIED_TERMINAL_ACCESS')
    expect(eventTypes).not.toContain('SESSION_REFRESHED')
    expect(eventTypes).not.toContain('ACCESS_TOKEN_VALIDATED')
  })

  it('maps terminal-aware audit details into login history items', async () => {
    const auditRepository = {
      list: jest.fn().mockResolvedValue({
        items: [
          {
            occurredAt: new Date('2026-04-10T08:00:00.000Z'),
            eventType: 'LOGIN_SUCCEEDED',
            details: {
              method: 'email-password',
              terminal: 'WEB',
              loginFlow: 'EMAIL_PASSWORD',
              ipAddress: '127.0.0.1',
              deviceName: 'Firefox on macOS'
            },
            traceId: 'trace-1'
          }
        ],
        nextCursor: undefined
      })
    } as any
    const handler = new ListLoginHistoryHandler(auditRepository)

    const result = await handler.execute(
      new ListLoginHistoryQuery({
        userId: 'user-1'
      })
    )

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        outcome: 'SUCCESS',
        loginMethod: 'email-password',
        terminal: 'WEB',
        loginFlow: 'EMAIL_PASSWORD'
      })
    )
  })
})
