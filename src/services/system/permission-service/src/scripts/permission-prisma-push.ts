import { spawnSync } from 'child_process'
import { PrismaClient } from '../../prisma/generated/prisma'
import {
  applyPermissionSchemaDriftRepair,
  buildPermissionSchemaDriftRepairPlan,
  collectDeprecatedPermissionModuleEnumValues,
  collectPermissionSchemaDriftRepairSnapshot,
  loadPermissionServiceDatabaseUrl
} from './permission-schema-drift-repair'

// buildPrismaDbPushArgs limits automatic data-loss acceptance to known deprecated permission enum drift.
export function buildPrismaDbPushArgs(deprecatedModuleEnumValues: readonly string[]): string[] {
  const args = ['prisma', 'db', 'push']

  if (deprecatedModuleEnumValues.length > 0) {
    args.push('--accept-data-loss')
  }

  return args
}

// main repairs known permission schema drift before delegating to the Prisma CLI.
async function main(): Promise<void> {
  loadPermissionServiceDatabaseUrl()
  const prisma = new PrismaClient()
  let deprecatedModuleEnumValues: string[] = []

  try {
    const snapshot = await collectPermissionSchemaDriftRepairSnapshot(prisma)
    const plan = buildPermissionSchemaDriftRepairPlan(snapshot)

    if (!plan.canRepair) {
      process.stderr.write(`${JSON.stringify(plan, null, 2)}\n`)
      process.exitCode = 1
      return
    }

    await applyPermissionSchemaDriftRepair(prisma, plan)
    deprecatedModuleEnumValues = await collectDeprecatedPermissionModuleEnumValues(prisma)

    if (snapshot.deprecatedPermissionCount > 0) {
      process.stdout.write(
        [
          '=== Permission Schema Drift Repair ===',
          `deprecated_permission_count=${snapshot.deprecatedPermissionCount}`,
          `deprecated_role_permission_reference_count=${snapshot.deprecatedRolePermissionReferenceCount}`,
          `deprecated_permission_codes=${snapshot.deprecatedPermissionCodes.join(',')}`
        ].join('\n') + '\n'
      )
    }
  } finally {
    await prisma.$disconnect()
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const result = spawnSync(command, buildPrismaDbPushArgs(deprecatedModuleEnumValues), {
    stdio: 'inherit'
  })

  if (result.error) {
    throw result.error
  }

  process.exitCode = result.status ?? 1
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`)
    process.exitCode = 1
  })
}
