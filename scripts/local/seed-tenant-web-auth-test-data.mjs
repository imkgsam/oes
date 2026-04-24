import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSeedAccountRoleBindings,
  buildSeedAccounts,
  buildSeedContactAssets,
  buildSeedTenantOrgRootUnits,
  buildSeedTenantOrgTenants,
  buildSeedTenantRoles,
  DEFAULT_OTP_CODE,
  DEFAULT_PASSWORD,
  LEGACY_IDENTIFIERS,
  MANAGED_ACCOUNT_IDS,
  MANAGED_USER_IDS,
  SEEDED_COMPANIES,
  SEEDED_LOGIN_IDENTIFIERS,
  SEEDED_OTP_IDENTIFIERS,
  SEEDED_TENANT_ROLE_PERMISSION_CODES,
  SEEDED_USERS,
  SYSTEM_ACCOUNT_IDS,
} from './tenant-web-auth-test-fixtures.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const {
  PrismaClient: IdentityPrismaClient,
  AccountContactAssetStatus,
  AccountContactAssetType,
} = require(path.join(
  ROOT,
  'src/services/system/identity-service/prisma/generated/prisma',
));
const {
  PrismaClient: AuthPrismaClient,
  CredentialType,
  LoginMethodType,
  OTPUsage,
} = require(path.join(ROOT, 'src/services/system/auth-service/prisma/generated/prisma'));
const {
  PrismaClient: PermissionPrismaClient,
  AccountType,
  RoleKind,
  ScopeLevel,
} = require(path.join(
  ROOT,
  'src/services/system/permission-service/prisma/generated/prisma',
));
const {
  PrismaClient: TenantOrgPrismaClient,
  OrgUnitStatus,
  OrgUnitType,
  TenantStatus,
} = require(path.join(
  ROOT,
  'src/services/system/tenant-org-service/prisma/generated/prisma',
));
const bcrypt = require(path.join(
  ROOT,
  'src/services/system/auth-service/node_modules/bcrypt',
));

const AUTH_DB_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/authdb';
const IDENTITY_DB_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/identitydb';
const PERMISSION_DB_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/permissiondb';
const TENANT_ORG_DB_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/tenantorgdb';

const SEEDED_ACCOUNTS = buildSeedAccounts();
const SEEDED_CONTACT_ASSETS = buildSeedContactAssets();
const SEEDED_TENANT_ORG_ROOT_UNITS = buildSeedTenantOrgRootUnits();
const SEEDED_TENANT_ORG_TENANTS = buildSeedTenantOrgTenants();
const SEEDED_TENANT_ROLES = buildSeedTenantRoles();
const SEEDED_ACCOUNT_ROLE_BINDINGS = buildSeedAccountRoleBindings();

// Runs the permission and navigation foundation sync so built-in roles and entries stay authoritative.
function syncPermissionFoundationForLocalSystemAccount() {
  const result = spawnSync(
    'pnpm',
    ['--filter', 'permission-service', 'permission-codes:sync'],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        DATABASE_URL: PERMISSION_DB_URL,
        OES_SYSTEM_ADMIN_ACCOUNT_IDS: SYSTEM_ACCOUNT_IDS.join(','),
      },
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    throw new Error(`permission foundation sync failed with status ${result.status}`);
  }
}

// Writes the requested realistic tenant, user, account, and contact fixture rows into identity-service.
async function seedIdentity(identity) {
  await identity.$transaction(async (tx) => {
    for (const company of SEEDED_COMPANIES) {
      await tx.tenant.upsert({
        where: { id: company.id },
        update: {
          code: company.code,
          isActive: true,
          name: company.name,
        },
        create: {
          id: company.id,
          code: company.code,
          isActive: true,
          name: company.name,
        },
      });
    }

    for (const user of SEEDED_USERS) {
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          isActive: true,
          phone: user.phone,
          username: user.username,
        },
        create: {
          id: user.id,
          email: user.email,
          isActive: true,
          phone: user.phone,
          username: user.username,
        },
      });
    }

    await tx.userAccount.deleteMany({
      where: {
        userId: { in: MANAGED_USER_IDS },
        id: { notIn: MANAGED_ACCOUNT_IDS },
      },
    });

    for (const account of SEEDED_ACCOUNTS) {
      await tx.userAccount.upsert({
        where: { id: account.id },
        update: {
          avatarUrl: account.avatarUrl,
          contextKey: account.contextKey,
          displayName: account.displayName,
          isEnable: true,
          scopeLevel: account.scopeLevel,
          tenantId: account.tenantId,
          userId: account.userId,
        },
        create: {
          id: account.id,
          avatarUrl: account.avatarUrl,
          contextKey: account.contextKey,
          displayName: account.displayName,
          isEnable: true,
          scopeLevel: account.scopeLevel,
          tenantId: account.tenantId,
          userId: account.userId,
        },
      });
    }

    await tx.accountContactAsset.deleteMany({
      where: {
        accountId: { in: MANAGED_ACCOUNT_IDS },
      },
    });

    if (SEEDED_CONTACT_ASSETS.length > 0) {
      await tx.accountContactAsset.createMany({
        data: SEEDED_CONTACT_ASSETS.map((asset) => ({
          id: asset.id,
          accountId: asset.accountId,
          assignedAt: asset.assignedAt,
          assignedBy: asset.assignedBy,
          isPrimary: asset.isPrimary,
          status: AccountContactAssetStatus[asset.status],
          tenantId: asset.tenantId,
          type: AccountContactAssetType[asset.type],
          value: asset.value,
        })),
      });
    }
  });
}

