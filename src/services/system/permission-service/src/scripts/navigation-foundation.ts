import { RoleKind } from '../../prisma/generated/prisma'
import { DEFAULT_NAVIGATION_TERMINAL } from '../domain/constants/navigation-terminal'

type NavigationEntrySeed = {
  description?: string
  enabled: boolean
  entryKey: string
  entryType: string
  featureKey?: string
  name: string
  registryPriority: number
  supportedTerminals: string[]
}

type NavigationRoleSeed = {
  code: string
  id: string
  kind: RoleKind
}

type NavigationVisibilitySeed = {
  enabled: boolean
  entryKey: string
  roleId: string
  terminal: string
}

type NavigationLandingSeed = {
  defaultEntryKey: string
  enabled: boolean
  priority: number
  roleId: string
  terminal: string
}

const NAVIGATION_VISIBILITY_ENTRY_KEYS_BY_ROLE_CODE: Record<string, string[]> = {
  'system.admin': [
    'platform.home',
    'admin.auth-session-management',
    'admin.tenant-management',
    'admin.org-management',
    'admin.role-management',
    'admin.account-management',
    'admin.platform-mfa',
    'admin.platform-terminal-security',
    'admin.permission-management',
    'admin.policy-governance',
    'admin.terminal-device-management',
    'admin.navigation-management'
  ],
  'tenant.admin': [
    'workbench.home',
    'admin.auth-session-management',
    'admin.role-management',
    'admin.account-management',
    'admin.terminal-device-management',
    'tenant-settings.org-structure',
    'tenant-settings.employee-employment',
    'tenant-settings.login-mfa'
  ],
  'hr.admin': [
    'workbench.home',
    'tenant-settings.employee-employment'
  ],
  'account.basic': ['workbench.home'],
  'item_master.product_data_manager': [
    'workbench.home',
    'master-data.item-management',
    'master-data.item-category-management',
    'master-data.item-attribute-management',
    'master-data.item-packaging-management',
    'master-data.item-bom-management'
  ],
  'mes.forming_workshop.supervisor': ['workbench.home', 'mes.mold-management'],
  'extension.designer': ['workbench.home']
}

/** DEPRECATED_NAVIGATION_ENTRY_KEYS disables removed built-in entries during seed sync. */
export const DEPRECATED_NAVIGATION_ENTRY_KEYS = ['tenant-settings.organization-people'] as const

