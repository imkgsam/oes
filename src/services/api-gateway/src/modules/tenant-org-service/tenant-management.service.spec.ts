import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { OrgManagementService } from './org-management.service'
import { TenantManagementService } from './tenant-management.service'

// Verifies the tenant management gateway service stays system-scoped while composing tenant and root-org read models.
describe('TenantManagementService', () => {
  const tenantOrgQueryAdapter = {
    getOrgUnitById: jest.fn(),
    getTenantById: jest.fn(),
    listTenants: jest.fn()
  }
  const tenantOrgManagementAdapter = {
    archiveTenant: jest.fn(),
    createTenant: jest.fn(),
    reactivateTenant: jest.fn(),
    retryTenantOnboarding: jest.fn(),
    startTenantOnboarding: jest.fn(),
    suspendTenant: jest.fn(),
    updateTenantProfile: jest.fn()
  }
  const identityUserLookupAdapter = {
    getUserByEmail: jest.fn(),
    getUserByPhone: jest.fn()
  }
  const identityTenantAccountStatsAdapter = {
    countTenantAccounts: jest.fn()
  }

  const service = new TenantManagementService(
    tenantOrgQueryAdapter as any,
    tenantOrgManagementAdapter as any,
    identityUserLookupAdapter as any,
    identityTenantAccountStatsAdapter as any
  )

  beforeEach(() => {
    tenantOrgQueryAdapter.getOrgUnitById.mockReset()
    tenantOrgQueryAdapter.getTenantById.mockReset()
    tenantOrgQueryAdapter.listTenants.mockReset()
    tenantOrgManagementAdapter.archiveTenant.mockReset()
    tenantOrgManagementAdapter.createTenant.mockReset()
    tenantOrgManagementAdapter.reactivateTenant.mockReset()
    tenantOrgManagementAdapter.retryTenantOnboarding.mockReset()
    tenantOrgManagementAdapter.startTenantOnboarding.mockReset()
    tenantOrgManagementAdapter.suspendTenant.mockReset()
    tenantOrgManagementAdapter.updateTenantProfile.mockReset()
    identityUserLookupAdapter.getUserByEmail.mockReset()
    identityUserLookupAdapter.getUserByPhone.mockReset()
    identityTenantAccountStatsAdapter.countTenantAccounts.mockReset()
  })

  it('rejects tenant-scoped operators before calling downstream tenant management contracts', async () => {
    const tenantScopedSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(service.listTenants({}, tenantScopedSource as any)).rejects.toBeInstanceOf(
      ForbiddenException
    )
    await expect(service.createTenant({ code: 'alpha', name: 'Alpha' }, tenantScopedSource as any)).rejects.toBeInstanceOf(
      ForbiddenException
    )

    expect(tenantOrgQueryAdapter.listTenants).not.toHaveBeenCalled()
    expect(tenantOrgManagementAdapter.createTenant).not.toHaveBeenCalled()
  })

  it('lists tenant summaries for system operators', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.listTenants.mockResolvedValue({
      tenants: [{ id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', isActive: true, rootOrgId: 'org-root-1' }],
      total: 1
    })
    identityTenantAccountStatsAdapter.countTenantAccounts.mockResolvedValue({
      counts: [{ tenantId: 'tenant-1', total: 3 }]
    })

    await expect(
      service.listTenants(
        {
          keyword: 'alpha',
          page: 2,
          pageSize: 20,
          status: 'ACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          id: 'tenant-1',
          code: 'alpha',
          name: 'Alpha Tenant',
          userCount: 3,
          status: 'ACTIVE'
        }
      ],
      page: 2,
      pageSize: 20,
      total: 1
    })

    expect(tenantOrgQueryAdapter.listTenants).toHaveBeenCalledWith(
      {
        keyword: 'alpha',
        page: 2,
        pageSize: 20,
        status: 'ACTIVE'
      },
      source
    )
    expect(identityTenantAccountStatsAdapter.countTenantAccounts).toHaveBeenCalledWith(
      {
        scopeLevel: 'TENANT',
        status: 'ENABLED',
        tenantIds: ['tenant-1']
      },
      source
    )
  })

  it('hydrates one tenant detail with root org metadata when the tenant exists', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.getTenantById.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        code: 'alpha',
        name: 'Alpha Tenant',
        isActive: false,
        rootOrgId: 'org-root-1'
      }
    })
    tenantOrgQueryAdapter.getOrgUnitById.mockResolvedValue({
      orgUnit: {
        id: 'org-root-1',
        name: 'Alpha Root'
      }
    })
    identityTenantAccountStatsAdapter.countTenantAccounts.mockResolvedValue({
      counts: [{ tenantId: 'tenant-1', total: 3 }]
    })

    await expect(service.getTenantById('tenant-1', source as any)).resolves.toEqual({
      tenant: {
        id: 'tenant-1',
        code: 'alpha',
        name: 'Alpha Tenant',
        rootOrgId: 'org-root-1',
        rootOrgName: 'Alpha Root',
        status: 'SUSPENDED',
        userCount: 3
      }
    })

    expect(tenantOrgQueryAdapter.getTenantById).toHaveBeenCalledWith('tenant-1', source)
    expect(tenantOrgQueryAdapter.getOrgUnitById).toHaveBeenCalledWith(
      {
        orgUnitId: 'org-root-1',
        tenantId: 'tenant-1'
      },
      source
    )
    expect(identityTenantAccountStatsAdapter.countTenantAccounts).toHaveBeenCalledWith(
      {
        scopeLevel: 'TENANT',
        status: 'ENABLED',
        tenantIds: ['tenant-1']
      },
      source
    )
  })

  it('throws when the requested tenant does not exist', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgQueryAdapter.getTenantById.mockResolvedValue({ tenant: undefined })

    await expect(service.getTenantById('missing-tenant', source as any)).rejects.toBeInstanceOf(
      NotFoundException
    )
  })

  it('forwards tenant lifecycle writes to the dedicated management adapter', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgManagementAdapter.createTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' },
      rootOrgUnit: { id: 'org-root-1', name: 'Alpha Root' }
    })
    tenantOrgManagementAdapter.updateTenantProfile.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha-new', name: 'Alpha Tenant New', status: 'ACTIVE' }
    })
    tenantOrgManagementAdapter.suspendTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'SUSPENDED' }
    })
    tenantOrgManagementAdapter.reactivateTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }
    })
    tenantOrgManagementAdapter.archiveTenant.mockResolvedValue({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ARCHIVED' }
    })

    await expect(
      service.createTenant(
        {
          code: 'alpha',
          name: 'Alpha Tenant',
          rootOrgName: 'Alpha Root'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' },
      rootOrgUnit: { id: 'org-root-1', name: 'Alpha Root' }
    })

    await expect(
      service.updateTenantProfile(
        'tenant-1',
        {
          code: 'alpha-new',
          name: 'Alpha Tenant New'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha-new', name: 'Alpha Tenant New', status: 'ACTIVE' }
    })

    await expect(
      service.updateTenantStatus(
        'tenant-1',
        {
          reason: 'Manual review',
          status: 'SUSPENDED'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'SUSPENDED' }
    })

    await expect(
      service.updateTenantStatus(
        'tenant-1',
        {
          status: 'ACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ACTIVE' }
    })

    await expect(
      service.updateTenantStatus(
        'tenant-1',
        {
          reason: 'Duplicate tenant',
          status: 'ARCHIVED'
        },
        source as any
      )
    ).resolves.toEqual({
      tenant: { id: 'tenant-1', code: 'alpha', name: 'Alpha Tenant', status: 'ARCHIVED' }
    })

    expect(tenantOrgManagementAdapter.createTenant).toHaveBeenCalledWith(
      {
        code: 'alpha',
        name: 'Alpha Tenant',
        rootOrgName: 'Alpha Root'
      },
      source
    )
    expect(tenantOrgManagementAdapter.updateTenantProfile).toHaveBeenCalledWith(
      {
        code: 'alpha-new',
        name: 'Alpha Tenant New',
        tenantId: 'tenant-1'
      },
      source
    )
    expect(tenantOrgManagementAdapter.suspendTenant).toHaveBeenCalledWith(
      {
        reason: 'Manual review',
        tenantId: 'tenant-1'
      },
      source
    )
    expect(tenantOrgManagementAdapter.reactivateTenant).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1'
      },
      source
    )
    expect(tenantOrgManagementAdapter.archiveTenant).toHaveBeenCalledWith(
      {
        reason: 'Duplicate tenant',
        tenantId: 'tenant-1'
      },
      source
    )
  })

  it('normalizes organization identifiers before starting tenant onboarding', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgManagementAdapter.startTenantOnboarding.mockResolvedValue({
      onboarding: { onboardingId: 'onboarding-1', status: 'SUCCEEDED' }
    })

    await expect(
      service.startTenantOnboarding(
        {
          idempotencyKey: 'onboarding-key-1',
          tenant: { code: 'tenant.beta', name: 'Beta Inc.' },
          organizationParty: {
            legalName: 'Beta Inc.',
            registeredCountry: 'US',
            identifiers: [
              {
                identifierType: 'EIN',
                rawValue: '12-3456789',
                normalizedValue: '',
                issuerCountryOrRegion: ''
              }
            ]
          },
          rootOrg: { name: 'Beta Inc.' },
          firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com' }
        },
        source as any
      )
    ).resolves.toEqual({
      onboarding: { onboardingId: 'onboarding-1', status: 'SUCCEEDED' }
    })

    expect(tenantOrgManagementAdapter.startTenantOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationParty: expect.objectContaining({
          identifiers: [
            {
              identifierType: 'EIN',
              issuerCountryOrRegion: 'US',
              normalizedValue: '123456789',
              rawValue: '12-3456789'
            }
          ]
        })
      }),
      source
    )
  })

  it('surfaces failed retryable tenant onboardings as HTTP 503 with retry details', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgManagementAdapter.startTenantOnboarding.mockResolvedValue({
      onboarding: {
        onboardingId: 'onboarding-1',
        status: 'FAILED_RETRYABLE',
        failure: {
          code: 'TENANT_ONBOARDING_STEP_FAILED',
          message: 'Internal service is unavailable',
          failedStep: 'REGISTER_ORGANIZATION_PARTY',
          retryable: true
        }
      }
    })

    await expect(
      service.startTenantOnboarding(
        {
          idempotencyKey: 'onboarding-key-1',
          tenant: { code: 'tenant.beta', name: 'Beta Inc.' },
          organizationParty: {
            legalName: 'Beta Inc.',
            registeredCountry: 'US',
            identifiers: [{ identifierType: 'EIN', rawValue: '12-3456789', normalizedValue: '', issuerCountryOrRegion: '' }]
          },
          rootOrg: { name: 'Beta Inc.' },
          firstAdmin: { displayName: 'Alice Admin', email: 'alice@example.com' }
        },
        source as any
      )
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'TENANT_ONBOARDING_STEP_FAILED',
        details: expect.objectContaining({
          onboarding: expect.objectContaining({
            onboardingId: 'onboarding-1',
            status: 'FAILED_RETRYABLE'
          })
        })
      }),
      status: 503
    })
  })

  it('surfaces failed retry attempts as HTTP errors instead of success envelopes', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    tenantOrgManagementAdapter.retryTenantOnboarding.mockResolvedValue({
      onboarding: {
        onboardingId: 'onboarding-1',
        status: 'FAILED_RETRYABLE',
        failure: {
          code: 'TENANT_ONBOARDING_STEP_FAILED',
          message: 'Internal service is unavailable',
          failedStep: 'REGISTER_ORGANIZATION_PARTY',
          retryable: true
        }
      }
    })

    await expect(
      service.retryTenantOnboarding('onboarding-1', { reason: 'retry after party-service restart' }, source as any)
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'TENANT_ONBOARDING_STEP_FAILED'
      }),
      status: 503
    })
  })

  it('finds an existing first-admin candidate by exact email without listing all users', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    identityUserLookupAdapter.getUserByEmail.mockResolvedValue({
      user: {
        id: 'user-existing-1',
        username: 'Existing Admin',
        personalEmail: 'existing@example.com',
        personalPhone: '+14155550100',
        isActive: true,
        partyId: 'party-1'
      }
    })

    await expect(
      service.searchFirstAdminExistingUsers({ keyword: 'existing@example.com' }, source as any)
    ).resolves.toEqual({
      items: [
        {
          userId: 'user-existing-1',
          displayName: 'Existing Admin',
          maskedEmail: 'ex***@example.com',
          maskedPhone: '+14***0100',
          isActive: true
        }
      ]
    })

    expect(identityUserLookupAdapter.getUserByEmail).toHaveBeenCalledWith('existing@example.com', source)
    expect(identityUserLookupAdapter.getUserByPhone).not.toHaveBeenCalled()
  })

  it('ignores partial first-admin email and phone search input without calling identity', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }

    await expect(
      service.searchFirstAdminExistingUsers({ keyword: 'existing@' }, source as any)
    ).resolves.toEqual({ items: [] })
    await expect(
      service.searchFirstAdminExistingUsers({ keyword: 'existing@example.' }, source as any)
    ).resolves.toEqual({ items: [] })
    await expect(
      service.searchFirstAdminExistingUsers({ keyword: 'existing@example.c' }, source as any)
    ).resolves.toEqual({ items: [] })
    await expect(
      service.searchFirstAdminExistingUsers({ keyword: '415', countryOrRegion: 'US' }, source as any)
    ).resolves.toEqual({ items: [] })

    expect(identityUserLookupAdapter.getUserByEmail).not.toHaveBeenCalled()
    expect(identityUserLookupAdapter.getUserByPhone).not.toHaveBeenCalled()
  })

  it('finds an existing first-admin candidate by a country-local phone input', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'account-1', scopeLevel: 'SYSTEM' } }
    identityUserLookupAdapter.getUserByPhone.mockResolvedValue({
      user: {
        id: 'user-existing-1',
        username: 'Existing Admin',
        personalEmail: 'existing@example.com',
        personalPhone: '+14155550100',
        isActive: true,
        partyId: 'party-1'
      }
    })

    await expect(
      service.searchFirstAdminExistingUsers(
        { keyword: '(415) 555-0100', countryOrRegion: 'US' },
        source as any
      )
    ).resolves.toEqual({
      items: [
        {
          userId: 'user-existing-1',
          displayName: 'Existing Admin',
          maskedEmail: 'ex***@example.com',
          maskedPhone: '+14***0100',
          isActive: true
        }
      ]
    })

    expect(identityUserLookupAdapter.getUserByPhone).toHaveBeenCalledWith('+14155550100', source)
    expect(identityUserLookupAdapter.getUserByEmail).not.toHaveBeenCalled()
  })

  it('forwards selected existing users as tenant first admins by user id', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'platform-account-1', scopeLevel: 'SYSTEM', sub: 'user-system-admin' }
    }
    tenantOrgManagementAdapter.startTenantOnboarding.mockResolvedValue({
      onboarding: { onboardingId: 'onboarding-1', status: 'SUCCEEDED' }
    })

    await expect(
      service.startTenantOnboarding(
        {
          idempotencyKey: 'onboarding-key-1',
          tenant: { code: 'tenant.beta', name: 'Beta Inc.' },
          organizationParty: {
            legalName: 'Beta Inc.',
            registeredCountry: 'US',
            identifiers: [{ identifierType: 'EIN', rawValue: '12-3456789', normalizedValue: '', issuerCountryOrRegion: '' }]
          },
          rootOrg: { name: 'Beta Inc.' },
          firstAdmin: {
            displayName: 'System Admin',
            existingUserId: 'user-existing-1',
            provisioningMode: 'EXISTING_USER'
          }
        },
        source as any
      )
    ).resolves.toEqual({
      onboarding: { onboardingId: 'onboarding-1', status: 'SUCCEEDED' }
    })

    expect(tenantOrgManagementAdapter.startTenantOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        firstAdmin: expect.objectContaining({
          displayName: 'System Admin',
          existingUserId: 'user-existing-1',
          provisioningMode: 'EXISTING_USER',
          requirePasswordSetup: false
        })
      }),
      source
    )
  })

})

