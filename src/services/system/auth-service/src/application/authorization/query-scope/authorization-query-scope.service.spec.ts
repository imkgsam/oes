import { ACCESS_DENIED } from '@oes/common/exceptions'
import { AuthorizationQueryScopeService } from './authorization-query-scope.service'
import { AdminUserSessionQueryScopeBuilder } from './builders/admin-user-session-query-scope.builder'
import { AuditEventQueryScopeBuilder } from './builders/audit-event-query-scope.builder'

describe('AuthorizationQueryScopeService', () => {
  it('routes audit event scope requests and enforces tenant mismatch rejection', () => {
    const service = new AuthorizationQueryScopeService([
      new AuditEventQueryScopeBuilder(),
      new AdminUserSessionQueryScopeBuilder()
    ])

    expect(() =>
      service.build({
        resource: 'audit_event',
        action: 'list',
        operatorScope: {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        },
        filters: {
          tenantId: 'tenant-b'
        }
      })
    ).toThrowError(
      expect.objectContaining({
        definition: expect.objectContaining({
          code: ACCESS_DENIED.code
        })
      })
    )
  })

  it('routes admin user session scope requests to the tenant-bound builder', () => {
    const service = new AuthorizationQueryScopeService([
      new AuditEventQueryScopeBuilder(),
      new AdminUserSessionQueryScopeBuilder()
    ])

    const scope = service.build<{ tenantId?: string }>({
      resource: 'admin_user_session',
      action: 'list',
      operatorScope: {
        operatorId: 'operator-1',
        tenantId: 'tenant-a',
        isSystemScope: false
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-a'
    })
  })
})
