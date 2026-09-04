import {
  AccountRoleQueryScopeBuilder,
  AuthorizationQueryScopeService,
  RoleInstanceQueryScopeBuilder,
  RoleTemplateQueryScopeBuilder
} from '../application/authorization'

describe('AuthorizationQueryScopeService', () => {
  function createService() {
    return new AuthorizationQueryScopeService([
      new RoleInstanceQueryScopeBuilder(),
      new RoleTemplateQueryScopeBuilder(),
      new AccountRoleQueryScopeBuilder()
    ])
  }

  it('应按 resource + action 分发到 role instance builder', () => {
    const service = createService()

    const scope = service.build<{ tenantId?: string; scopeLevel?: string }>({
      resource: 'role_instance',
      action: 'list',
      operatorScope: {
        operatorId: 'user-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      },
      filters: {
        requestedTenantId: 'tenant-1'
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
  })

  it('应按 resource + action 分发到 role template builder', () => {
    const service = createService()

    const scope = service.build<Record<string, never>>({
      resource: 'role_template',
      action: 'list',
      operatorScope: {
        operatorId: 'tenant-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      }
    })

    expect(scope).toEqual({})
  })

  it('应支持 role template permission list 的系统范围 builder', () => {
    const service = createService()

    const scope = service.build<{ systemScopeOnly: true }>({
      resource: 'role_template_permission',
      action: 'list',
      operatorScope: {
        operatorId: 'system-1',
        isSystemScope: true
      }
    })

    expect(scope).toEqual({
      systemScopeOnly: true
    })
  })

  it('应按 resource + action 分发到 account role builder', () => {
    const service = createService()

    const scope = service.build<{ tenantId: string; scopeLevel?: string }>({
      resource: 'account_role',
      action: 'selection',
      operatorScope: {
        operatorId: 'user-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      },
      filters: {
        tenantId: 'tenant-1'
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
  })

  it('应支持 role permission list 的 tenant-bound builder', () => {
    const service = createService()

    const scope = service.build<{ tenantId: string; scopeLevel?: string }>({
      resource: 'role_permission',
      action: 'list',
      operatorScope: {
        operatorId: 'user-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      },
      filters: {
        tenantId: 'tenant-1'
      }
    })

    expect(scope).toEqual({
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
  })
})
