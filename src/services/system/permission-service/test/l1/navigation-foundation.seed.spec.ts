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
      'admin.tenant-management',
      'admin.org-management',
      'admin.role-management',
      'admin.account-management',
      'tenant-settings.organization-people',
      'tenant-settings.org-structure',
      'tenant-settings.employee-employment',
      'tenant-settings.login-mfa',
      'master-data.item-management',
      'master-data.supplier-management',
      'master-data.customer-management',
      'sales.quote-orders',
      'procurement.management',
      'finance.dashboard',
      'admin.platform-mfa',
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
      '租户管理',
      '组织架构管理',
      '角色管理',
      '账号管理',
      '组织与人员',
      '本租户组织架构',
      '员工与任职管理',
      '租户 MFA 配置',
      'Item 管理',
      '供应商管理',
      '客户管理',
      '报价与订单',
      '采购管理',
      '财务管理',
      '平台 MFA 配置',
      '权限管理',
      '策略治理',
      '导航管理'
    ])
  })

  it('declares renamed navigation entries that must be disabled during seed sync', () => {
    expect(DEPRECATED_NAVIGATION_ENTRY_KEYS).toContain('admin.account-role-management')
  })

  it('maps tenant admin roles to tenant workbench, auth-session, and business workspace entries', () => {
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
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'tenant-settings.organization-people',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'tenant-settings.org-structure',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'tenant-settings.employee-employment',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'tenant-settings.login-mfa',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'master-data.item-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'master-data.supplier-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'master-data.customer-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'sales.quote-orders',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'procurement.management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'finance.dashboard',
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
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'tenant-settings.organization-people',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'tenant-settings.org-structure',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'tenant-settings.employee-employment',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'tenant-settings.login-mfa',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'master-data.item-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'master-data.supplier-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'master-data.customer-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'sales.quote-orders',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'procurement.management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'finance.dashboard',
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
})
