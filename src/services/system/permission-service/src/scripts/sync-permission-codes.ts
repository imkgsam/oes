import {
  AccountType,
  Modules,
  PrismaClient,
  RoleKind,
  ScopeLevel
} from '../../prisma/generated/prisma'
import {
  AUTH_SESSION_PERMISSION_CODES,
  PERMISSION_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'

type PermissionSeedItem = {
  code: string
  module: Modules
  description?: string
}

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

// Builds the authoritative permission seed set from shared permission-code constants.
function buildPermissionSeedItems(): PermissionSeedItem[] {
  const items: PermissionSeedItem[] = [
    ...valuesOf(PERMISSION_MANAGEMENT_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.PERMISSION_SERVICE
    })),
    ...valuesOf(AUTH_SESSION_PERMISSION_CODES).map((code) => ({
      code,
      module: Modules.AUTH_SERVICE
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

// Synchronizes permission rows, the built-in system admin role, and optional system admin bindings.
async function main() {
  const prisma = new PrismaClient()

  try {
    const items = buildPermissionSeedItems()

    let upserted = 0
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
      upserted += 1
    }

    const systemAdminRole = await syncSystemAdminRole(prisma, permissionIds)
    const systemAdminAccountIds = readSystemAdminAccountIds()
    const systemAdminBindingCount = await syncSystemAdminAccountBindings(
      prisma,
      systemAdminRole.roleId,
      systemAdminAccountIds
    )

    process.stdout.write(
      [
        '=== Permission Foundation Sync ===',
        `seed_count=${items.length}`,
        `upserted_count=${upserted}`,
        `system_admin_role_id=${systemAdminRole.roleId}`,
        `system_admin_permission_count=${systemAdminRole.permissionCount}`,
        `system_admin_binding_count=${systemAdminBindingCount}`
      ].join('\n') + '\n'
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`)
  process.exitCode = 1
})
