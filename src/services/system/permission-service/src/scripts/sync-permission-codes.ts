import {
  AccountType,
  Modules,
  PrismaClient,
  RoleKind,
  ScopeLevel
} from '../../prisma/generated/prisma'
import {
  AUTH_MANAGEMENT_PERMISSION_CODES,
  AUTH_SESSION_PERMISSION_CODES,
  HR_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES,
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  TENANT_ORG_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import {
  buildNavigationFoundationLandingSeeds,
  buildNavigationFoundationVisibilitySeeds,
  DEFAULT_NAVIGATION_ENTRIES,
  DEPRECATED_NAVIGATION_ENTRY_KEYS
} from './navigation-foundation'
import { BUILT_IN_ROLE_TEMPLATES } from './role-foundation'
import { syncBuiltInRoleInstanceBaselines } from './role-instance-foundation'

type PermissionSeedItem = {
  code: string
  module: Modules
  description?: string
}

const PERMISSION_DESCRIPTION_BY_CODE: Readonly<Record<string, string>> = {
  'permission.create': '创建权限定义',
  'permission.update': '更新权限元数据或维护角色权限关系',
  'permission.delete': '删除权限定义',
  'permission.list': '查看权限列表',
  'permission.get_by_id': '查看权限详情',
  'permission.get_by_code': '按权限码查看权限详情',
  'permission.audit.list': '查看权限审计事件',
  'permission.navigation.entry.list': '查看导航项列表',
  'permission.navigation.entry.get_by_key': '查看导航项详情',
  'permission.navigation.entry.create': '创建导航项',
  'permission.navigation.entry.update': '更新导航项',
  'permission.navigation.resolve_preview': '预览导航解析结果',
  'permission.role.create': '创建角色',
  'permission.role.update': '更新角色或维护角色权限关系',
  'permission.role.delete_by_id': '删除角色',
  'permission.role.list': '查看角色列表',
  'permission.role.get_by_id': '查看角色详情',
  'permission.account.assign_roles': '为账号分配或调整角色',
  'permission.account.get_roles': '查看账号角色',
  'permission.policy.create': '创建权限策略',
  'permission.policy.update': '更新权限策略',
  'permission.policy.delete': '删除权限策略',
  'permission.policy.list': '查看权限策略列表',
  'identity.account.list': '查看账号列表',
  'identity.account.create': '创建账号',
  'identity.account.update_status': '更新账号启停状态',
  'identity.account.profile.update': '更新账号档案信息',
  'identity.account.delete': '删除账号',
  'identity.contact.work_email.assign': '分配工作邮箱',
  'identity.contact.work_email.revoke': '回收工作邮箱',
  'identity.contact.work_email.set_primary': '设置主工作邮箱',
  'identity.contact.work_email.set_status': '更新工作邮箱状态',
  'identity.contact.work_phone.assign': '分配工作手机号',
  'identity.contact.work_phone.revoke': '回收工作手机号',
  'identity.contact.work_phone.set_primary': '设置主工作手机号',
  'identity.contact.work_phone.set_status': '更新工作手机号状态',
  'tenant_org.tenant.list': '查看租户列表',
  'tenant_org.tenant.get_by_id': '查看租户详情',
  'tenant_org.tenant.create': '创建租户',
  'tenant_org.tenant.update_profile': '更新租户基础信息',
  'tenant_org.tenant.update_status': '更新租户状态',
  'tenant_org.org_unit.list_tree': '查看组织树',
  'tenant_org.org_unit.get_by_id': '查看组织节点详情',
  'tenant_org.org_unit.create': '创建组织节点',
  'tenant_org.org_unit.update': '更新组织节点',
  'tenant_org.org_unit.archive': '归档组织节点',
  'hr.employee.list': '查看员工列表',
  'hr.employee.get_by_id': '查看员工详情',
  'hr.employee.create': '创建员工主档',
  'hr.employment.create': '创建员工任职',
  'hr.employment.end': '结束员工任职',
  'hr.employment.change_primary': '调岗并切换主任职',
  'auth.audit.list': '查看认证审计事件',
  'auth.account_credentials.bootstrap': '初始化账号登录凭据',
  'auth.account_login_methods.manage': '管理账号登录方式',
  'auth.mfa_policy.manage': '管理租户 MFA 策略',
  'auth.platform_mfa_policy.manage': '管理平台 MFA 策略',
  'auth.session.admin.view': '查看用户会话',
  'auth.session.admin.revoke': '撤销用户会话'
} as const

const SYSTEM_ADMIN_ROLE = {
  id: '37e76049-6d90-456c-8ded-2cc42c60f001',
  code: 'system.admin',
  name: 'System Administrator',
  scopeKey: '__SYSTEM__'
} as const

// Extracts string values from permission-code constant records.
function valuesOf(record: Record<string, string>): string[] {
  return Object.values(record)
}

// Resolves the authoritative human-readable description for one permission seed code.
function getPermissionDescription(code: string): string | undefined {
  return PERMISSION_DESCRIPTION_BY_CODE[code]
}

// Builds the authoritative permission seed set from shared permission-code constants.
export function buildPermissionSeedItems(): PermissionSeedItem[] {
  const items: PermissionSeedItem[] = [
    ...valuesOf(PERMISSION_MANAGEMENT_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.PERMISSION_SERVICE,
      description: getPermissionDescription(code)
    })),
    ...valuesOf(IDENTITY_ACCOUNT_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.IDENTITY_SERVICE,
      description: getPermissionDescription(code)
    })),
    ...valuesOf(TENANT_ORG_MANAGEMENT_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.IDENTITY_SERVICE,
      description: getPermissionDescription(code)
    })),
    ...valuesOf(HR_MANAGEMENT_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.IDENTITY_SERVICE,
      description: getPermissionDescription(code)
    })),
    ...valuesOf(AUTH_MANAGEMENT_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.AUTH_SERVICE,
      description: getPermissionDescription(code)
    })),
    ...valuesOf(AUTH_SESSION_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.AUTH_SERVICE,
      description: getPermissionDescription(code)
    }))
  ]

  const unique = new Map<string, PermissionSeedItem>()
  for (const item of items) {
    unique.set(item.code, item)
  }

  return Array.from(unique.values())
}