// Rebuilds the managed local auth login methods, credentials, and OTP fixtures in auth-service.
async function seedAuth(auth, passwordHash) {
  await auth.$transaction(async (tx) => {
    await tx.credential.deleteMany({
      where: {
        LoginMethod: {
          userId: { in: MANAGED_USER_IDS },
        },
      },
    });

    await tx.loginMethod.deleteMany({
      where: {
        OR: [
          { userId: { in: MANAGED_USER_IDS } },
          { identifier: { in: [...SEEDED_LOGIN_IDENTIFIERS, ...LEGACY_IDENTIFIERS] } },
        ],
      },
    });

    for (const user of SEEDED_USERS) {
      const emailMethod = await tx.loginMethod.create({
        data: {
          enabled: true,
          identifier: user.email,
          type: LoginMethodType.EMAIL,
          userId: user.id,
          verified: true,
        },
      });

      const phoneMethod = await tx.loginMethod.create({
        data: {
          enabled: true,
          identifier: user.phone,
          type: LoginMethodType.PHONE,
          userId: user.id,
          verified: true,
        },
      });

      await tx.credential.createMany({
        data: [
          {
            credentialType: CredentialType.PASSWORD,
            enabled: true,
            hashedValue: passwordHash,
            loginMethodId: emailMethod.id,
          },
          {
            credentialType: CredentialType.PASSWORD,
            enabled: true,
            hashedValue: passwordHash,
            loginMethodId: phoneMethod.id,
          },
        ],
      });
    }

    await tx.oTP.deleteMany({
      where: {
        identifier: { in: SEEDED_OTP_IDENTIFIERS },
      },
    });

    for (const identifier of SEEDED_LOGIN_IDENTIFIERS) {
      await tx.oTP.create({
        data: {
          attemptCount: 0,
          consumed: false,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          hashedValue: DEFAULT_OTP_CODE,
          identifier,
          lastSentAt: new Date(),
          maxAttempt: 3,
          usage: OTPUsage.LOGIN,
          valid: true,
        },
      });
    }
  });
}

// Seeds tenant-scoped role instances and account-role bindings while preserving the built-in system admin role flow.
async function seedPermission(permission) {
  await permission.$transaction(async (tx) => {
    for (const role of SEEDED_TENANT_ROLES) {
      await tx.role.upsert({
        where: { id: role.id },
        update: {
          code: role.code,
          description: role.description,
          isEnabled: role.isEnabled,
          kind: RoleKind[role.kind],
          name: role.name,
          scopeKey: role.scopeKey,
          templateRoleId: role.templateRoleId,
          tenantId: role.tenantId,
        },
        create: {
          id: role.id,
          code: role.code,
          description: role.description,
          isEnabled: role.isEnabled,
          kind: RoleKind[role.kind],
          name: role.name,
          scopeKey: role.scopeKey,
          templateRoleId: role.templateRoleId,
          tenantId: role.tenantId,
        },
      });
    }

    await tx.rolePermission.deleteMany({
      where: {
        roleId: { in: SEEDED_TENANT_ROLES.map((role) => role.id) },
      },
    });

    const tenantPermissionCodes = [
      ...new Set(
        SEEDED_TENANT_ROLES.flatMap((role) =>
          SEEDED_TENANT_ROLE_PERMISSION_CODES.get(role.code) ?? [],
        ),
      ),
    ];
    const permissionsByCode =
      tenantPermissionCodes.length > 0
        ? new Map(
            (
              await tx.permission.findMany({
                where: {
                  code: { in: tenantPermissionCodes },
                },
                select: {
                  id: true,
                  code: true,
                },
              })
            ).map((permissionRow) => [permissionRow.code, permissionRow.id]),
          )
        : new Map();

    const missingTenantPermissionCodes = tenantPermissionCodes.filter(
      (code) => !permissionsByCode.has(code),
    );

    if (missingTenantPermissionCodes.length > 0) {
      throw new Error(
        `Missing seeded tenant role permissions: ${missingTenantPermissionCodes.join(', ')}`,
      );
    }

    const tenantRolePermissionRows = SEEDED_TENANT_ROLES.flatMap((role) =>
      (SEEDED_TENANT_ROLE_PERMISSION_CODES.get(role.code) ?? []).map((permissionCode) => ({
        roleId: role.id,
        permissionId: permissionsByCode.get(permissionCode),
      })),
    );

    if (tenantRolePermissionRows.length > 0) {
      await tx.rolePermission.createMany({
        data: tenantRolePermissionRows,
      });
    }

    await tx.accountRole.deleteMany({
      where: {
        roleId: { in: SEEDED_TENANT_ROLES.map((role) => role.id) },
      },
    });

    if (SEEDED_ACCOUNT_ROLE_BINDINGS.length > 0) {
      await tx.accountRole.createMany({
        data: SEEDED_ACCOUNT_ROLE_BINDINGS.map((binding) => ({
          accountId: binding.accountId,
          accountType: AccountType[binding.accountType],
          effectiveAt: binding.effectiveAt,
          expiresAt: binding.expiresAt,
          roleId: binding.roleId,
          scopeLevel: ScopeLevel[binding.scopeLevel],
          tenantId: binding.tenantId,
        })),
      });
    }
  });
}

