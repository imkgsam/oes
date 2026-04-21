import { Reflector } from '@nestjs/core'
import { PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { NavigationController } from './navigation.controller'

// Verifies navigation management endpoints are guarded and proxied with stable request shapes.
describe('NavigationController', () => {
  const permissionService = {
    listNavigationEntries: jest.fn(),
    getNavigationEntry: jest.fn(),
    createNavigationEntry: jest.fn(),
    updateNavigationEntry: jest.fn(),
    getRoleNavigation: jest.fn(),
    setRoleNavigationVisibility: jest.fn(),
    setRoleLandingPolicies: jest.fn(),
    syncRoleNavigationFromTemplate: jest.fn(),
    resolveNavigationPreview: jest.fn()
  }

  const controller = new NavigationController(permissionService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected permissions on navigation management endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.listNavigationEntries)).toEqual({
      type: 'ALL',
      permissions: ['permission.navigation.entry.list']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.createNavigationEntry)).toEqual({
      type: 'ALL',
      permissions: ['permission.navigation.entry.create']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.getNavigationEntry)).toEqual({
      type: 'ALL',
      permissions: ['permission.navigation.entry.get_by_key']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.updateNavigationEntry)).toEqual({
      type: 'ALL',
      permissions: ['permission.navigation.entry.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.getRoleNavigation)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.get_by_id']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.setRoleNavigationVisibility)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.setRoleLandingPolicies)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.syncRoleNavigationFromTemplate)).toEqual({
      type: 'ALL',
      permissions: ['permission.role.update']
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, NavigationController.prototype.resolveNavigationPreview)).toEqual({
      type: 'ALL',
      permissions: ['permission.navigation.resolve_preview']
    })
  })

  it('forwards navigation entry registry requests to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    permissionService.listNavigationEntries.mockResolvedValue({ entries: [], total: 0 })
    permissionService.getNavigationEntry.mockResolvedValue({ entryKey: 'workbench.home' })
    permissionService.createNavigationEntry.mockResolvedValue({ entryKey: 'workbench.home' })
    permissionService.updateNavigationEntry.mockResolvedValue({ entryKey: 'workbench.home' })

    await controller.listNavigationEntries(
      { page: 2, pageSize: 50, keyword: 'workbench', terminal: 'WEB', enabled: false },
      source as any
    )
    await controller.getNavigationEntry('workbench.home', source as any)
    await controller.createNavigationEntry(
      {
        entryKey: 'workbench.home',
        name: 'Workbench',
        supportedTerminals: ['WEB'],
        registryPriority: 100,
        enabled: true,
        entryType: 'page'
      },
      source as any
    )
    await controller.updateNavigationEntry(
      'workbench.home',
      { name: 'Workbench Updated', enabled: false },
      source as any
    )

    expect(permissionService.listNavigationEntries).toHaveBeenCalledWith(
      {
        page: 2,
        pageSize: 50,
        keyword: 'workbench',
        featureKey: undefined,
        terminal: 'WEB',
        hasEnabledFilter: true,
        enabled: false
      },
      source
    )
    expect(permissionService.getNavigationEntry).toHaveBeenCalledWith(
      { entryKey: 'workbench.home' },
      source
    )
    expect(permissionService.createNavigationEntry).toHaveBeenCalledWith(
      {
        entryKey: 'workbench.home',
        name: 'Workbench',
        supportedTerminals: ['WEB'],
        registryPriority: 100,
        enabled: true,
        entryType: 'page'
      },
      source
    )
    expect(permissionService.updateNavigationEntry).toHaveBeenCalledWith(
      {
        entryKey: 'workbench.home',
        name: 'Workbench Updated',
        description: undefined,
        featureKey: undefined,
        supportedTerminals: undefined,
        registryPriority: undefined,
        enabled: false,
        entryType: undefined
      },
      source
    )
  })

  it('forwards role navigation config and preview requests to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    permissionService.getRoleNavigation.mockResolvedValue({ roleId: 'role-1' })
    permissionService.setRoleNavigationVisibility.mockResolvedValue({ roleId: 'role-1' })
    permissionService.setRoleLandingPolicies.mockResolvedValue({ roleId: 'role-1' })
    permissionService.syncRoleNavigationFromTemplate.mockResolvedValue({ roleId: 'role-1' })
    permissionService.resolveNavigationPreview.mockResolvedValue({ defaultEntry: 'workbench.home' })

    await controller.getRoleNavigation('role-1', source as any)
    await controller.setRoleNavigationVisibility(
      'role-1',
      {
        visibility: [
          {
            entryKey: 'workbench.home',
            terminal: 'WEB',
            enabled: true
          }
        ]
      },
      source as any
    )
    await controller.setRoleLandingPolicies(
      'role-1',
      {
        landingPolicies: [
          {
            terminal: 'WEB',
            defaultEntryKey: 'workbench.home',
            priority: 100,
            enabled: true
          }
        ]
      },
      source as any
    )
    await controller.syncRoleNavigationFromTemplate('role-1', source as any)
    await controller.resolveNavigationPreview(
      { roleIds: ['role-1'], scopeLevel: 'TENANT', terminal: 'WEB' },
      source as any
    )

    expect(permissionService.getRoleNavigation).toHaveBeenCalledWith({ roleId: 'role-1' }, source)
    expect(permissionService.setRoleNavigationVisibility).toHaveBeenCalledWith(
      {
        roleId: 'role-1',
        visibility: [
          {
            entryKey: 'workbench.home',
            terminal: 'WEB',
            enabled: true
          }
        ]
      },
      source
    )
    expect(permissionService.setRoleLandingPolicies).toHaveBeenCalledWith(
      {
        roleId: 'role-1',
        landingPolicies: [
          {
            terminal: 'WEB',
            defaultEntryKey: 'workbench.home',
            priority: 100,
            enabled: true
          }
        ]
      },
      source
    )
    expect(permissionService.syncRoleNavigationFromTemplate).toHaveBeenCalledWith(
      { roleId: 'role-1' },
      source
    )
    expect(permissionService.resolveNavigationPreview).toHaveBeenCalledWith(
      { roleIds: ['role-1'], scopeLevel: 'TENANT', terminal: 'WEB' },
      source
    )
  })
})
