import { ACCESS_DENIED } from '@oes/common/exceptions'
import { AuthorizationQueryScopeService } from '../../authorization'
import { AuditEventQueryScopeBuilder } from '../../authorization/query-scope/builders/audit-event-query-scope.builder'
import { ListAuditEventsHandler } from './list-audit-events.handler'
import { ListAuditEventsQuery } from './list-audit-events.query'

describe('ListAuditEventsHandler', () => {
  it('passes the tenant-bound query scope into the audit repository', async () => {
    const auditRepository = {
      list: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: undefined
      })
    } as any
    const handler = new ListAuditEventsHandler(
      auditRepository,
      new AuthorizationQueryScopeService([new AuditEventQueryScopeBuilder()])
    )

    await handler.execute(
      new ListAuditEventsQuery({
        tenantId: 'tenant-a',
        operatorScope: {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        }
      })
    )

    expect(auditRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a'
      })
    )
  })

  it('rejects mismatched tenant filters before querying the audit repository', async () => {
    const auditRepository = {
      list: jest.fn()
    } as any
    const handler = new ListAuditEventsHandler(
      auditRepository,
      new AuthorizationQueryScopeService([new AuditEventQueryScopeBuilder()])
    )

    await expect(
      handler.execute(
        new ListAuditEventsQuery({
          tenantId: 'tenant-b',
          operatorScope: {
            operatorId: 'operator-1',
            tenantId: 'tenant-a',
            isSystemScope: false
          }
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
    expect(auditRepository.list).not.toHaveBeenCalled()
  })
})