// Rebuilds tenant-org-service tenant and root org facts so gateway hydration uses the proper tenant truth owner.
async function seedTenantOrg(tenantOrg) {
  await tenantOrg.$transaction(async (tx) => {
    const managedTenantIds = SEEDED_TENANT_ORG_TENANTS.map((tenant) => tenant.id);

    await tx.orgUnit.deleteMany({
      where: {
        tenantId: { in: managedTenantIds },
      },
    });

    for (const tenant of SEEDED_TENANT_ORG_TENANTS) {
      await tx.tenant.upsert({
        where: { id: tenant.id },
        update: {
          code: tenant.code,
          name: tenant.name,
          rootOrgId: tenant.rootOrgId,
          status: TenantStatus[tenant.status],
        },
        create: {
          id: tenant.id,
          code: tenant.code,
          name: tenant.name,
          rootOrgId: tenant.rootOrgId,
          status: TenantStatus[tenant.status],
        },
      });
    }

    for (const orgUnit of SEEDED_TENANT_ORG_ROOT_UNITS) {
      await tx.orgUnit.create({
        data: {
          id: orgUnit.id,
          tenantId: orgUnit.tenantId,
          parentOrgId: orgUnit.parentOrgId,
          name: orgUnit.name,
          type: OrgUnitType[orgUnit.type],
          status: OrgUnitStatus[orgUnit.status],
          path: orgUnit.path,
          depth: orgUnit.depth,
          sortOrder: orgUnit.sortOrder,
          organizationPartyId: orgUnit.organizationPartyId,
        },
      });
    }
  });
}

// Prints a compact summary so local operators can immediately see which credentials were seeded.
function printSummary() {
  console.log('Seeded tenant-web auth test data successfully.');
  console.log(`Companies: ${SEEDED_COMPANIES.map((company) => company.name).join(' / ')}`);
  console.log(`Users: ${SEEDED_USERS.map((user) => `${user.personName}<${user.email}>`).join(' ; ')}`);
  console.log(`Tenant roots: ${SEEDED_TENANT_ORG_ROOT_UNITS.map((org) => org.name).join(' / ')}`);
  console.log(`Password: ${DEFAULT_PASSWORD}`);
  console.log(`OTP: ${DEFAULT_OTP_CODE}`);
}

async function main() {
  const identity = new IdentityPrismaClient({
    datasources: {
      db: { url: IDENTITY_DB_URL },
    },
  });
  const auth = new AuthPrismaClient({
    datasources: {
      db: { url: AUTH_DB_URL },
    },
  });
  const permission = new PermissionPrismaClient({
    datasources: {
      db: { url: PERMISSION_DB_URL },
    },
  });
  const tenantOrg = new TenantOrgPrismaClient({
    datasources: {
      db: { url: TENANT_ORG_DB_URL },
    },
  });

  try {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    await seedIdentity(identity);
    await seedAuth(auth, passwordHash);
    await seedTenantOrg(tenantOrg);
    syncPermissionFoundationForLocalSystemAccount();
    await seedPermission(permission);
    syncPermissionFoundationForLocalSystemAccount();
    printSummary();
  } finally {
    await Promise.allSettled([
      identity.$disconnect(),
      auth.$disconnect(),
      permission.$disconnect(),
      tenantOrg.$disconnect(),
    ]);
  }
}

main().catch((error) => {
  console.error('Failed to seed tenant-web auth test data.');
  console.error(error);
  process.exitCode = 1;
});
