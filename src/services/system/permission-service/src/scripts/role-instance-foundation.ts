import { PrismaClient, RoleKind } from '../../prisma/generated/prisma'
import {
  buildNavigationFoundationLandingSeeds,
  buildNavigationFoundationVisibilitySeeds
} from './navigation-foundation'
import { BUILT_IN_ROLE_TEMPLATES } from './role-foundation'

type PermissionCodeMap = ReadonlyMap<string, string>

// Ensures built-in role instances keep the minimum baseline permissions and navigation defined by their managed templates.
export async function syncBuiltInRoleInstanceBaselines(
  prisma: Pick<
    PrismaClient,
    'role' | 'roleLandingPolicy' | 'roleNavigationVisibility' | 'rolePermission'
  >,
  permissionIdByCode: PermissionCodeMap
): Promise<number> {
  let createdCount = 0

  for (const template of BUILT_IN_ROLE_TEMPLATES) {
    const baselinePermissionIds = template.permissionCodes
      .map((code) => permissionIdByCode.get(code))
      .filter((permissionId): permissionId is string => Boolean(permissionId))

    if (baselinePermissionIds.length === 0) {
      continue
    }

    const managedInstances = await prisma.role.findMany({
      where: {
        kind: {
          in: [RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE]
        },
        OR: [{ code: template.code }, { templateRoleId: template.id }]
      },
      select: {
        id: true,
        kind: true
      }
    })

    if (managedInstances.length === 0) {
      continue
    }

    const roleIds = managedInstances.map((role) => role.id)
    await prisma.role.updateMany({
      where: {
        id: {
          in: roleIds
        }
      },
      data: {
        allowTenantPermissionOverride: template.allowTenantPermissionOverride,
        isProtected: template.isProtected
      } as any
    })

    if (baselinePermissionIds.length > 0) {
      const existingPermissions = await prisma.rolePermission.findMany({
        where: {
          roleId: { in: roleIds },
          permissionId: { in: baselinePermissionIds }
        },
        select: {
          roleId: true,
          permissionId: true
        }
      })

      const existingPairs = new Set(
        existingPermissions.map((item) => `${item.roleId}:${item.permissionId}`)
      )
      const missingPairs = roleIds.flatMap((roleId) =>
        baselinePermissionIds
          .filter((permissionId) => !existingPairs.has(`${roleId}:${permissionId}`))
          .map((permissionId) => ({
            roleId,
            permissionId
          }))
      )

      if (missingPairs.length > 0) {
        await prisma.rolePermission.createMany({
          data: missingPairs,
          skipDuplicates: true
        })
        createdCount += missingPairs.length
      }
    }

    const templateVisibility = buildNavigationFoundationVisibilitySeeds([template])
    await backfillRoleNavigationVisibility(prisma, managedInstances, templateVisibility)
    await backfillRoleLandingPolicies(prisma, managedInstances, template)
  }

  return createdCount
}

/** backfillRoleNavigationVisibility adds template baseline navigation entries without deleting tenant custom entries. */
async function backfillRoleNavigationVisibility(
  prisma: Pick<PrismaClient, 'roleNavigationVisibility'>,
  managedInstances: Array<{ id: string; kind: RoleKind }>,
  templateVisibility: ReturnType<typeof buildNavigationFoundationVisibilitySeeds>
): Promise<void> {
  if (managedInstances.length === 0 || templateVisibility.length === 0) {
    return
  }

  const roleIds = managedInstances.map((role) => role.id)
  const existingVisibility = await prisma.roleNavigationVisibility.findMany({
    where: {
      roleId: { in: roleIds },
      entryKey: { in: templateVisibility.map((item) => item.entryKey) },
      terminal: { in: templateVisibility.map((item) => item.terminal) }
    },
    select: {
      roleId: true,
      entryKey: true,
      terminal: true
    }
  })
  const existingKeys = new Set(
    existingVisibility.map((item) => `${item.roleId}:${item.terminal}:${item.entryKey}`)
  )
  const missingVisibility = managedInstances.flatMap((role) =>
    templateVisibility
      .filter((item) => !existingKeys.has(`${role.id}:${item.terminal}:${item.entryKey}`))
      .map((item) => ({
        roleId: role.id,
        entryKey: item.entryKey,
        terminal: item.terminal,
        enabled: item.enabled
      }))
  )

  if (missingVisibility.length > 0) {
    await prisma.roleNavigationVisibility.createMany({
      data: missingVisibility,
      skipDuplicates: true
    })
  }
}

/** backfillRoleLandingPolicies adds missing default-entry policies for managed role instances. */
async function backfillRoleLandingPolicies(
  prisma: Pick<PrismaClient, 'roleLandingPolicy'>,
  managedInstances: Array<{ id: string; kind: RoleKind }>,
  template: (typeof BUILT_IN_ROLE_TEMPLATES)[number]
): Promise<void> {
  if (managedInstances.length === 0) {
    return
  }

  const roleLandingPolicies = managedInstances.flatMap((role) =>
    buildNavigationFoundationLandingSeeds([
      {
        code: template.code,
        id: role.id,
        kind: role.kind
      }
    ])
  )
  const existingLandingPolicies = await prisma.roleLandingPolicy.findMany({
    where: {
      roleId: { in: managedInstances.map((role) => role.id) },
      terminal: { in: roleLandingPolicies.map((item) => item.terminal) },
      defaultEntryKey: { in: roleLandingPolicies.map((item) => item.defaultEntryKey) }
    },
    select: {
      roleId: true,
      terminal: true,
      defaultEntryKey: true
    }
  })
  const existingKeys = new Set(
    existingLandingPolicies.map((item) => `${item.roleId}:${item.terminal}:${item.defaultEntryKey}`)
  )
  const missingLandingPolicies = roleLandingPolicies.filter(
    (item) => !existingKeys.has(`${item.roleId}:${item.terminal}:${item.defaultEntryKey}`)
  )

  if (missingLandingPolicies.length > 0) {
    await prisma.roleLandingPolicy.createMany({
      data: missingLandingPolicies,
      skipDuplicates: true
    })
  }
}
