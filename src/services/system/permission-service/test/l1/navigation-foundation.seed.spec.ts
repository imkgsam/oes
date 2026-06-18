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
      'tenant-settings.org-structure',
      'tenant-settings.employee-employment',
      'tenant-settings.login-mfa',
      'master-data.item-management',
      'master-data.item-category-management',
      'master-data.item-attribute-management',
      'master-data.item-packaging-management',
      'master-data.item-bom-management',
      'master-data.supplier-management',
      'master-data.customer-management',
      'sales.quote-orders',
      'procurement.management',
      'finance.dashboard',
      'wms.management',
      'mes.mold-management',
      'admin.platform-mfa',
      'admin.platform-terminal-security',
      'admin.permission-management',
      'admin.policy-governance',
      'admin.terminal-device-management',
      'admin.navigation-management',
      'collaboration.tasks',
      'pda.home',
      'kiosk.home',
      'extension.designer.workspace'
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
      '组织架构',
      '员工管理',
      '租户 MFA 配置',
      'Item 管理',
      '产品分类管理',
      'Item 属性管理',
      'Item 包装管理',
      'Item BOM 管理',
      '供应商管理',
      '客户管理',
      '报价与订单',
      '采购管理',
      '财务管理',
      'WMS 管理',
      '模具管理',
      'MFA 因子配置',
      'Terminal 登录策略',
      '权限管理',
      '策略治理',
      '终端设备管理',
      '导航管理',
      '任务工作台',
      'PDA 首页',
      '触摸屏首页',
      'Designer Workspace'
    ])
  })

  it('marks the removed organization-people entry for navigation cleanup', () => {
    expect(DEPRECATED_NAVIGATION_ENTRY_KEYS).toEqual(['tenant-settings.organization-people'])
  })

  it('publishes terminal device management for built-in administrator navigation', () => {
    expect(DEFAULT_NAVIGATION_ENTRIES.map((item) => item.entryKey)).toContain(
      'admin.terminal-device-management'
    )

    const visibility = buildNavigationFoundationVisibilitySeeds([
      {
        id: 'role-system-admin',
        code: 'system.admin',
        kind: RoleKind.SYSTEM_INSTANCE
      },
      {
        id: 'role-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.TENANT_INSTANCE
      }
    ])

    expect(visibility).toEqual(
      expect.arrayContaining([
        {
          roleId: 'role-system-admin',
          entryKey: 'admin.terminal-device-management',
          terminal: 'DEFAULT',
          enabled: true
        },
        {
          roleId: 'role-tenant-admin',
          entryKey: 'admin.terminal-device-management',
          terminal: 'DEFAULT',
          enabled: true
        }
      ])
    )
  })

  it('publishes unique registry priorities for deterministic ordering', () => {
    const priorities = DEFAULT_NAVIGATION_ENTRIES.map((item) => item.registryPriority)

    expect(priorities).toEqual([...DEFAULT_NAVIGATION_ENTRIES.keys()])
    expect(new Set(priorities).size).toBe(DEFAULT_NAVIGATION_ENTRIES.length)
  })

  it('maps built-in role visibility to the confirmed navigation entries', () => {
    const visibility = buildNavigationFoundationVisibilitySeeds([
      {
        id: 'role-system-admin',
        code: 'system.admin',
        kind: RoleKind.SYSTEM_INSTANCE
      },
      {
        id: 'template-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'role-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.TENANT_INSTANCE
      },
      {
        id: 'template-hr-admin',
        code: 'hr.admin',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-account-basic',
        code: 'account.basic',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-item-product-data-manager',
        code: 'item_master.product_data_manager',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-mes-supervisor',
        code: 'mes.forming_workshop.supervisor',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-extension-designer',
        code: 'extension.designer',
        kind: RoleKind.SYSTEM_TEMPLATE
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
        entryKey: 'admin.tenant-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.org-management',
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
        entryKey: 'admin.platform-mfa',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.platform-terminal-security',
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
        entryKey: 'admin.terminal-device-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'admin.navigation-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'collaboration.tasks',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'collaboration.tasks',
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
        entryKey: 'admin.terminal-device-management',
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
        roleId: 'role-tenant-admin',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'collaboration.tasks',
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
        entryKey: 'admin.terminal-device-management',
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
        roleId: 'template-hr-admin',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-hr-admin',
        entryKey: 'tenant-settings.employee-employment',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-account-basic',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-account-basic',
        entryKey: 'collaboration.tasks',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-item-product-data-manager',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-item-product-data-manager',
        entryKey: 'master-data.item-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-item-product-data-manager',
        entryKey: 'master-data.item-category-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-item-product-data-manager',
        entryKey: 'master-data.item-attribute-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-item-product-data-manager',
        entryKey: 'master-data.item-packaging-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-item-product-data-manager',
        entryKey: 'master-data.item-bom-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-mes-supervisor',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-mes-supervisor',
        entryKey: 'mes.mold-management',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-extension-designer',
        entryKey: 'workbench.home',
        terminal: 'DEFAULT',
        enabled: true
      }
    ])
  })

  it('maps built-in role landing policies to the current placeholder homes', () => {
    const landing = buildNavigationFoundationLandingSeeds([
      {
        id: 'role-system-admin',
        code: 'system.admin',
        kind: RoleKind.SYSTEM_INSTANCE
      },
      {
        id: 'template-tenant-admin',
        code: 'tenant.admin',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-hr-admin',
        code: 'hr.admin',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-account-basic',
        code: 'account.basic',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-item-product-data-manager',
        code: 'item_master.product_data_manager',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-mes-supervisor',
        code: 'mes.forming_workshop.supervisor',
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      {
        id: 'template-extension-designer',
        code: 'extension.designer',
        kind: RoleKind.SYSTEM_TEMPLATE
      }
    ])

    expect(landing).toEqual([
      {
        roleId: 'role-system-admin',
        terminal: 'DEFAULT',
        defaultEntryKey: 'platform.home',
        priority: 0,
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 0,
        enabled: true
      },
      {
        roleId: 'template-hr-admin',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 0,
        enabled: true
      },
      {
        roleId: 'template-account-basic',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 0,
        enabled: true
      },
      {
        roleId: 'template-item-product-data-manager',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 0,
        enabled: true
      },
      {
        roleId: 'template-mes-supervisor',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 0,
        enabled: true
      },
      {
        roleId: 'template-extension-designer',
        terminal: 'DEFAULT',
        defaultEntryKey: 'workbench.home',
        priority: 0,
        enabled: true
      }
    ])
  })
})
