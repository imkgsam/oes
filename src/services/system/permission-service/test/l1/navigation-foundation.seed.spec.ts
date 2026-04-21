import { RoleKind } from '../../prisma/generated/prisma'
import {
  DEFAULT_NAVIGATION_ENTRIES,
  DEPRECATED_NAVIGATION_ENTRY_KEYS,
  buildNavigationFoundationLandingSeeds,
  buildNavigationFoundationVisibilitySeeds
} from '../../src/scripts/navigation-foundation'

describe('navigation foundation seed', () => {
  it('publishes the current built-in navigation entry registry', () => {
    expect(DEFAULT_NAVIGATION_ENTRIES.map((item) => item.entryKey)).toEqual([
      'workbench.home',
      'platform.home',
      'admin.auth-session-management',
      'admin.role-management',
      'admin.account-management',
      'admin.permission-management',
      'admin.policy-governance',
      'admin.navigation-management'
    ])
  })

  it('publishes the current built-in navigation entry names in Chinese', () => {
    expect(DEFAULT_NAVIGATION_ENTRIES.map((item) => item.name)).toEqual([
      '工作台首页',
      '平台首页',
      '认证与会话管理',
      '角色管理',
      '账号管理',
      '权限管理',
      '策略治理',
      '导航管理'
    ])
  })

  it('declares renamed navigation entries that must be disabled during seed sync', () => {
    expect(DEPRECATED_NAVIGATION_ENTRY_KEYS).toContain('admin.account-role-management')
  })

  it('maps tenant admin roles to tenant workbench, auth-session, and role-management entries', () => {
    const visibility = buildNavigationFoundationVisibilitySeeds([
      {
        id: 'role-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.TENANT_INSTANCE
      }
    ])
    const landing = buildNavigationFoundationLandingSeeds([
      {
        id: 'role-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.TENANT_INSTANCE
      }
    ])

    expect(visibility).toEqual([
      {
        roleId: 'role-tenant-admin',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'admin.auth-session-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'admin.role-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'admin.account-management',
        terminal: 'DEFAULT',
        enabled: true
      }
    ])
    expect(landing).toEqual([
      {
        roleId: 'role-tenant-admin',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 100,
        enabled: true
      }
    ])
  })

  it('maps tenant role templates to tenant default navigation so instances can inherit it', () => {
    const visibility = buildNavigationFoundationVisibilitySeeds([
      {
        id: 'template-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.SYSTEM_TEMPLATE
      }
    ])
    const landing = buildNavigationFoundationLandingSeeds([
      {
        id: 'template-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.SYSTEM_TEMPLATE
      }
    ])

    expect(visibility).toEqual([
      {
        roleId: 'template-tenant-admin',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'admin.auth-session-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'admin.role-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'admin.account-management',
        terminal: 'DEFAULT',
        enabled: true
      }
    ])
    expect(landing).toEqual([
      {
        roleId: 'template-tenant-admin',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 100,
        enabled: true
      }
    ])
  })

  it('maps system admin roles to platform and privileged admin entries', () => {
    const visibility = buildNavigationFoundationVisibilitySeeds([
      {
        id: 'role-system-admin',
        code: 'system.admin',
        kind: RoleKind.SYSTEM_INSTANCE
      }
    ])
    const landing = buildNavigationFoundationLandingSeeds([
      {
        id: 'role-system-admin',
        code: 'system.admin',
        kind: RoleKind.SYSTEM_INSTANCE
      }
    ])

    expect(visibility).toEqual([
      {
        roleId: 'role-system-admin',
        entryKey: 'platform.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.auth-session-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.role-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.account-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.permission-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.policy-governance',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.navigation-management',
        terminal: 'DEFAULT',
        enabled: true
      }
    ])
    expect(landing).toEqual([
      {
        roleId: 'role-system-admin',
        terminal: 'DEFAULT',
        defaultEntryKey: 'platform.home',
        priority: 100,
        enabled: true
      }
    ])
  })
})
