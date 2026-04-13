import {
  AccountContactAssetQueryScopeBuilder,
  AccountMembershipQueryScopeBuilder,
  ApiKeyQueryScopeBuilder,
  AuditEventQueryScopeBuilder,
  AuthorizationQueryScopeService,
  ServiceAccountQueryScopeBuilder
} from '../../src/application/authorization'

describe('Identity AuthorizationQueryScopeService', () => {
  function createService() {
    return new AuthorizationQueryScopeService([
      new AccountMembershipQueryScopeBuilder(),
      new AccountContactAssetQueryScopeBuilder(),
      new ApiKeyQueryScopeBuilder(),
      new AuditEventQueryScopeBuilder(),
      new ServiceAccountQueryScopeBuilder()
    ])
  }

  it('应将 tenant operator 收口为 account org membership list 的 tenant scope', () => {
    const service = createService()

    const scope = service.build<{ tenantId?: string }>({
      resource: 'account_org_membership',
      action: 'list',
      operatorScope: {
        operatorId: 'user-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-1'
    })
  })

  it('应将 system operator 放行为 account contact asset list 的空 tenant scope', () => {
    const service = createService()

    const scope = service.build<{ tenantId?: string }>({
      resource: 'account_contact_asset',
      action: 'list',
      operatorScope: {
        operatorId: 'system-1',
        isSystemScope: true
      }
    })

    expect(scope).toEqual({})
  })

  it('应将 tenant operator 收口为 service account list 的 tenant scope', () => {
    const service = createService()

    const scope = service.build<{ tenantId?: string }>({
      resource: 'service_account',
      action: 'list',
      operatorScope: {
        operatorId: 'user-1',
        tenantId: 'tenant-2',
        isSystemScope: false
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-2'
    })
  })

  it('应将 tenant operator 收口为 api key list 的 tenant scope', () => {
    const service = createService()

    const scope = service.build<{ tenantId?: string }>({
      resource: 'api_key',
      action: 'list',
      operatorScope: {
        operatorId: 'user-2',
        tenantId: 'tenant-3',
        isSystemScope: false
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-3'
    })
  })

  it('应将 tenant operator 收口为 audit event list 的 tenant scope', () => {
    const service = createService()

    const scope = service.build<{ tenantId?: string }>({
      resource: 'audit_event',
      action: 'list',
      operatorScope: {
        operatorId: 'user-3',
        tenantId: 'tenant-4',
        isSystemScope: false
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-4'
    })
  })
})
