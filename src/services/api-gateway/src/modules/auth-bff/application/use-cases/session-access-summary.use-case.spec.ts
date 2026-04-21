import { SessionAccessSummaryUseCase } from './session-access-summary.use-case'

describe('SessionAccessSummaryUseCase', () => {
  it('loads the selected tenant account access summary from permission-service', async () => {
    const permissionAdapter = {
      getAccountAccessSummary: jest.fn().mockResolvedValue({
        roles: [
          {
            roleId: 'role-1',
            code: 'tenant.admin',
            name: 'Tenant Admin',
            tenantId: 'tenant-1',
            scope: 'TENANT'
          }
        ],
        actionCodes: ['permission.list', 'role.create']
      })
    }
    const useCase = new SessionAccessSummaryUseCase(permissionAdapter as any)
    const source = {
      user: {
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1'
      },
      requestId: 'req-1'
    }

    await expect(useCase.execute(source as any)).resolves.toEqual({
      roles: [
        {
          roleId: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin',
          tenantId: 'tenant-1',
          scope: 'TENANT'
        }
      ],
      actionCodes: ['permission.list', 'role.create']
    })
    expect(permissionAdapter.getAccountAccessSummary).toHaveBeenCalledWith(
      { accountId: 'account-1', tenantId: 'tenant-1', scopeLevel: 'TENANT' },
      source
    )
  })

  it('loads system account access summary without tenant binding', async () => {
    const permissionAdapter = {
      getAccountAccessSummary: jest.fn().mockResolvedValue({
        roles: [
          {
            roleId: 'role-system-1',
            code: 'system.admin',
            name: 'System Admin',
            tenantId: '',
            scope: 'SYSTEM'
          }
        ],
        actionCodes: ['permission.create']
      })
    }
    const useCase = new SessionAccessSummaryUseCase(permissionAdapter as any)
    const source = {
      user: {
        sub: 'user-1',
        aid: 'account-system',
        scopeLevel: 'SYSTEM'
      }
    }

    await expect(useCase.execute(source as any)).resolves.toEqual({
      roles: [
        {
          roleId: 'role-system-1',
          code: 'system.admin',
          name: 'System Admin',
          tenantId: '',
          scope: 'SYSTEM'
        }
      ],
      actionCodes: ['permission.create']
    })
    expect(permissionAdapter.getAccountAccessSummary).toHaveBeenCalledWith(
      { accountId: 'account-system', tenantId: undefined, scopeLevel: 'SYSTEM' },
      source
    )
  })

  it('resolves selected account navigation through permission-service', async () => {
    const permissionAdapter = {
      resolveAccountNavigation: jest.fn().mockResolvedValue({
        visibleEntries: ['workbench.home', 'mes.work-order-board'],
        defaultEntry: 'mes.work-order-board',
        resolvedByRoleId: 'role-2',
        fallbackReason: ''
      })
    }
    const useCase = new SessionAccessSummaryUseCase(permissionAdapter as any)
    const source = {
      user: {
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1'
      },
      requestId: 'req-1'
    }

    await expect(useCase.resolveNavigation(source as any, 'WEB')).resolves.toEqual({
      visibleEntries: ['workbench.home', 'mes.work-order-board'],
      defaultEntry: 'mes.work-order-board',
      resolvedByRoleId: 'role-2',
      fallbackReason: undefined
    })
    expect(permissionAdapter.resolveAccountNavigation).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        terminal: 'WEB'
      },
      source
    )
  })
})
