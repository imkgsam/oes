#!/usr/bin/env node

import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { PrismaClient: TenantOrgPrisma } = require('../../src/services/system/tenant-org-service/prisma/generated/prisma');
const { PrismaClient: HrPrisma } = require('../../src/services/system/hr-service/prisma/generated/prisma');

const EMPLOYEE_CODE_PATTERN = /^EMP-([0-9A-F]{3})-([0-9A-F]{4})$/;
const EMPLOYEE_CODE_SUFFIX_PATTERN = /^[0-9A-F]{4}$/;

/** Migrates tenant prefixes and HR employee rows so DB stores only the employee-code suffix. */
async function main() {
  const apply = process.argv.includes('--apply');
  const tenantOrg = new TenantOrgPrisma({
    datasources: { db: { url: resolveDatabaseUrl('TENANT_ORG_DATABASE_URL', 'src/services/system/tenant-org-service') } },
  });
  const hr = new HrPrisma({
    datasources: { db: { url: resolveDatabaseUrl('HR_DATABASE_URL', 'src/services/system/hr-service') } },
  });

  try {
    const hasEmployeeCodePrefixColumn = await tenantColumnExists(tenantOrg, 'employeeCodePrefix');
    const tenants = hasEmployeeCodePrefixColumn
      ? await tenantOrg.$queryRawUnsafe(
          'SELECT "id", "code", "employeeCodePrefix" FROM "Tenant" ORDER BY "createdAt" ASC, "code" ASC, "id" ASC',
        )
      : await tenantOrg.$queryRawUnsafe(
          'SELECT "id", "code", NULL AS "employeeCodePrefix" FROM "Tenant" ORDER BY "createdAt" ASC, "code" ASC, "id" ASC',
        );
    const assignedPrefixes = new Set();
    let nextPrefix = 0;
    const tenantPrefixById = new Map();
    const tenantUpdates = [];

    for (const tenant of tenants) {
      let prefix = String(tenant.employeeCodePrefix ?? '').trim().toUpperCase();
      const needsNewPrefix = !/^[0-9A-F]{3}$/.test(prefix) || assignedPrefixes.has(prefix);
      if (needsNewPrefix) {
        while (assignedPrefixes.has(toHex(nextPrefix, 3))) {
          nextPrefix += 1;
        }
        if (nextPrefix > 0xfff) {
          throw new Error('Tenant employee code prefix capacity exhausted');
        }
        prefix = toHex(nextPrefix, 3);
        nextPrefix += 1;
      }
      assignedPrefixes.add(prefix);
      if (!hasEmployeeCodePrefixColumn || tenant.employeeCodePrefix !== prefix) {
        tenantUpdates.push({ id: tenant.id, prefix });
      }
      tenantPrefixById.set(String(tenant.id), prefix);
    }

    const employees = await hr.employee.findMany({
      orderBy: [{ tenantId: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const employeeUpdates = [];
    const usedSuffixesByTenant = new Map();
    const nextSequenceByTenant = new Map();
    for (const employee of employees) {
      const prefix = tenantPrefixById.get(employee.tenantId);
      if (!prefix) {
        throw new Error(`Tenant ${employee.tenantId} has no employeeCodePrefix mapping`);
      }
      const existingCode = String(employee.employeeCode ?? '').trim().toUpperCase();
      const fullCodeMatch = existingCode.match(EMPLOYEE_CODE_PATTERN);
      const preferredSuffix = fullCodeMatch?.[2] ?? (
        EMPLOYEE_CODE_SUFFIX_PATTERN.test(existingCode) ? existingCode : undefined
      );
      const employeeCodeSuffix = allocateEmployeeCodeSuffix(employee.tenantId, preferredSuffix, {
        usedSuffixesByTenant,
        nextSequenceByTenant,
      });
      if (!EMPLOYEE_CODE_SUFFIX_PATTERN.test(employeeCodeSuffix)) {
        throw new Error(`Generated invalid employee code suffix ${employeeCodeSuffix}`);
      }
      if (fullCodeMatch?.[1] && fullCodeMatch[1] !== prefix) {
        employeeUpdates.push({ id: employee.id, employeeCode: employeeCodeSuffix });
      } else if (employee.employeeCode !== employeeCodeSuffix) {
        employeeUpdates.push({ id: employee.id, employeeCode: employeeCodeSuffix });
      }
    }

    console.log(`Tenant prefixes to update: ${tenantUpdates.length}`);
    console.log(`Employee codes to update: ${employeeUpdates.length}`);
    if (!apply) {
      console.log('Dry run only. Re-run with --apply to mutate databases.');
      return;
    }

    await tenantOrg.$executeRawUnsafe('ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "employeeCodePrefix" VARCHAR(3)');
    for (const update of tenantUpdates) {
      await tenantOrg.$executeRawUnsafe(
        'UPDATE "Tenant" SET "employeeCodePrefix" = $1 WHERE "id" = $2::uuid',
        update.prefix,
        update.id,
      );
    }
    await tenantOrg.$executeRawUnsafe('ALTER TABLE "Tenant" ALTER COLUMN "employeeCodePrefix" SET NOT NULL');
    await tenantOrg.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_employeeCodePrefix_key" ON "Tenant"("employeeCodePrefix")',
    );

    await hr.$executeRawUnsafe('ALTER TABLE "Employee" ALTER COLUMN "employeeCode" TYPE VARCHAR(100)');
    await hr.$transaction(async (tx) => {
      for (const [index, update] of employeeUpdates.entries()) {
        await tx.employee.update({
          where: { id: update.id },
          data: { employeeCode: `M${toHex(index + 1, 4)}_${String(update.id).replace(/-/g, '')}` },
        });
      }
      for (const update of employeeUpdates) {
        await tx.employee.update({
          where: { id: update.id },
          data: { employeeCode: update.employeeCode },
        });
      }
    });
    await hr.$executeRawUnsafe('ALTER TABLE "Employee" ALTER COLUMN "employeeCode" TYPE VARCHAR(4)');
    console.log('Employee code format migration applied.');
  } finally {
    await hr.$disconnect();
    await tenantOrg.$disconnect();
  }
}

function toHex(value, width) {
  return value.toString(16).toUpperCase().padStart(width, '0');
}

/** allocateEmployeeCodeSuffix keeps valid unique suffixes and fills gaps for invalid or duplicate legacy codes. */
function allocateEmployeeCodeSuffix(tenantId, preferredSuffix, state) {
  const usedSuffixes = getTenantSet(state.usedSuffixesByTenant, tenantId);
  const normalizedPreferredSuffix = String(preferredSuffix ?? '').trim().toUpperCase();
  if (
    EMPLOYEE_CODE_SUFFIX_PATTERN.test(normalizedPreferredSuffix) &&
    normalizedPreferredSuffix !== '0000' &&
    !usedSuffixes.has(normalizedPreferredSuffix)
  ) {
    usedSuffixes.add(normalizedPreferredSuffix);
    const preferredSequence = Number.parseInt(normalizedPreferredSuffix, 16);
    state.nextSequenceByTenant.set(
      tenantId,
      Math.max(state.nextSequenceByTenant.get(tenantId) ?? 1, preferredSequence + 1),
    );
    return normalizedPreferredSuffix;
  }

  let sequence = state.nextSequenceByTenant.get(tenantId) ?? 1;
  while (sequence <= 0xffff) {
    const candidate = toHex(sequence, 4);
    sequence += 1;
    if (!usedSuffixes.has(candidate)) {
      usedSuffixes.add(candidate);
      state.nextSequenceByTenant.set(tenantId, sequence);
      return candidate;
    }
  }
  throw new Error(`Tenant ${tenantId} exceeds employee code capacity`);
}

/** getTenantSet returns the mutable per-tenant set used during migration planning. */
function getTenantSet(map, tenantId) {
  const existing = map.get(tenantId);
  if (existing) {
    return existing;
  }
  const created = new Set();
  map.set(tenantId, created);
  return created;
}

/** resolveDatabaseUrl loads service-local DATABASE_URL unless a dedicated override env var is supplied. */
function resolveDatabaseUrl(envKey, serviceDir) {
  if (process.env[envKey]) {
    return process.env[envKey];
  }

  const envPath = resolve(process.cwd(), serviceDir, '.env');
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, 'utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (!match) {
      throw new Error(`DATABASE_URL was not found in ${envPath}`);
    }
    return parseEnvValue(match[1]);
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  throw new Error(`${envKey} is not set and .env was not found at ${envPath}`);
}

function parseEnvValue(raw) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** tenantColumnExists keeps dry-run read-only even before the tenant prefix column is added. */
async function tenantColumnExists(tenantOrg, columnName) {
  const rows = await tenantOrg.$queryRawUnsafe(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2 LIMIT 1',
    'Tenant',
    columnName,
  );
  return rows.length > 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