// Parses optional system admin account ids from environment variables used by local and deployment seeds.
function readSystemAdminAccountIds(): string[] {
  const raw =
    process.env.OES_SYSTEM_ADMIN_ACCOUNT_IDS ??
    process.env.SYSTEM_ADMIN_ACCOUNT_IDS ??
    process.env.OES_SYSTEM_ADMIN_ACCOUNT_ID ??
    process.env.SYSTEM_ADMIN_ACCOUNT_ID ??
    ''

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

// Upserts the system administrator role and synchronizes it with all current permission codes.
async function syncSystemAdminRole(
  prisma: PrismaClient,
  permissionIds: string[]
): Promise<{ roleId: string; permissionCount: number }> {
  const role = await prisma.role.upsert({
    where: {
      scopeKey_kind_code: {
        scopeKey: SYSTEM_ADMIN_ROLE.scopeKey,
        kind: RoleKind.SYSTEM_INSTANCE,
        code: SYSTEM_ADMIN_ROLE.code
      }
    },
    create: {
      id: SYSTEM_ADMIN_ROLE.id,
      tenantId: null,
      scopeKey: SYSTEM_ADMIN_ROLE.scopeKey,
      code: SYSTEM_ADMIN_ROLE.code,
      name: SYSTEM_ADMIN_ROLE.name,
      kind: RoleKind.SYSTEM_INSTANCE,
      templateRoleId: null,
      isEnabled: true,
      description: 'Built-in system administrator role for platform-level operators.'
    },
    update: {
      tenantId: null,
      scopeKey: SYSTEM_ADMIN_ROLE.scopeKey,
      name: SYSTEM_ADMIN_ROLE.name,
      kind: RoleKind.SYSTEM_INSTANCE,
      templateRoleId: null,
      isEnabled: true,
      description: 'Built-in system administrator role for platform-level operators.'
    }
  })

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: role.id,
      permissionId: {
        notIn: permissionIds
      }
    }
  })

  if (permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId
      })),
      skipDuplicates: true
    })
  }

  return { roleId: role.id, permissionCount: permissionIds.length }
}

