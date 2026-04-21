import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { SessionContextUseCase } from './session-context.use-case'

describe('SessionContextUseCase', () => {
  it('builds the minimal authenticated workbench context from JWT and identity summaries', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
          displayName: 'Vic Chen @ Meilong Ceramics',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          code: 'meilong',
          name: 'Meilong Ceramics',
          isActive: true
        }
      })
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-1', code: 'tenant.admin', name: '租户管理员' }],
        actionCodes: []
      }),
      resolveNavigation: jest.fn().mockResolvedValue({
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home']
      })
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )
    const result = await useCase.execute({
      user: {
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1',
        passwordSetupRequired: true
      },
      requestId: 'req-1',
      traceId: 'trace-1'
    } as any)

    expect(identityAdapter.getAccountById).toHaveBeenCalledWith(
      'account-1',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(identityAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(result).toEqual({
      operator: {
        userId: 'user-1',
        displayName: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      account: {
        accountId: 'account-1',
        avatar: 'https://cdn.example.com/avatar/account-1.png',
        name: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      tenant: {
        tenantId: 'tenant-1',
        name: 'Meilong Ceramics'
      },
      org: null,
      navigation: {
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home'],
        defaultHomePath: '/workbench/home',
        menus: []
      },
      access: {
        actionCodes: []
      },
      scopeLevel: 'TENANT',
      passwordSetupRequired: true
    })
  })

  it('builds a system platform context without tenant lookup', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-system',
          userId: 'user-1',
          tenantId: '',
          displayName: 'Platform Admin',
          scopeLevel: 'SYSTEM',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn()
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-system', code: 'sys_admin', name: '系统管理员' }],
        actionCodes: []
      }),
      resolveNavigation: jest.fn().mockResolvedValue({
        defaultEntry: 'platform.home',
        visibleEntries: ['platform.home']
      })
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )
    const result = await useCase.execute({
      user: {
        sub: 'user-1',
        aid: 'account-system',
        scopeLevel: 'SYSTEM'
      }
    } as any)

    expect(identityAdapter.getTenantById).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        operator: {
          userId: 'user-1',
          displayName: 'Platform Admin',
          scopeLevel: 'SYSTEM'
        },
        account: {
          accountId: 'account-system',
          name: 'Platform Admin',
          scopeLevel: 'SYSTEM'
        },
        tenant: null,
        navigation: {
          defaultEntry: 'platform.home',
          visibleEntries: ['platform.home'],
          defaultHomePath: '/platform/home',
          menus: []
        },
        scopeLevel: 'SYSTEM'
      })
    )
  })

  it('keeps admin auth-session navigation hidden for non-admin accounts', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-regular',
          userId: 'user-2',
          tenantId: 'tenant-1',
          displayName: 'Regular User',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          code: 'tenant-1',
          name: 'Tenant A',
          isActive: true
        }
      })
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-user', code: 'regular_user', name: '普通用户' }],
        actionCodes: []
      }),
      resolveNavigation: jest.fn().mockResolvedValue({
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home']
      })
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )

    const result = await useCase.execute({
      user: {
        sub: 'user-2',
        aid: 'account-regular',
        tid: 'tenant-1'
      }
    } as any)

    expect(result.navigation.visibleEntries).toEqual(['workbench.home'])
  })

  it('uses managed navigation summary when permission-service returns a complete resolver result', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-managed',
          userId: 'user-managed',
          tenantId: 'tenant-1',
          displayName: 'Managed User',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          code: 'tenant-1',
          name: 'Tenant A',
          isActive: true
        }
      })
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-user', code: 'regular_user', name: '普通用户' }],
        actionCodes: []
      }),
      resolveNavigation: jest.fn().mockResolvedValue({
        defaultEntry: 'mes.work-order-board',
        visibleEntries: ['workbench.home', 'mes.work-order-board'],
        resolvedByRoleId: 'role-mes'
      })
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )

    const result = await useCase.execute({
      user: {
        sub: 'user-managed',
        aid: 'account-managed',
        tid: 'tenant-1'
      }
    } as any)

    expect(sessionAccessSummaryUseCase.resolveNavigation).toHaveBeenCalled()
    expect(result.navigation.defaultEntry).toBe('mes.work-order-board')
    expect(result.navigation.visibleEntries).toEqual(['workbench.home', 'mes.work-order-board'])
  })

  it('rejects session context when managed navigation resolution fails', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-managed',
          userId: 'user-managed',
          tenantId: 'tenant-1',
          displayName: 'Managed User',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          code: 'tenant-1',
          name: 'Tenant A',
          isActive: true
        }
      })
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-admin', code: 'tenant.admin', name: '租户管理员' }],
        actionCodes: []
      }),
      resolveNavigation: jest.fn().mockRejectedValue(new Error('navigation storage is unavailable'))
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )

    await expect(
      useCase.execute({
        user: {
          sub: 'user-managed',
          aid: 'account-managed',
          tid: 'tenant-1'
        }
      } as any)
    ).rejects.toBeInstanceOf(InternalServerErrorException)
    expect(sessionAccessSummaryUseCase.resolveNavigation).toHaveBeenCalled()
  })

  it('does not hardcode permission-management navigation when managed data omits it', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-permission-admin',
          userId: 'user-3',
          tenantId: '',
          displayName: 'Permission Admin',
          scopeLevel: 'SYSTEM',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn()
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-permission', code: 'system.admin', name: '系统管理员' }],
        actionCodes: ['permission.list']
      }),
      resolveNavigation: jest.fn().mockResolvedValue({
        defaultEntry: 'platform.home',
        visibleEntries: ['platform.home']
      })
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )

    const result = await useCase.execute({
      user: {
        sub: 'user-3',
        aid: 'account-permission-admin',
        scopeLevel: 'SYSTEM'
      }
    } as any)

    expect(result.navigation.visibleEntries).toEqual(['platform.home'])
  })

  it('passes through role-management navigation when permission-service resolves it from managed data', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-role-admin',
          userId: 'user-role-admin',
          tenantId: '',
          displayName: 'Role Admin',
          scopeLevel: 'SYSTEM',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn()
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-system-admin', code: 'system.admin', name: '系统管理员' }],
        actionCodes: ['role.list']
      }),
      resolveNavigation: jest.fn().mockResolvedValue({
        defaultEntry: 'platform.home',
        visibleEntries: [
          'platform.home',
          'admin.permission-management',
          'admin.role-management'
        ]
      })
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )

    const result = await useCase.execute({
      user: {
        sub: 'user-role-admin',
        aid: 'account-role-admin',
        scopeLevel: 'SYSTEM'
      }
    } as any)

    expect(result.navigation.visibleEntries).toEqual([
      'platform.home',
      'admin.permission-management',
      'admin.role-management'
    ])
  })

  it('keeps tenant administrators on managed home-only navigation when configured that way', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-tenant-admin',
          userId: 'user-4',
          tenantId: 'tenant-1',
          displayName: 'Tenant Admin',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          code: 'tenant-1',
          name: 'Tenant A',
          isActive: true
        }
      })
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-tenant-admin', code: 'tenant.admin', name: '租户管理员' }],
        actionCodes: ['permission.list']
      }),
      resolveNavigation: jest.fn().mockResolvedValue({
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home']
      })
    }

    const useCase = new SessionContextUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any
    )

    const result = await useCase.execute({
      user: {
        sub: 'user-4',
        aid: 'account-tenant-admin',
        tid: 'tenant-1'
      }
    } as any)

    expect(result.navigation.visibleEntries).toEqual(['workbench.home'])
  })

  it('rejects session-context requests that do not carry a selected account', async () => {
    const useCase = new SessionContextUseCase({} as any, {} as any)

    await expect(
      useCase.execute({
        user: { sub: 'user-1' }
      } as any)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