// Verifies the org management gateway service keeps org tree operations scope-aware while reusing tenant-org-service contracts.
describe('OrgManagementService', () => {
  const tenantOrgQueryAdapter = {
    getOrgTreeByTenantId: jest.fn(),
    getOrgUnitById: jest.fn(),
    getTenantById: jest.fn()
  }
  const partyQueryAdapter = {
    getPartyById: jest.fn()
  }
  const tenantOrgManagementAdapter = {
    archiveOrgUnit: jest.fn(),
    createOrgUnit: jest.fn(),
    updateOrgUnit: jest.fn()
  }

  const service = new OrgManagementService(
    tenantOrgQueryAdapter as any,
    partyQueryAdapter as any,
    tenantOrgManagementAdapter as any
  )

  beforeEach(() => {
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockReset()
    tenantOrgQueryAdapter.getOrgUnitById.mockReset()
    tenantOrgQueryAdapter.getTenantById.mockReset()
    partyQueryAdapter.getPartyById.mockReset()
    tenantOrgManagementAdapter.archiveOrgUnit.mockReset()
    tenantOrgManagementAdapter.createOrgUnit.mockReset()
    tenantOrgManagementAdapter.updateOrgUnit.mockReset()
  })

  it('lets tenant-scoped operators manage only their own tenant org tree', async () => {
    const tenantSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockResolvedValue({
      roots: [
        {
          children: [],
          orgUnit: {
            id: 'org-root-1',
            tenantId: 'tenant-1',
            parentOrgId: undefined,
            name: 'Alpha Root',
            type: 'ROOT',
            status: 'ACTIVE',
            path: '/org-root-1',
            sortOrder: 0
          }
        }
      ]
    })
    tenantOrgQueryAdapter.getOrgUnitById.mockResolvedValue({
      orgUnit: {
        id: 'org-root-1',
        tenantId: 'tenant-1',
        parentOrgId: undefined,
        name: 'Alpha Root',
        type: 'ROOT',
        status: 'ACTIVE',
        path: '/org-root-1',
        sortOrder: 0
      }
    })
    tenantOrgManagementAdapter.createOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-child-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-root-1',
        name: 'Manufacturing',
        type: 'DEPARTMENT',
        status: 'ACTIVE',
        path: '/org-root-1/org-child-1',
        sortOrder: 10
      }
    })

    await expect(service.getOrgTree('tenant-1', tenantSource as any)).resolves.toEqual({
      scope: 'TENANT',
      tenant: undefined,
      roots: [
        {
          children: [],
          orgUnit: {
            depth: 0,
            id: 'org-root-1',
            name: 'Alpha Root',
            organizationParty: null,
            organizationPartyId: null,
            parentOrgId: undefined,
            path: '/org-root-1',
            sortOrder: 0,
            status: 'ACTIVE',
            tenantId: 'tenant-1',
            type: 'ROOT'
          }
        }
      ]
    })

    await expect(service.getOrgUnitDetail('tenant-1', 'org-root-1', tenantSource as any)).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-root-1',
        name: 'Alpha Root',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: undefined,
        path: '/org-root-1',
        sortOrder: 0,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'ROOT'
      }
    })

    await expect(
      service.createOrgUnit(
        'tenant-1',
        {
          name: 'Manufacturing',
          parentOrgId: 'org-root-1',
          sortOrder: 10,
          type: 'DEPARTMENT'
        },
        tenantSource as any
      )
    ).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-child-1',
        name: 'Manufacturing',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-child-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })

    expect(tenantOrgQueryAdapter.getTenantById).not.toHaveBeenCalled()
    expect(tenantOrgQueryAdapter.getOrgTreeByTenantId).toHaveBeenCalledWith('tenant-1', tenantSource)
    expect(tenantOrgManagementAdapter.createOrgUnit).toHaveBeenCalledWith(
      {
        name: 'Manufacturing',
        parentOrgId: 'org-root-1',
        sortOrder: 10,
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      },
      tenantSource
    )
  })

  it('rejects tenant-scoped access to another tenant org tree', async () => {
    const tenantSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(service.getOrgTree('tenant-2', tenantSource as any)).rejects.toBeInstanceOf(
      ForbiddenException
    )
    await expect(
      service.archiveOrgUnit('tenant-2', 'org-2', tenantSource as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(tenantOrgQueryAdapter.getOrgTreeByTenantId).not.toHaveBeenCalled()
    expect(tenantOrgManagementAdapter.archiveOrgUnit).not.toHaveBeenCalled()
  })

  it('hydrates selected tenant metadata for system-scope org management', async () => {
    const systemSource = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'SYSTEM' }
    }
    tenantOrgQueryAdapter.getTenantById.mockResolvedValue({
      tenant: {
        id: 'tenant-9',
        code: 'tenant.nine',
        name: 'Tenant Nine',
        rootOrgId: 'org-root-9',
        status: 'ACTIVE'
      }
    })
    tenantOrgQueryAdapter.getOrgTreeByTenantId.mockResolvedValue({ roots: [] })

    await expect(service.getOrgTree('tenant-9', systemSource as any)).resolves.toEqual({
      scope: 'SYSTEM',
      tenant: {
        code: 'tenant.nine',
        id: 'tenant-9',
        name: 'Tenant Nine',
        rootOrgId: 'org-root-9',
        status: 'ACTIVE'
      },
      roots: []
    })

    expect(tenantOrgQueryAdapter.getTenantById).toHaveBeenCalledWith('tenant-9', systemSource)
  })

  it('updates and archives org units through the dedicated management adapter', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'SYSTEM' }
    }
    tenantOrgManagementAdapter.updateOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-child-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-root-1',
        name: 'Manufacturing Updated',
        type: 'DEPARTMENT',
        status: 'ACTIVE',
        path: '/org-root-1/org-child-1',
        sortOrder: 11
      }
    })
    tenantOrgManagementAdapter.archiveOrgUnit.mockResolvedValue({
      orgUnit: {
        id: 'org-child-1',
        tenantId: 'tenant-1',
        parentOrgId: 'org-root-1',
        name: 'Manufacturing Updated',
        type: 'DEPARTMENT',
        status: 'ARCHIVED',
        path: '/org-root-1/org-child-1',
        sortOrder: 11
      }
    })

    await expect(
      service.updateOrgUnit(
        'tenant-1',
        'org-child-1',
        {
          name: 'Manufacturing Updated',
          sortOrder: 11,
          type: 'DEPARTMENT'
        },
        source as any
      )
    ).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-child-1',
        name: 'Manufacturing Updated',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-child-1',
        sortOrder: 11,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })

    await expect(service.archiveOrgUnit('tenant-1', 'org-child-1', source as any)).resolves.toEqual({
      orgUnit: {
        depth: 0,
        id: 'org-child-1',
        name: 'Manufacturing Updated',
        organizationParty: null,
        organizationPartyId: null,
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-child-1',
        sortOrder: 11,
        status: 'ARCHIVED',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      }
    })

    expect(tenantOrgManagementAdapter.updateOrgUnit).toHaveBeenCalledWith(
      {
        name: 'Manufacturing Updated',
        orgUnitId: 'org-child-1',
        sortOrder: 11,
        tenantId: 'tenant-1',
        type: 'DEPARTMENT'
      },
      source
    )
    expect(tenantOrgManagementAdapter.archiveOrgUnit).toHaveBeenCalledWith(
      {
        orgUnitId: 'org-child-1',
        tenantId: 'tenant-1'
      },
      source
    )
  })
})