// Upserts built-in system role templates and synchronizes their baseline permissions by stable permission code.
async function syncBuiltInRoleTemplates(
  prisma: PrismaClient,
  permissionIdByCode: ReadonlyMap<string, string>
): Promise<number> {
  for (const template of BUILT_IN_ROLE_TEMPLATES) {
    const role = await prisma.role.upsert({
      where: {
        scopeKey_kind_code: {
          scopeKey: '__SYSTEM_TEMPLATE__',
          kind: RoleKind.SYSTEM_TEMPLATE,
          code: template.code
        }
      },
      create: {
        id: template.id,
        tenantId: null,
        scopeKey: '__SYSTEM_TEMPLATE__',
        code: template.code,
        name: template.name,
        kind: RoleKind.SYSTEM_TEMPLATE,
        templateRoleId: null,
        isEnabled: true,
        description: template.description
      },
      update: {
        tenantId: null,
        scopeKey: '__SYSTEM_TEMPLATE__',
        name: template.name,
        kind: RoleKind.SYSTEM_TEMPLATE,
        templateRoleId: null,
        isEnabled: true,
        description: template.description
      }
    })

    const permissionIds = template.permissionCodes
      .map((code) => permissionIdByCode.get(code))
      .filter((permissionId): permissionId is string => Boolean(permissionId))

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        ...(permissionIds.length > 0 ? { permissionId: { notIn: permissionIds } } : {})
      }
    })

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId
        })),
        skipDuplicates: true
      })
    }
  }

  return BUILT_IN_ROLE_TEMPLATES.length
}

// Binds the built-in system administrator role to configured system-scope user accounts.
async function syncSystemAdminAccountBindings(
  prisma: PrismaClient,
  roleId: string,
  accountIds: string[]
): Promise<number> {
  let bindingCount = 0

  for (const accountId of accountIds) {
    await prisma.accountRole.upsert({
      where: {
        accountId_roleId: {
          accountId,
          roleId
        }
      },
      create: {
        accountType: AccountType.USER,
        accountId,
        roleId,
        tenantId: null,
        scopeLevel: ScopeLevel.SYSTEM,
        effectiveAt: null,
        expiresAt: null
      },
      update: {
        accountType: AccountType.USER,
        tenantId: null,
        scopeLevel: ScopeLevel.SYSTEM,
        effectiveAt: null,
        expiresAt: null
      }
    })
    bindingCount += 1
  }

  return bindingCount
}

