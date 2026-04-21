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
      eventTypes: ['LOGIN_SUCCEEDED', 'LOGIN_FAILED'],
      result: 'REJECTED',
      occurredAtFrom: new Date('2026-04-10T00:00:00.000Z'),
      occurredAtTo: new Date('2026-04-11T00:00:00.000Z'),
      cursor: 'cursor-prev',
      pageSize: 20
    })
  })
})
