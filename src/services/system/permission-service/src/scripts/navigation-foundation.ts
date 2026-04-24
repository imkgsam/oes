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

const ADMIN_ROLE_CODES = new Set(['sys_admin', 'system.admin', 'tenant.admin'])
const SYSTEM_ADMIN_ROLE_CODES = new Set(['sys_admin', 'system.admin'])

/** DEPRECATED_NAVIGATION_ENTRY_KEYS disables renamed built-in entries during seed sync. */
export const DEPRECATED_NAVIGATION_ENTRY_KEYS = ['admin.account-role-management'] as const

/** DEFAULT_NAVIGATION_ENTRIES defines the built-in first-stage navigation registry rows. */
export const DEFAULT_NAVIGATION_ENTRIES: NavigationEntrySeed[] = [
  {
    entryKey: 'workbench.home',
    name: '工作台首页',
    description: '租户工作台默认首页入口。',
    featureKey: 'workbench',
    supportedTerminals: ['WEB'],
    registryPriority: 100,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'platform.home',
    name: '平台首页',
    description: '系统平台默认首页入口。',
    featureKey: 'platform',
    supportedTerminals: ['WEB'],
    registryPriority: 100,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.auth-session-management',
    name: '认证与会话管理',
    description: '管理员认证与会话管理入口。',
    featureKey: 'auth',
    supportedTerminals: ['WEB'],
    registryPriority: 80,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.tenant-management',
    name: '租户管理',
    description: '系统管理员租户创建与基础管理入口。',
    featureKey: 'tenant-org',
    supportedTerminals: ['WEB'],
    registryPriority: 79,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.org-management',
    name: '组织架构管理',
    description: '系统管理员进入指定 tenant 的组织架构管理入口。',
    featureKey: 'tenant-org',
    supportedTerminals: ['WEB'],
    registryPriority: 78,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.role-management',
    name: '角色管理',
    description: '管理员角色管理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 65,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.account-management',
    name: '账号管理',
    description: '管理员账号管理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 64,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'tenant-settings.organization-people',
    name: '组织与人员',
    description: '租户侧组织与人员统一入口，统一承接成员与部门工作台。',
    featureKey: 'tenant-admin',
    supportedTerminals: ['WEB'],
    registryPriority: 59,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'tenant-settings.org-structure',
    name: '本租户组织架构',
    description: '租户管理员日常组织树与组织节点管理入口。',
    featureKey: 'tenant-org',
    supportedTerminals: ['WEB'],
    registryPriority: 58,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'tenant-settings.employee-employment',
    name: '员工与任职管理',
    description: '租户管理员与 HR 管理员的员工与任职管理入口。',
    featureKey: 'hr',
    supportedTerminals: ['WEB'],
    registryPriority: 57,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'tenant-settings.login-mfa',
    name: '租户 MFA 配置',
    description: '租户 MFA 场景、因子优先级与新设备登录保护配置入口。',
    featureKey: 'auth',
    supportedTerminals: ['WEB'],
    registryPriority: 56,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.platform-mfa',
    name: '平台 MFA 配置',
    description: '系统账号 MFA 场景、因子优先级与新设备登录保护配置入口。',
    featureKey: 'auth',
    supportedTerminals: ['WEB'],
    registryPriority: 59,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.permission-management',
    name: '权限管理',
    description: '管理员权限管理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 70,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.policy-governance',
    name: '策略治理',
    description: '管理员策略治理只读入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 62,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'admin.navigation-management',
    name: '导航管理',
    description: '管理员导航治理入口。',
    featureKey: 'permission',
    supportedTerminals: ['WEB'],
    registryPriority: 60,
    enabled: true,
    entryType: 'page'
  }
]

/** buildNavigationFoundationVisibilitySeeds converts built-in role rules into seed visibility rows. */
export function buildNavigationFoundationVisibilitySeeds(
  roles: NavigationRoleSeed[]
): NavigationVisibilitySeed[] {
  const rows: NavigationVisibilitySeed[] = []

  for (const role of roles) {
    const scopeLevel = role.kind === RoleKind.SYSTEM_INSTANCE ? 'SYSTEM' : 'TENANT'
    const homeEntry = scopeLevel === 'SYSTEM' ? 'platform.home' : 'workbench.home'

    rows.push({
      roleId: role.id,
      entryKey: homeEntry,
      terminal: DEFAULT_NAVIGATION_TERMINAL,
      enabled: true
    })

    if (ADMIN_ROLE_CODES.has(role.code)) {
      rows.push({
        roleId: role.id,
        entryKey: 'admin.auth-session-management',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      if (scopeLevel === 'TENANT') {
        rows.push({
          roleId: role.id,
          entryKey: 'admin.role-management',
          terminal: DEFAULT_NAVIGATION_TERMINAL,
          enabled: true
        })
        rows.push({
          roleId: role.id,
          entryKey: 'admin.account-management',
          terminal: DEFAULT_NAVIGATION_TERMINAL,
          enabled: true
        })
        rows.push({
          roleId: role.id,
          entryKey: 'tenant-settings.organization-people',
          terminal: DEFAULT_NAVIGATION_TERMINAL,
          enabled: true
        })
        rows.push({
          roleId: role.id,
          entryKey: 'tenant-settings.org-structure',
          terminal: DEFAULT_NAVIGATION_TERMINAL,
          enabled: true
        })
        rows.push({
          roleId: role.id,
          entryKey: 'tenant-settings.employee-employment',
          terminal: DEFAULT_NAVIGATION_TERMINAL,
          enabled: true
        })
        rows.push({
          roleId: role.id,
          entryKey: 'tenant-settings.login-mfa',
          terminal: DEFAULT_NAVIGATION_TERMINAL,
          enabled: true
        })
      }
    }

    if (scopeLevel === 'SYSTEM' && SYSTEM_ADMIN_ROLE_CODES.has(role.code)) {
      rows.push({
        roleId: role.id,
        entryKey: 'admin.tenant-management',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      rows.push({
        roleId: role.id,
        entryKey: 'admin.org-management',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      rows.push({
        roleId: role.id,
        entryKey: 'admin.role-management',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      rows.push({
        roleId: role.id,
        entryKey: 'admin.account-management',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      rows.push({
        roleId: role.id,
        entryKey: 'admin.platform-mfa',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      rows.push({
        roleId: role.id,
        entryKey: 'admin.permission-management',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      rows.push({
        roleId: role.id,
        entryKey: 'admin.policy-governance',
        terminal: DEFAULT_NAVIGATION_TERMINAL,
        enabled: true
      })
      rows.push({
        roleId: role.id,
        entryKey: 'admin.navigation-management',
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
    priority: 100,
    enabled: true
  }))
}