// Upserts built-in navigation entries and seeds missing baseline role navigation rows.
async function syncNavigationFoundation(prisma: PrismaClient): Promise<{
  deprecatedEntryCount: number
  entryCount: number
  landingSeedCount: number
  visibilitySeedCount: number
}> {
  for (const entry of DEFAULT_NAVIGATION_ENTRIES) {
    await prisma.navigationEntry.upsert({
      where: { entryKey: entry.entryKey },
      create: {
        entryKey: entry.entryKey,
        name: entry.name,
        description: entry.description,
        featureKey: entry.featureKey,
        supportedTerminals: entry.supportedTerminals,
        registryPriority: entry.registryPriority,
        enabled: entry.enabled,
        entryType: entry.entryType
      },
      update: {
        name: entry.name,
        description: entry.description,
        featureKey: entry.featureKey,
        supportedTerminals: entry.supportedTerminals,
        registryPriority: entry.registryPriority,
        enabled: entry.enabled,
        entryType: entry.entryType
      }
    })
  }

  let deprecatedEntryCount = 0
  if (DEPRECATED_NAVIGATION_ENTRY_KEYS.length > 0) {
    const disabledEntries = await prisma.navigationEntry.updateMany({
      where: {
        enabled: true,
        entryKey: {
          in: [...DEPRECATED_NAVIGATION_ENTRY_KEYS]
        }
      },
      data: {
        enabled: false
      }
    })
    await prisma.roleNavigationVisibility.updateMany({
      where: {
        enabled: true,
        entryKey: {
          in: [...DEPRECATED_NAVIGATION_ENTRY_KEYS]
        }
      },
      data: {
        enabled: false
      }
    })
    await prisma.roleLandingPolicy.updateMany({
      where: {
        enabled: true,
        defaultEntryKey: {
          in: [...DEPRECATED_NAVIGATION_ENTRY_KEYS]
        }
      },
      data: {
        enabled: false
      }
    })
    deprecatedEntryCount = disabledEntries.count
  }

  const roles = await prisma.role.findMany({
    where: {
      kind: {
        in: [RoleKind.SYSTEM_TEMPLATE, RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE]
      }
    },
    select: {
      id: true,
      code: true,
      kind: true
    }
  })

  const visibilitySeeds = buildNavigationFoundationVisibilitySeeds(roles)
  if (visibilitySeeds.length > 0) {
    await prisma.roleNavigationVisibility.createMany({
      data: visibilitySeeds,
      skipDuplicates: true
    })
  }

  const landingSeeds = buildNavigationFoundationLandingSeeds(roles)
  const existingLandingKeys = new Set(
    (
      await prisma.roleLandingPolicy.findMany({
        where: {
          roleId: { in: landingSeeds.map((seed) => seed.roleId) }
        },
        select: {
          roleId: true,
          terminal: true
        }
      })
    ).map((item) => `${item.roleId}:${item.terminal}`)
  )
  const missingLandingSeeds = landingSeeds.filter(
    (seed) => !existingLandingKeys.has(`${seed.roleId}:${seed.terminal}`)
  )

  if (missingLandingSeeds.length > 0) {
    await prisma.roleLandingPolicy.createMany({
      data: missingLandingSeeds,
      skipDuplicates: true
    })
  }

  return {
    deprecatedEntryCount,
    entryCount: DEFAULT_NAVIGATION_ENTRIES.length,
    visibilitySeedCount: visibilitySeeds.length,
    landingSeedCount: missingLandingSeeds.length
  }
}

// Synchronizes permission rows, the built-in system admin role, and optional system admin bindings.
async function main() {
  const prisma = new PrismaClient()

  try {
    const items = buildPermissionSeedItems()

    let upserted = 0
    const permissionIdByCode = new Map<string, string>()
    const permissionIds: string[] = []
    for (const item of items) {
      const permission = await prisma.permission.upsert({
        where: { code: item.code },
        create: {
          code: item.code,
          module: item.module,
          description: item.description
        },
        update: {
          module: item.module,
          description: item.description
        }
      })
      permissionIds.push(permission.id)
      permissionIdByCode.set(permission.code, permission.id)
      upserted += 1
    }

    const systemAdminRole = await syncSystemAdminRole(prisma, permissionIds)
    const builtInRoleTemplateCount = await syncBuiltInRoleTemplates(prisma, permissionIdByCode)
    const builtInRoleInstancePermissionBackfillCount =
      await syncBuiltInRoleInstanceBaselines(prisma, permissionIdByCode)
    const systemAdminAccountIds = readSystemAdminAccountIds()
    const systemAdminBindingCount = await syncSystemAdminAccountBindings(
      prisma,
      systemAdminRole.roleId,
      systemAdminAccountIds
    )
    const navigationFoundation = await syncNavigationFoundation(prisma)

    process.stdout.write(
      [
        '=== Permission Foundation Sync ===',
        `seed_count=${items.length}`,
        `upserted_count=${upserted}`,
        `system_admin_role_id=${systemAdminRole.roleId}`,
        `system_admin_permission_count=${systemAdminRole.permissionCount}`,
        `built_in_role_template_count=${builtInRoleTemplateCount}`,
        `built_in_role_instance_permission_backfill_count=${builtInRoleInstancePermissionBackfillCount}`,
        `system_admin_binding_count=${systemAdminBindingCount}`,
        `navigation_entry_count=${navigationFoundation.entryCount}`,
        `navigation_deprecated_entry_disabled_count=${navigationFoundation.deprecatedEntryCount}`,
        `navigation_visibility_seed_count=${navigationFoundation.visibilitySeedCount}`,
        `navigation_landing_seed_count=${navigationFoundation.landingSeedCount}`
      ].join('\n') + '\n'
    )
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
}
