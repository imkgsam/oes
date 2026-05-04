import { MfaBindingType } from '@oes/common/generated/auth_service'
import { PolicySubjectTypeProto } from '@oes/common/generated/permission_service'
import { AdminSecurityUseCase } from './admin-security.use-case'

// Verifies the administrator auth-bff use case maps downstream admin session and audit responses into HTTP view models.
describe('AdminSecurityUseCase', () => {
  it('loads one account basic-info view by hydrating account, user, and tenant details', async () => {
    const authAdapter = {}
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          displayName: '陈双武',
          isEnabled: true,
          scopeLevel: 'TENANT'
        }
      }),
      getUserById: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          personalEmail: 'chen@example.com',
          personalPhone: '+8613800138000'
        }
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          name: '达屋科技'
        }
      })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      undefined,
      tenantOrgAdapter as any
    )
    const result = await useCase.getAccountBasicInfo(
      'account-1',
      { user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } } as any
    )

    expect(identityAdapter.getAccountById).toHaveBeenCalledWith(
      'account-1',
      expect.objectContaining({ user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } })
    )
    expect(identityAdapter.getUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } })
    )
    expect(tenantOrgAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } })
    )
    expect(result).toEqual({
      accountId: 'account-1',
      userId: 'user-1',
      displayName: '陈双武',
      email: 'chen@example.com',
      phone: '+8613800138000',
      tenantId: 'tenant-1',
      tenantName: '达屋科技',
      scopeLevel: 'TENANT',
      isEnabled: true
    })
  })

  it('updates one account basic-info view without mutating identity contacts or login methods', async () => {
    const authAdapter = {
      bootstrapUserLoginMethods: jest.fn()
    }
    const identityAdapter = {
      getAccountById: jest
        .fn()
        .mockResolvedValueOnce({
          account: {
            id: 'account-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            displayName: '旧名字',
            isEnabled: true,
            scopeLevel: 'TENANT'
          }
        })
        .mockResolvedValueOnce({
          account: {
            id: 'account-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            displayName: '新名字',
            isEnabled: true,
            scopeLevel: 'TENANT'
          }
        }),
      getUserById: jest
        .fn()
        .mockResolvedValueOnce({
          user: {
            id: 'user-1',
            personalEmail: undefined,
            personalPhone: '+8613800138000'
          }
        })
        .mockResolvedValueOnce({
          user: {
            id: 'user-1',
            personalEmail: undefined,
            personalPhone: '+8613800138000'
          }
        }),
      updateAccountProfile: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          displayName: '新名字',
          isEnabled: true,
          scopeLevel: 'TENANT'
        }
      }),
      updateUserBasicInfo: jest.fn()
    }
    const tenantOrgAdapter = {
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          name: '达屋科技'
        }
      })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      undefined,
      tenantOrgAdapter as any
    )
    const result = await useCase.updateAccountBasicInfo(
      'account-1',
      {
        displayName: '新名字',
        isEnabled: true
      } as any,
      {
        user: {
          sub: 'operator-1',
          scopeLevel: 'SYSTEM',
          permissions: ['identity.account.profile.update', 'identity.account.update_status']
        }
      } as any
    )

    expect(identityAdapter.updateAccountProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1',
        displayName: '新名字'
      }),
      expect.objectContaining({
        user: expect.objectContaining({ sub: 'operator-1', scopeLevel: 'SYSTEM' })
      })
    )
    expect(identityAdapter.updateUserBasicInfo).not.toHaveBeenCalled()
    expect(authAdapter.bootstrapUserLoginMethods).not.toHaveBeenCalled()
    expect(result).toEqual({
      accountId: 'account-1',
      userId: 'user-1',
      displayName: '新名字',
      email: undefined,
      phone: '+8613800138000',
      tenantId: 'tenant-1',
      tenantName: '达屋科技',
      scopeLevel: 'TENANT',
      isEnabled: true
    })
  })

  it('loads one tenant login-mfa policy from the current tenant context', async () => {
    const authAdapter = {
      getTenantMfaPolicy: jest.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        loginRequired: true,
        scenarioRequirements: [
          { scenario: 1, required: true },
          { scenario: 3, required: true },
          { scenario: 4, required: false },
          { scenario: 2, required: false }
        ],
        factors: [
          {
            factor: MfaBindingType.MFA_BINDING_TYPE_SMS_OTP,
            enabled: true,
            priority: 2
          },
          {
            factor: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
            enabled: true,
            priority: 1
          }
        ]
      })
    }

    const useCase = new AdminSecurityUseCase(authAdapter as any, {} as any, {} as any)
    const result = await useCase.getTenantMfaPolicy(
      {
        user: {
          sub: 'operator-1',
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1'
        }
      } as any
    )

    expect(authAdapter.getTenantMfaPolicy).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        user: expect.objectContaining({
          sub: 'operator-1',
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1'
        })
      })
    )
    expect(result).toEqual({
      tenantId: 'tenant-1',
      loginRequired: true,
      scenarioRequirements: [
        {
          scenario: 'LOGIN',
          required: true
        },
        {
          scenario: 'CHANGE_PASSWORD',
          required: true
        },
        {
          scenario: 'CHANGE_CONTACT',
          required: false
        },
        {
          scenario: 'NEW_DEVICE_LOGIN',
          required: false
        }
      ],
      factors: [
        {
          factor: 'EMAIL_OTP',
          enabled: true,
          priority: 1
        },
        {
          factor: 'SMS_OTP',
          enabled: true,
          priority: 2
        }
      ]
    })
  })

  it('updates one tenant login-mfa policy inside the current tenant context', async () => {
    const authAdapter = {
      updateTenantMfaPolicy: jest.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        loginRequired: true,
        scenarioRequirements: [
          { scenario: 1, required: true },
          { scenario: 3, required: false },
          { scenario: 4, required: true },
          { scenario: 2, required: true }
        ],
        factors: [
          {
            factor: MfaBindingType.MFA_BINDING_TYPE_TOTP,
            enabled: true,
            priority: 1
          },
          {
            factor: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
            enabled: true,
            priority: 2
          },
          {
            factor: MfaBindingType.MFA_BINDING_TYPE_BACKUP_CODE,
            enabled: false,
            priority: 3
          }
        ]
      })
    }

    const useCase = new AdminSecurityUseCase(authAdapter as any, {} as any, {} as any)
    const result = await useCase.updateTenantMfaPolicy(
      {
        loginRequired: true,
        scenarioRequirements: [
          {
            scenario: 'LOGIN',
            required: true
          },
          {
            scenario: 'CHANGE_PASSWORD',
            required: false
          },
          {
            scenario: 'CHANGE_CONTACT',
            required: true
          },
          {
            scenario: 'NEW_DEVICE_LOGIN',
            required: true
          }
        ],
        factors: [
          {
            factor: 'TOTP',
            enabled: true,
            priority: 1
          },
          {
            factor: 'EMAIL_OTP',
            enabled: true,
            priority: 2
          },
          {
            factor: 'BACKUP_CODE',
            enabled: false,
            priority: 3
          }
        ]
      } as any,
      {
        user: {
          sub: 'operator-1',
          scopeLevel: 'TENANT',
          tid: 'tenant-1'
        }
      } as any
    )

    expect(authAdapter.updateTenantMfaPolicy).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        loginRequired: true,
        scenarioRequirements: [
          {
            scenario: 'LOGIN',
            required: true
          },
          {
            scenario: 'CHANGE_PASSWORD',
            required: false
          },
          {
            scenario: 'CHANGE_CONTACT',
            required: true
          },
          {
            scenario: 'NEW_DEVICE_LOGIN',
            required: true
          }
        ],
        factors: [
          {
            factor: 'TOTP',
            enabled: true,
            priority: 1
          },
          {
            factor: 'EMAIL_OTP',
            enabled: true,
            priority: 2
          },
          {
            factor: 'BACKUP_CODE',
            enabled: false,
            priority: 3
          }
        ]
      },
      expect.objectContaining({
        user: expect.objectContaining({
          sub: 'operator-1',
          scopeLevel: 'TENANT',
          tid: 'tenant-1'
        })
      })
    )
    expect(result).toEqual({
      tenantId: 'tenant-1',
      loginRequired: true,
      scenarioRequirements: [
        {
          scenario: 'LOGIN',
          required: true
        },
        {
          scenario: 'CHANGE_PASSWORD',
          required: false
        },
        {
          scenario: 'CHANGE_CONTACT',
          required: true
        },
        {
          scenario: 'NEW_DEVICE_LOGIN',
          required: true
        }
      ],
      factors: [
        {
          factor: 'TOTP',
          enabled: true,
          priority: 1
        },
        {
          factor: 'EMAIL_OTP',
          enabled: true,
          priority: 2
        },
        {
          factor: 'BACKUP_CODE',
          enabled: false,
          priority: 3
        }
      ]
    })
  })

  it('lists account directory rows with pagination metadata', async () => {
    const authAdapter = {}
    const identityAdapter = {
      listAccounts: jest.fn().mockResolvedValue({
        accounts: [
          {
            accountId: 'account-1',
            userId: 'user-1',
            userPartyId: 'party-1',
            tenantId: 'tenant-1',
            displayName: 'Alpha Admin',
            userDisplayName: 'legacy-janny',
            scopeLevel: 'TENANT',
            isEnabled: true
          },
          {
            accountId: 'account-2',
            userId: 'user-2',
            userPartyId: 'party-2',
            tenantId: 'tenant-1',
            displayName: 'Legacy Account / Alpha Tenant tenant-1',
            scopeLevel: 'TENANT',
            isEnabled: true
          }
        ],
        total: 42
      })
    }
    const partyAdapter = {
      getPartyById: jest
        .fn()
        .mockResolvedValueOnce({ party: { id: 'party-1', legalName: '张三' } })
        .mockResolvedValueOnce({ party: { id: 'party-2', legalName: '李四' } }),
    }
    const tenantOrgAdapter = {
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          name: 'Alpha Tenant'
        }
      })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      partyAdapter as any,
      tenantOrgAdapter as any,
    )
    const result = await useCase.listAccounts(
      { keyword: '', page: 1, pageSize: 20, scopeLevel: 'TENANT', status: 'ENABLED', tenantId: 'tenant-1' } as any,
      { user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } } as any
    )

    expect(identityAdapter.listAccounts).toHaveBeenCalledWith(
      {
        keyword: undefined,
        page: 1,
        pageSize: 20,
        scopeLevel: 'TENANT',
        status: 'ENABLED',
        tenantId: 'tenant-1'
      },
      expect.objectContaining({ user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } })
    )
    expect(tenantOrgAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } })
    )
    expect(result).toEqual({
      items: [
        {
          accountId: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          accountDisplayName: 'Alpha Admin',
          userDisplayName: '张三',
          scopeLevel: 'TENANT',
          isEnabled: true
        },
        {
          accountId: 'account-2',
          userId: 'user-2',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          accountDisplayName: 'Legacy Account / Alpha Tenant tenant-1',
          userDisplayName: '李四',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      ],
      page: 1,
      pageSize: 20,
      total: 42
    })
  })

  it('searches by email and returns masked contact fields, account summaries, and active session count', async () => {
    const authAdapter = {
      adminListUserSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-1',
            userId: 'user-1',
            accountId: 'account-1',
            tenantId: 'tenant-1',
            isRevoked: false,
            isAccessExpired: false
          },
          {
            sessionId: 'session-2',
            userId: 'user-1',
            accountId: 'account-1',
            tenantId: 'tenant-1',
            isRevoked: true,
            isAccessExpired: false
          }
        ]
      })
    }
    const identityAdapter = {
      getUserById: jest.fn().mockResolvedValue({ user: undefined }),
      getUserByEmail: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          partyId: 'party-1',
          username: 'legacy-handle',
          personalEmail: 'victor@example.com',
          personalPhone: '+15550000001',
          isActive: true
        }
      }),
      getUserByPhone: jest.fn().mockResolvedValue({ user: undefined }),
      getAccountsByUserId: jest.fn().mockResolvedValue({
        accounts: [
          {
            accountId: 'account-1',
            tenantId: 'tenant-1',
            displayName: 'Victor / Tenant',
            scopeLevel: 'TENANT'
          }
        ]
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          name: 'Tenant One'
        }
      })
    }
    const partyAdapter = {
      getPartyById: jest.fn().mockResolvedValue({
        party: {
          id: 'party-1',
          legalName: 'Victor Chen'
        }
      })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      partyAdapter as any,
      tenantOrgAdapter as any
    )
    const result = await useCase.searchUsers(
      { keyword: 'victor@example.com', limit: 10 } as any,
      { user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } } as any
    )

    expect(identityAdapter.getUserByEmail).toHaveBeenCalledWith(
      'victor@example.com',
      expect.objectContaining({ user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } })
    )
    expect(result).toEqual({
      items: [
        {
          userId: 'user-1',
          displayName: 'Victor Chen',
          emailMasked: 'v***@example.com',
          phoneMasked: '+1*******001',
          accountSummaries: [
            {
              accountId: 'account-1',
              accountDisplayName: 'Victor / Tenant',
              tenantId: 'tenant-1',
              tenantName: 'Tenant One',
              scopeLevel: 'TENANT'
            }
          ],
          isOnline: true,
          activeSessionCount: 1
        }
      ]
    })
  })

  it('filters account summaries to the current tenant for tenant-scoped operators', async () => {
    const authAdapter = {
      adminListUserSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-1',
            userId: 'user-1',
            accountId: 'account-1',
            tenantId: 'tenant-1',
            isRevoked: false,
            isAccessExpired: false
          },
          {
            sessionId: 'session-2',
            userId: 'user-1',
            accountId: 'account-2',
            tenantId: 'tenant-2',
            isRevoked: false,
            isAccessExpired: false
          }
        ]
      })
    }
    const identityAdapter = {
      getUserById: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          personalEmail: 'victor@example.com',
          personalPhone: '+15550000001',
          isActive: true
        }
      }),
      getUserByEmail: jest.fn().mockResolvedValue({ user: undefined }),
      getUserByPhone: jest.fn().mockResolvedValue({ user: undefined }),
      getAccountsByUserId: jest.fn().mockResolvedValue({
        accounts: [
          {
            accountId: 'account-1',
            tenantId: 'tenant-1',
            displayName: 'Visible',
            scopeLevel: 'TENANT'
          },
          {
            accountId: 'account-2',
            tenantId: 'tenant-2',
            displayName: 'Hidden',
            scopeLevel: 'TENANT'
          }
        ]
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest
        .fn()
        .mockResolvedValueOnce({
          tenant: {
            id: 'tenant-1',
            name: 'Tenant One'
          }
        })
        .mockResolvedValueOnce({
          tenant: {
            id: 'tenant-2',
            name: 'Tenant Two'
          }
        })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      undefined,
      tenantOrgAdapter as any
    )
    const result = await useCase.searchUsers(
      { keyword: '550e8400-e29b-41d4-a716-446655440000', limit: 10 } as any,
      { user: { sub: 'operator-1', tid: 'tenant-1', scopeLevel: 'TENANT' } } as any
    )

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        accountSummaries: [
          {
            accountId: 'account-1',
            accountDisplayName: 'Visible',
            tenantId: 'tenant-1',
            tenantName: 'Tenant One',
            scopeLevel: 'TENANT'
          }
        ],
        activeSessionCount: 1
      })
    )
  })

  it('aggregates online-user summaries by user and derives active-account counts', async () => {
    const authAdapter = {
      adminListOnlineUsers: jest.fn().mockResolvedValue({
        items: [
          {
            userId: 'user-1',
            tenantId: 'tenant-1',
            activeSessionCount: '1',
            lastActiveAt: '2026-04-09T09:10:00.000Z'
          },
          {
            userId: 'user-1',
            tenantId: 'tenant-2',
            activeSessionCount: '2',
            lastActiveAt: '2026-04-09T10:10:00.000Z'
          }
        ],
        nextCursor: 'cursor-2'
      }),
      adminListUserSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-1',
            userId: 'user-1',
            accountId: 'account-1',
            tenantId: 'tenant-1',
            status: 'ACTIVE',
            loginMethod: 'EMAIL_PASSWORD',
            createdAt: '2026-04-09T08:00:00.000Z',
            lastActiveAt: '2026-04-09T09:10:00.000Z',
            expiresAt: '2026-04-09T11:00:00.000Z',
            refreshExpiresAt: '2026-04-10T08:00:00.000Z',
            accessRemainingSeconds: '300',
            refreshRemainingSeconds: '86400',
            sessionAgeSeconds: '4200',
            idleSeconds: '20',
            isAccessExpired: false,
            isRefreshExpired: false,
            isRevoked: false,
            isAdminControlled: true
          },
          {
            sessionId: 'session-2',
            userId: 'user-1',
            accountId: 'account-2',
            tenantId: 'tenant-2',
            status: 'ACTIVE',
            loginMethod: 'EMAIL_PASSWORD',
            createdAt: '2026-04-09T09:00:00.000Z',
            lastActiveAt: '2026-04-09T10:10:00.000Z',
            expiresAt: '2026-04-09T12:00:00.000Z',
            refreshExpiresAt: '2026-04-10T09:00:00.000Z',
            accessRemainingSeconds: '600',
            refreshRemainingSeconds: '86400',
            sessionAgeSeconds: '3600',
            idleSeconds: '30',
            isAccessExpired: false,
            isRefreshExpired: false,
            isRevoked: false,
            isAdminControlled: true
          },
          {
            sessionId: 'session-3',
            userId: 'user-1',
            accountId: 'account-2',
            tenantId: 'tenant-2',
            status: 'REVOKED',
            loginMethod: 'EMAIL_PASSWORD',
            createdAt: '2026-04-09T07:00:00.000Z',
            lastActiveAt: '2026-04-09T07:30:00.000Z',
            expiresAt: '2026-04-09T08:00:00.000Z',
            refreshExpiresAt: '2026-04-10T07:00:00.000Z',
            accessRemainingSeconds: '0',
            refreshRemainingSeconds: '0',
            sessionAgeSeconds: '1800',
            idleSeconds: '1800',
            isAccessExpired: true,
            isRefreshExpired: true,
            isRevoked: true,
            isAdminControlled: true
          }
        ]
      })
    }
    const identityAdapter = {
      getUserById: jest.fn().mockResolvedValue({
        user: {
          userId: 'user-1',
          partyId: 'party-1',
          username: 'legacy-vic'
        }
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest
        .fn()
        .mockResolvedValueOnce({
          tenant: {
            tenantId: 'tenant-1',
            name: 'Tenant A'
          }
        })
        .mockResolvedValueOnce({
          tenant: {
            tenantId: 'tenant-2',
            name: 'Tenant B'
          }
        })
    }
    const partyAdapter = {
      getPartyById: jest.fn().mockResolvedValue({
        party: {
          id: 'party-1',
          legalName: '陈双鹏',
        },
      }),
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      partyAdapter as any,
      tenantOrgAdapter as any,
    )
    const result = await useCase.listOnlineUsers(
      { tenantId: 'tenant-1', query: 'vic', pageSize: 20 },
      { user: { sub: 'operator-1' } }
    )

    expect(authAdapter.adminListOnlineUsers).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1' }),
      expect.objectContaining({ user: { sub: 'operator-1' } })
    )
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          userId: 'user-1',
          displayName: '陈双鹏',
          activeSessionCount: 3,
          activeAccountCount: 2,
          visibleTenantCount: 2,
          tenantNames: ['Tenant A', 'Tenant B']
        })
      ],
      nextCursor: 'cursor-2'
    })
  })

  it('maps admin-visible sessions from the downstream auth adapter and enriches account names', async () => {
    const authAdapter = {
      adminListUserSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-1',
            userId: 'user-1',
            accountId: 'account-1',
            tenantId: 'tenant-1',
            status: 'ACTIVE',
            loginMethod: 'EMAIL_PASSWORD',
            createdAt: '2026-04-09T10:00:00.000Z',
            lastActiveAt: '2026-04-09T10:10:00.000Z',
            expiresAt: '2026-04-09T11:00:00.000Z',
            refreshExpiresAt: '2026-04-10T10:00:00.000Z',
            accessRemainingSeconds: '300',
            refreshRemainingSeconds: '86400',
            sessionAgeSeconds: '600',
            idleSeconds: '30',
            isAccessExpired: false,
            isRefreshExpired: false,
            isRevoked: false,
            isAdminControlled: true,
            adminRevokeReason: 'Security incident'
          }
        ]
      })
    }
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          accountId: 'account-1',
          displayName: 'System Admin'
        }
      })
    }

    const useCase = new AdminSecurityUseCase(authAdapter as any, identityAdapter as any, {} as any)
    const result = await useCase.listUserSessions('user-1', { user: { sub: 'operator-1' } })

    expect(authAdapter.adminListUserSessions).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ user: { sub: 'operator-1' } })
    )
    expect(result.sessions[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-1',
        userId: 'user-1',
        accountId: 'account-1',
        accountName: 'System Admin',
        tenantId: 'tenant-1',
        isAdminControlled: true,
        adminRevokeReason: 'Security incident'
      })
    )
  })

  it('maps administrative auth audit records into the HTTP list view model', async () => {
    const authAdapter = {
      listAuditEvents: jest.fn().mockResolvedValue({
        items: [
          {
            eventId: 'audit-1',
            service: 'auth-service',
            eventType: 'SESSION_REVOKED',
            tenantId: 'tenant-1',
            detailsJson: '{"reason":"Security incident"}'
          }
        ],
        nextCursor: 'cursor-2'
      })
    }

    const useCase = new AdminSecurityUseCase(authAdapter as any, {} as any, {} as any)
    const result = await useCase.listAuditEvents(
      { tenantId: 'tenant-1', pageSize: 20 },
      { user: { sub: 'operator-1' } }
    )

    expect(authAdapter.listAuditEvents).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', pageSize: 20 }),
      expect.objectContaining({ user: { sub: 'operator-1' } })
    )
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          eventId: 'audit-1',
          service: 'auth-service',
          eventType: 'SESSION_REVOKED',
          tenantId: 'tenant-1'
        })
      ],
      nextCursor: 'cursor-2'
    })
  })

  it('creates an account, bootstraps login methods, and assigns initial roles', async () => {
    const authAdapter = {
      bootstrapUserLoginMethods: jest.fn().mockResolvedValue({
        phoneBootstrapped: true,
        emailBootstrapped: false,
        passwordBootstrapped: false
      })
    }
    const identityAdapter = {
      createUserAccount: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          displayName: 'Tenant Admin',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      })
    }
    const permissionService = {
      setAccountRoles: jest.fn().mockResolvedValue(undefined)
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      permissionService as any
    )
    const source = {
      user: {
        sub: 'operator-1',
        tid: 'tenant-1',
        scopeLevel: 'TENANT'
      }
    } as any

    const result = await useCase.createAccount(
      {
        scopeLevel: 'TENANT',
        tenantId: 'tenant-2',
        displayName: 'Tenant Admin',
        phone: '+15550000001',
        initialRoleIds: ['role-1', 'role-2']
      } as any,
      source
    )

    expect(identityAdapter.createUserAccount).toHaveBeenCalledWith(
      {
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        displayName: 'Tenant Admin',
        username: 'Tenant Admin',
        email: undefined,
        phone: '+15550000001'
      },
      source
    )
    expect(authAdapter.bootstrapUserLoginMethods).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        accountId: 'account-1',
        displayName: 'Tenant Admin',
        email: undefined,
        phone: '+15550000001'
      },
      source
    )
    expect(permissionService.setAccountRoles).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        accountType: 'USER',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        roleIds: ['role-1', 'role-2']
      },
      source
    )
    expect(result).toEqual({
      accountId: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      tenantName: undefined,
      accountDisplayName: 'Tenant Admin',
      userDisplayName: 'Tenant Admin',
      scopeLevel: 'TENANT',
      isEnabled: true
    })
  })

  it('updates account enabled state through the merged basic-info flow and recycles sessions on disable', async () => {
    const authAdapter = {
      adminDeleteAccountSessions: jest.fn().mockResolvedValue({
        success: true,
        deletedSessionCount: 2
      })
    }
    const identityAdapter = {
      getAccountById: jest
        .fn()
        .mockResolvedValueOnce({
          account: {
            id: 'account-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            displayName: 'Tenant Admin',
            scopeLevel: 'TENANT',
            isEnabled: true
          }
        })
        .mockResolvedValueOnce({
          account: {
            id: 'account-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            displayName: 'Tenant Admin',
            scopeLevel: 'TENANT',
            isEnabled: false
          }
        }),
      getUserById: jest
        .fn()
        .mockResolvedValueOnce({
          user: {
            id: 'user-1',
            personalEmail: 'tenant@example.com',
            personalPhone: '+8613800138000'
          }
        })
        .mockResolvedValueOnce({
          user: {
            id: 'user-1',
            personalEmail: 'tenant@example.com',
            personalPhone: '+8613800138000'
          }
        }),
      updateAccountProfile: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          displayName: 'Tenant Admin',
          scopeLevel: 'TENANT',
          isEnabled: false
        }
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          name: 'Tenant A'
        }
      })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      undefined,
      tenantOrgAdapter as any
    )
    const source = {
      user: {
        sub: 'operator-1',
        scopeLevel: 'TENANT',
        permissions: ['identity.account.update_status']
      }
    } as any

    const result = await useCase.updateAccountBasicInfo(
      'account-1',
      {
        displayName: 'Tenant Admin',
        isEnabled: false
      } as any,
      source
    )

    expect(identityAdapter.updateAccountProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1',
        isEnabled: false
      }),
      source
    )
    expect(authAdapter.adminDeleteAccountSessions).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        accountId: 'account-1',
        reason: 'ACCOUNT_DISABLED'
      },
      source
    )
    expect(result).toEqual({
      accountId: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      tenantName: 'Tenant A',
      displayName: 'Tenant Admin',
      email: 'tenant@example.com',
      phone: '+8613800138000',
      scopeLevel: 'TENANT',
      isEnabled: false
    })
  })

  it('does not recycle sessions when the merged basic-info flow re-enables an account', async () => {
    const authAdapter = {
      adminDeleteAccountSessions: jest.fn()
    }
    const identityAdapter = {
      getAccountById: jest
        .fn()
        .mockResolvedValueOnce({
          account: {
            id: 'account-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            displayName: 'Tenant Admin',
            scopeLevel: 'TENANT',
            isEnabled: false
          }
        })
        .mockResolvedValueOnce({
          account: {
            id: 'account-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            displayName: 'Tenant Admin',
            scopeLevel: 'TENANT',
            isEnabled: true
          }
        }),
      getUserById: jest
        .fn()
        .mockResolvedValueOnce({
          user: {
            id: 'user-1',
            personalEmail: 'tenant@example.com',
            personalPhone: '+8613800138000'
          }
        })
        .mockResolvedValueOnce({
          user: {
            id: 'user-1',
            personalEmail: 'tenant@example.com',
            personalPhone: '+8613800138000'
          }
        }),
      updateAccountProfile: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          displayName: 'Tenant Admin',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          name: 'Tenant A'
        }
      })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      {} as any,
      undefined,
      tenantOrgAdapter as any
    )

    await expect(
      useCase.updateAccountBasicInfo(
        'account-1',
        {
          displayName: 'Tenant Admin',
          isEnabled: true
        } as any,
        {
          user: {
            sub: 'operator-1',
            scopeLevel: 'TENANT',
            permissions: ['identity.account.update_status']
          }
        } as any
      )
    ).resolves.toMatchObject({
      accountId: 'account-1',
      isEnabled: true
    })

    expect(authAdapter.adminDeleteAccountSessions).not.toHaveBeenCalled()
  })

  it('lists tenant options for system-scope account creation selectors', async () => {
    const tenantOrgAdapter = {
      listTenants: jest.fn().mockResolvedValue({
        tenants: [
          {
            id: 'tenant-1',
            code: 'alpha',
            name: 'Alpha Tenant',
            isActive: true
          }
        ]
      })
    }

    const useCase = new AdminSecurityUseCase(
      {} as any,
      {} as any,
      {} as any,
      undefined,
      tenantOrgAdapter as any
    )
    const result = await useCase.listTenantOptions(
      { keyword: 'alpha', pageSize: 10 } as any,
      { user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } } as any
    )

    expect(tenantOrgAdapter.listTenants).toHaveBeenCalledWith(
      {
        keyword: 'alpha',
        pageSize: 10
      },
      expect.objectContaining({ user: { sub: 'operator-1', scopeLevel: 'SYSTEM' } })
    )
    expect(result).toEqual({
      items: [
        {
          id: 'tenant-1',
          code: 'alpha',
          name: 'Alpha Tenant',
          isActive: true
        }
      ]
    })
  })

  it('rejects revoking the current operator session before calling downstream auth-service', async () => {
    const authAdapter = {
      adminRevokeSession: jest.fn()
    }

    const useCase = new AdminSecurityUseCase(authAdapter as any, {} as any, {} as any)

    await expect(
      useCase.revokeSession(
        'session-1',
        { reason: 'Security incident' },
        { user: { sid: 'session-1' } } as any
      )
    ).rejects.toThrow('CANNOT_REVOKE_CURRENT_SESSION')
    expect(authAdapter.adminRevokeSession).not.toHaveBeenCalled()
  })

  it('loads one account deletion impact view through the identity adapter', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT'
        }
      }),
      getAccountDeletionImpact: jest.fn().mockResolvedValue({
        accountId: 'account-1',
        canDelete: false,
        userRetained: true,
        cleanupPlan: {
          willDeleteSessions: true,
          willClearRoles: true,
          willDeleteContactAssets: true
        },
        blockingReasons: [
          {
            resourceType: 'sales_order_owner',
            resourceCount: 4,
            message: '账号仍有业务归属'
          }
        ],
        contactAssetCount: 1
      })
    }

    const useCase = new AdminSecurityUseCase({} as any, identityAdapter as any, {} as any)

    await expect(
      useCase.getAccountDeletionImpact(
        'account-1',
        { user: { sub: 'operator-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' } } as any
      )
    ).resolves.toEqual({
      accountId: 'account-1',
      canDelete: false,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteContactAssets: true
      },
      blockingReasons: [
        {
          resourceType: 'sales_order_owner',
          resourceCount: 4,
          message: '账号仍有业务归属'
        }
      ],
      contactAssetCount: 1
    })
  })

  it('deletes one account by clearing sessions, clearing roles, and deleting identity state in order', async () => {
    const authAdapter = {
      adminDeleteAccountSessions: jest.fn().mockResolvedValue({
        success: true,
        deletedSessionCount: 3
      })
    }
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT'
        }
      }),
      getAccountDeletionImpact: jest.fn().mockResolvedValue({
        accountId: 'account-1',
        canDelete: true,
        userRetained: true,
        cleanupPlan: {
          willDeleteSessions: true,
          willClearRoles: true,
          willDeleteContactAssets: true
        },
        blockingReasons: [],
        contactAssetCount: 2
      }),
      deleteAccount: jest.fn().mockResolvedValue({
        accountId: 'account-1',
        deletedContactAssetCount: 2,
        userRetained: true
      })
    }
    const permissionService = {
      deletePolicy: jest.fn().mockResolvedValue(undefined),
      listPolicies: jest.fn().mockResolvedValue({
        policies: [{ id: 'policy-1' }, { id: 'policy-2' }]
      }),
      listAccountRoles: jest.fn().mockResolvedValue({
        roles: [{ id: 'role-1' }, { id: 'role-2' }]
      }),
      setAccountRoles: jest.fn().mockResolvedValue({
        roles: []
      })
    }

    const useCase = new AdminSecurityUseCase(
      authAdapter as any,
      identityAdapter as any,
      permissionService as any
    )
    const source = {
      user: {
        sub: 'operator-1',
        aid: 'account-admin',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1'
      }
    } as any

    await expect(useCase.deleteAccount('account-1', source)).resolves.toEqual({
      accountId: 'account-1',
      success: true,
      deletedSessionCount: 3,
      clearedRoleCount: 2,
      deletedPolicyCount: 2,
      deletedContactAssetCount: 2,
      userRetained: true
    })

    expect(authAdapter.adminDeleteAccountSessions.mock.invocationCallOrder[0]).toBeLessThan(
      permissionService.setAccountRoles.mock.invocationCallOrder[0]
    )
    expect(permissionService.setAccountRoles.mock.invocationCallOrder[0]).toBeLessThan(
      permissionService.deletePolicy.mock.invocationCallOrder[0]
    )
    expect(permissionService.deletePolicy.mock.invocationCallOrder[1]).toBeLessThan(
      identityAdapter.deleteAccount.mock.invocationCallOrder[0]
    )
    expect(permissionService.listPolicies).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 100,
        subjectId: 'account-1',
        subjectType: PolicySubjectTypeProto.POLICY_SUBJECT_TYPE_PROTO_ACCOUNT
      },
      source
    )
    expect(permissionService.deletePolicy).toHaveBeenNthCalledWith(
      1,
      { id: 'policy-1' },
      source
    )
    expect(permissionService.deletePolicy).toHaveBeenNthCalledWith(
      2,
      { id: 'policy-2' },
      source
    )
    expect(identityAdapter.deleteAccount).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        deletedSessionCount: 3,
        clearedRoleCount: 2,
        deletedPolicyCount: 2
      },
      source
    )
    expect(permissionService.setAccountRoles).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        accountType: 'USER',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        roleIds: []
      },
      source
    )
  })

  it('rejects deleting the current login account', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-current',
          userId: 'user-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT'
        }
      })
    }

    const useCase = new AdminSecurityUseCase({} as any, identityAdapter as any, {} as any)

    await expect(
      useCase.deleteAccount(
        'account-current',
        {
          user: {
            sub: 'operator-1',
            aid: 'account-current',
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1'
          }
        } as any
      )
    ).rejects.toThrow('Current login account cannot be deleted')
  })
})