/** DEFAULT_NAVIGATION_ENTRIES defines the built-in first-stage navigation registry rows. */
export const DEFAULT_NAVIGATION_ENTRIES: NavigationEntrySeed[] = [
  {
    entryKey: 'workbench.home',
    name: '工作台首页',
    description: '租户工作台默认首页入口。',
    featureKey: 'workbench',
    supportedTerminals: ['WEB'],
    registryPriority: 0,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'platform.home',
    name: '平台首页',
    description: '系统平台默认首页入口。',
    featureKey: 'platform',
    supportedTerminals: ['WEB'],
    registryPriority: 1,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.auth-session-management',
    name: '认证与会话管理',
    description: '管理员认证与会话管理入口。',
    featureKey: 'auth',
    supportedTerminals: ['WEB'],
    registryPriority: 2,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.tenant-management',
    name: '租户管理',
    description: '系统管理员租户创建与基础管理入口。',
    featureKey: 'tenant-org',
    supportedTerminals: ['WEB'],
    registryPriority: 3,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.org-management',
    name: '组织架构管理',
    description: '系统管理员进入指定 tenant 的组织架构管理入口。',
    featureKey: 'tenant-org',
    supportedTerminals: ['WEB'],
    registryPriority: 4,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.role-management',
    name: '角色管理',
    description: '管理员角色管理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 5,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.account-management',
    name: '账号管理',
    description: '管理员账号管理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 6,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'tenant-settings.org-structure',
    name: '组织架构',
    description: '租户管理员日常组织树与组织节点管理入口。',
    featureKey: 'tenant-org',
    supportedTerminals: ['WEB'],
    registryPriority: 7,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'tenant-settings.employee-employment',
    name: '员工管理',
    description: '租户管理员与 HR 管理员的员工与任职管理入口。',
    featureKey: 'hr',
    supportedTerminals: ['WEB'],
    registryPriority: 8,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'tenant-settings.login-mfa',
    name: '租户 MFA 配置',
    description: '租户 MFA 场景、因子优先级与新设备登录保护配置入口。',
    featureKey: 'auth',
    supportedTerminals: ['WEB'],
    registryPriority: 9,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'master-data.item-management',
    name: 'Item 管理',
    description: '租户侧 Item 主数据 phase 1 管理入口。',
    featureKey: 'item-master',
    supportedTerminals: ['WEB'],
    registryPriority: 10,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'master-data.item-category-management',
    name: '产品分类管理',
    description: '租户侧产品分类层级维护入口。',
    featureKey: 'item-master',
    supportedTerminals: ['WEB'],
    registryPriority: 11,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'master-data.item-attribute-management',
    name: 'Item 属性管理',
    description: '租户侧 Item 属性定义与选项维护入口。',
    featureKey: 'item-master',
    supportedTerminals: ['WEB'],
    registryPriority: 12,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'master-data.item-packaging-management',
    name: 'Item 包装管理',
    description: '租户侧 PackagingMethod 与 PackagingSpec 维护入口。',
    featureKey: 'item-master',
    supportedTerminals: ['WEB'],
    registryPriority: 13,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'master-data.item-bom-management',
    name: 'Item BOM 管理',
    description: '租户侧 COMPOSITION、TRANSFORMATION 与 PACKAGING BOM 维护入口。',
    featureKey: 'item-master',
    supportedTerminals: ['WEB'],
    registryPriority: 14,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'master-data.supplier-management',
    name: '供应商管理',
    description: '租户侧 SRM supplier master phase 1 管理入口。',
    featureKey: 'srm',
    supportedTerminals: ['WEB'],
    registryPriority: 15,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'master-data.customer-management',
    name: '客户管理',
    description: '租户侧 CRM customer master phase 1 管理入口。',
    featureKey: 'crm',
    supportedTerminals: ['WEB'],
    registryPriority: 16,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'sales.quote-orders',
    name: '报价与订单',
    description: '租户侧 sales quote-order phase 1 最小闭环入口。',
    featureKey: 'sales',
    supportedTerminals: ['WEB'],
    registryPriority: 17,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'procurement.management',
    name: '采购管理',
    description: '租户侧 procurement phase 1 PR / PO / receiving 最小闭环入口。',
    featureKey: 'procurement',
    supportedTerminals: ['WEB'],
    registryPriority: 18,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'finance.dashboard',
    name: '财务管理',
    description: '租户侧 finance phase 1A 资金账户、应收、汇率与收款核销最小入口。',
    featureKey: 'finance',
    supportedTerminals: ['WEB'],
    registryPriority: 19,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'wms.management',
    name: 'WMS 管理',
    description: '租户侧 WMS phase 1 仓库、库位、收货与库存查询最小入口。',
    featureKey: 'wms',
    supportedTerminals: ['WEB'],
    registryPriority: 20,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'mes.mold-management',
    name: '模具管理',
    description: '租户侧 MES 模具管理、产线模具现况与注浆记录最小闭环入口。',
    featureKey: 'mes',
    supportedTerminals: ['WEB'],
    registryPriority: 21,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.platform-mfa',
    name: 'MFA 因子配置',
    description: '系统账号 MFA 场景、因子启用状态与展示优先级配置入口。',
    featureKey: 'auth',
    supportedTerminals: ['WEB'],
    registryPriority: 22,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.platform-terminal-security',
    name: 'Terminal 登录策略',
    description: '系统管理员维护平台级 terminal 登录流与各 terminal MFA 默认开关的账号安全入口。',
    featureKey: 'auth',
    supportedTerminals: ['WEB'],
    registryPriority: 23,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.permission-management',
    name: '权限管理',
    description: '管理员权限管理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 24,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.policy-governance',
    name: '策略治理',
    description: '管理员策略治理只读入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 25,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.terminal-device-management',
    name: '终端设备管理',
    description: '管理员受管终端设备 enrollment、状态、版本策略与审计入口。',
    featureKey: 'terminal-device',
    supportedTerminals: ['WEB'],
    registryPriority: 26,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.navigation-management',
    name: '导航管理',
    description: '管理员导航治理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 27,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'pda.home',
    name: 'PDA 首页',
    description: '现场 PDA 端默认系统入口。',
    featureKey: 'pda',
    supportedTerminals: ['PDA'],
    registryPriority: 28,
    enabled: true,
    entryType: 'workspace'
  },
  {
    entryKey: 'kiosk.home',
    name: '触摸屏首页',
    description: '固定工位触摸屏默认系统入口。',
    featureKey: 'kiosk',
    supportedTerminals: ['KIOSK'],
    registryPriority: 29,
    enabled: true,
    entryType: 'workspace'
  },
  {
    entryKey: 'extension.designer.workspace',
    name: 'Designer Workspace',
    description: '浏览器插件设计师选品、加入项目并提交到 OES 的 demo workspace。',
    featureKey: 'browser-extension',
    supportedTerminals: ['BROWSER_EXTENSION'],
    registryPriority: 30,
    enabled: true,
    entryType: 'workspace'
  }
]

/** buildNavigationFoundationVisibilitySeeds converts built-in role rules into seed visibility rows. */
export function buildNavigationFoundationVisibilitySeeds(
  roles: NavigationRoleSeed[]
): NavigationVisibilitySeed[] {
  const rows: NavigationVisibilitySeed[] = []

  for (const role of roles) {
    for (const entryKey of NAVIGATION_VISIBILITY_ENTRY_KEYS_BY_ROLE_CODE[role.code] ?? []) {
      rows.push({
        roleId: role.id,
        entryKey,
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
    }
  }

  return rows
}

/** buildNavigationFoundationLandingSeeds defines the built-in default landing rows for existing roles. */
export function buildNavigationFoundationLandingSeeds(
  roles: NavigationRoleSeed[]
): NavigationLandingSeed[] {
  return roles.map((role) => ({
    roleId: role.id,
    terminal: DEFAULT_NAVIGATION_TERMINAL,
    defaultEntryKey:
      role.kind === RoleKind.SYSTEM_INSTANCE ? 'platform.home' : 'workbench.home',
    priority: 0,
    enabled: true
  }))
}
