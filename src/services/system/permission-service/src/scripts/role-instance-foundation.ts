import { PrismaClient, RoleKind } from '../../prisma/generated/prisma'
import { BUILT_IN_ROLE_TEMPLATES } from './role-foundation'

type PermissionCodeMap = ReadonlyMap<string, string>

// Ensures built-in tenant/system admin instances keep the minimum baseline permissions defined by their managed templates.
export async function syncBuiltInRoleInstanceBaselines(
  prisma: Pick<PrismaClient, 'role' | 'rolePermission'>,
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
        id: true
      }
    })

    if (managedInstances.length === 0) {
      continue
    }

    const roleIds = managedInstances.map((role) => role.id)
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

  return createdCount
}
