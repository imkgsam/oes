import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSeedAccountRoleBindings,
  buildSeedAccounts,
  buildBrowserExtensionDesignerDemoSeed,
  buildSeedContactAssets,
  buildSeedEmployments,
  buildSeedHrEmployees,
  buildSeedIdentityEmployeeBindings,
  buildSeedIdentityOrgMemberships,
  buildSeedIdentityOrgs,
  buildSeedIdentityTenants,
  buildSeedOnboardingAccesses,
  buildSeedOrganizationParties,
  buildSeedParties,
  buildSeedPersonParties,
  buildPdaLoginSmokeSeed,
  buildSeedSummary,
  buildSeedTenantOrgTenants,
  buildSeedTenantOrgUnits,
  buildSeedTenantParties,
  buildSeedTenantRoles,
  buildSeedUsers,
  DEFAULT_OTP_CODE,
  DEFAULT_PASSWORD,
  LEGACY_IDENTIFIERS,
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
const PRIMARY_WORKSPACE_ROOT = path.resolve(ROOT, '..', '..');

const {
  PrismaClient: IdentityPrismaClient,
  AccountContactAssetStatus,
  AccountContactAssetType,
  AccountOrgRelationType,
  OrgType,
  UserAccountScopeLevel,
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
const {
  PrismaClient: PartyPrismaClient,
  PartyStatus,
  PartyType,
  TenantPartyStatus,
} = require(path.join(
  ROOT,
  'src/services/system/party-service/prisma/generated/prisma',
));
const {
  PrismaClient: HrPrismaClient,
  EmployeeLifecycleStatus,
  EmploymentStatus,
  OnboardingAccessStatus,
} = require(path.join(
  ROOT,
  'src/services/system/hr-service/prisma/generated/prisma',
));
const bcrypt = require(path.join(
  ROOT,
  'src/services/system/auth-service/node_modules/bcrypt',
));

const SEEDED_ACCOUNTS = buildSeedAccounts();
const SEEDED_CONTACT_ASSETS = buildSeedContactAssets();
const SEEDED_EMPLOYEES = buildSeedHrEmployees();
const SEEDED_EMPLOYMENTS = buildSeedEmployments();
const SEEDED_EMPLOYEE_BINDINGS = buildSeedIdentityEmployeeBindings();
const SEEDED_IDENTITY_ORG_MEMBERSHIPS = buildSeedIdentityOrgMemberships();
const SEEDED_IDENTITY_ORGS = buildSeedIdentityOrgs();
const SEEDED_IDENTITY_TENANTS = buildSeedIdentityTenants();
const SEEDED_ONBOARDING_ACCESSES = buildSeedOnboardingAccesses();
const SEEDED_ORGANIZATION_PARTIES = buildSeedOrganizationParties();
const SEEDED_PARTIES = buildSeedParties();
const SEEDED_PERSON_PARTIES = buildSeedPersonParties();
const SEEDED_TENANT_ORG_TENANTS = buildSeedTenantOrgTenants();
const SEEDED_TENANT_ORG_UNITS = buildSeedTenantOrgUnits();
const SEEDED_TENANT_PARTIES = buildSeedTenantParties();
const SEEDED_TENANT_ROLES = buildSeedTenantRoles();
const SEEDED_USERS_DATA = buildSeedUsers();
const SEEDED_ACCOUNT_ROLE_BINDINGS = buildSeedAccountRoleBindings();
const PDA_LOGIN_SMOKE_SEED = buildPdaLoginSmokeSeed();
const BROWSER_EXTENSION_DESIGNER_DEMO_SEED = buildBrowserExtensionDesignerDemoSeed();
const SEEDED_USER_IDENTIFIERS = {
  usernames: SEEDED_USERS_DATA.map((user) => user.username).filter(Boolean),
  emails: SEEDED_USERS_DATA.map((user) => user.email).filter(Boolean),
  phones: SEEDED_USERS_DATA.map((user) => user.phone).filter(Boolean),
};

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

// Resolves one service database url from an explicit env var or the service-local .env file.
function resolveDatabaseUrl(envKey, serviceRelativePath) {
  const direct = process.env[envKey];
  if (direct?.trim()) {
    return direct.trim();
  }

  const envCandidates = [
    path.join(ROOT, serviceRelativePath, '.env'),
    path.join(PRIMARY_WORKSPACE_ROOT, serviceRelativePath, '.env'),
  ];
  const envPath = envCandidates.find((candidate) => existsSync(candidate));
  if (!envPath) {
    throw new Error(
      `${envKey} is not set and no service .env file was found in ${envCandidates.join(' or ')}`
    );
  }

  const envContent = readFileSync(envPath, 'utf8');
  const match = envContent.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
  if (!match) {
    throw new Error(`DATABASE_URL was not found in ${envPath}`);
  }

  return parseEnvValue(match[1]);
}

const AUTH_DB_URL = resolveDatabaseUrl('AUTH_DATABASE_URL', 'src/services/system/auth-service');
const IDENTITY_DB_URL = resolveDatabaseUrl('IDENTITY_DATABASE_URL', 'src/services/system/identity-service');
const PERMISSION_DB_URL = resolveDatabaseUrl('PERMISSION_DATABASE_URL', 'src/services/system/permission-service');
const TENANT_ORG_DB_URL = resolveDatabaseUrl('TENANT_ORG_DATABASE_URL', 'src/services/system/tenant-org-service');
const PARTY_DB_URL = resolveDatabaseUrl('PARTY_DATABASE_URL', 'src/services/system/party-service');
const HR_DB_URL = resolveDatabaseUrl('HR_DATABASE_URL', 'src/services/system/hr-service');

// Runs the permission and navigation foundation sync so built-in tenant admin instances stay authoritative.
function syncPermissionFoundationForLocalSystemAccount() {
  const result = spawnSync(
    'pnpm',
    ['--filter', 'permission-service', 'seed:apply', '--', '--apply'],
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

// Rebuilds tenant, org, account, and employee binding facts in identity-service for the manual tenant entry flows.
async function seedIdentity(identity) {
  await identity.$transaction(async (tx) => {
    const staleUsers = await tx.user.findMany({
      where: {
        OR: [
          { id: { in: MANAGED_USER_IDS } },
          { username: { in: SEEDED_USER_IDENTIFIERS.usernames } },
          { email: { in: SEEDED_USER_IDENTIFIERS.emails } },
          { phone: { in: SEEDED_USER_IDENTIFIERS.phones } },
        ],
      },
      select: { id: true },
    });
    const staleUserIds = staleUsers.map((user) => user.id);

    if (tx.userAccountOrgMembership) {
      await tx.userAccountOrgMembership.deleteMany({});
    }
    if (tx.userAccountEmployeeBinding) {
      await tx.userAccountEmployeeBinding.deleteMany({});
    }
    if (tx.accountContactAsset) {
      await tx.accountContactAsset.deleteMany({});
    }
    await tx.userAccount.deleteMany({
      where: {
        OR: [
          { scopeLevel: UserAccountScopeLevel.TENANT },
          { id: { in: SYSTEM_ACCOUNT_IDS } },
          staleUserIds.length > 0 ? { userId: { in: staleUserIds } } : undefined,
        ].filter(Boolean),
      },
    });
    if (tx.org) {
      await tx.org.deleteMany({});
    }
    if (tx.tenant) {
      await tx.tenant.deleteMany({});
    }
    await tx.user.deleteMany({
      where: {
        id: { in: staleUserIds },
      },
    });

    if (tx.tenant) {
      await tx.tenant.createMany({
        data: SEEDED_IDENTITY_TENANTS,
      });
    }

    if (tx.org) {
      await tx.org.createMany({
        data: SEEDED_IDENTITY_ORGS.map((org) => ({
          id: org.id,
          tenantId: org.tenantId,
          parentId: org.parentId,
          name: org.name,
          code: org.code,
          type: OrgType[org.type],
          order: org.order,
          createdBy: 'seed:tenant-web-auth',
        })),
      });
    }

    await tx.user.createMany({
      data: SEEDED_USERS_DATA,
    });

    await tx.userAccount.createMany({
      data: SEEDED_ACCOUNTS.map((account) => ({
        id: account.id,
        avatarUrl: account.avatarUrl,
        contextKey: account.contextKey,
        displayName: account.displayName,
        isEnable: true,
        scopeLevel: UserAccountScopeLevel[account.scopeLevel],
        tenantId: account.tenantId,
        userId: account.userId,
      })),
    });

    if (tx.accountContactAsset && SEEDED_CONTACT_ASSETS.length > 0) {
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

    if (tx.userAccountEmployeeBinding && SEEDED_EMPLOYEE_BINDINGS.length > 0) {
      await tx.userAccountEmployeeBinding.createMany({
        data: SEEDED_EMPLOYEE_BINDINGS,
      });
    }

    if (tx.userAccountOrgMembership && SEEDED_IDENTITY_ORG_MEMBERSHIPS.length > 0) {
      await tx.userAccountOrgMembership.createMany({
        data: SEEDED_IDENTITY_ORG_MEMBERSHIPS.map((membership) => ({
          id: membership.id,
          accountId: membership.accountId,
          orgId: membership.orgId,
          relationType: AccountOrgRelationType[membership.relationType],
          isPrimary: membership.isPrimary,
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

    await tx.terminalLoginPolicy.upsert({
      where: { terminal: PDA_LOGIN_SMOKE_SEED.terminalLoginPolicy.terminal },
      update: {
        enabledLoginFlows: PDA_LOGIN_SMOKE_SEED.terminalLoginPolicy.enabledLoginFlows,
        updatedBy: 'seed:pda-login-smoke',
      },
      create: {
        terminal: PDA_LOGIN_SMOKE_SEED.terminalLoginPolicy.terminal,
        enabledLoginFlows: PDA_LOGIN_SMOKE_SEED.terminalLoginPolicy.enabledLoginFlows,
        updatedBy: 'seed:pda-login-smoke',
      },
    });

    await tx.tenantTerminalMfaPolicy.upsert({
      where: {
        tenantId_terminal: {
          tenantId: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.tenantId,
          terminal: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.terminal,
        },
      },
      update: {
        loginMfaRequired: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.loginMfaRequired,
        newDeviceMfaRequired: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.newDeviceMfaRequired,
        allowedFactors: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.allowedFactors,
        factorPriority: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.factorPriority,
        updatedBy: 'seed:pda-login-smoke',
      },
      create: {
        tenantId: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.tenantId,
        terminal: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.terminal,
        loginMfaRequired: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.loginMfaRequired,
        newDeviceMfaRequired: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.newDeviceMfaRequired,
        allowedFactors: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.allowedFactors,
        factorPriority: PDA_LOGIN_SMOKE_SEED.tenantTerminalMfaPolicy.factorPriority,
        updatedBy: 'seed:pda-login-smoke',
      },
    });

    await tx.terminalLoginPolicy.upsert({
      where: { terminal: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.terminalLoginPolicy.terminal },
      update: {
        enabledLoginFlows: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.terminalLoginPolicy.enabledLoginFlows,
        updatedBy: 'seed:browser-extension-designer-demo',
      },
      create: {
        terminal: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.terminalLoginPolicy.terminal,
        enabledLoginFlows: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.terminalLoginPolicy.enabledLoginFlows,
        updatedBy: 'seed:browser-extension-designer-demo',
      },
    });

    await tx.tenantTerminalMfaPolicy.upsert({
      where: {
        tenantId_terminal: {
          tenantId: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.tenantId,
          terminal: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.terminal,
        },
      },
      update: {
        loginMfaRequired: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.loginMfaRequired,
        newDeviceMfaRequired: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.newDeviceMfaRequired,
        allowedFactors: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.allowedFactors,
        factorPriority: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.factorPriority,
        updatedBy: 'seed:browser-extension-designer-demo',
      },
      create: {
        tenantId: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.tenantId,
        terminal: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.terminal,
        loginMfaRequired: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.loginMfaRequired,
        newDeviceMfaRequired: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.newDeviceMfaRequired,
        allowedFactors: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.allowedFactors,
        factorPriority: BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantTerminalMfaPolicy.factorPriority,
        updatedBy: 'seed:browser-extension-designer-demo',
      },
    });
  });
}

// Rebuilds tenant-scoped role instances and bindings while leaving system/template roles to the permission foundation.
async function seedPermission(permission) {
  await permission.$transaction(async (tx) => {
    const systemAdminRole = await tx.role.findFirst({
      where: {
        code: 'system.admin',
        kind: RoleKind.SYSTEM_INSTANCE,
        scopeKey: '__SYSTEM__',
      },
      select: { id: true },
    });

    if (!systemAdminRole) {
      throw new Error('Missing system.admin role. Run permission foundation seed before tenant-web seed.');
    }

    const existingTenantRoleIds = (
      await tx.role.findMany({
        where: {
          kind: RoleKind.TENANT_INSTANCE,
        },
        select: { id: true },
      })
    ).map((role) => role.id);

    await tx.onboardingGrantRequest.deleteMany({});
    await tx.accountRole.deleteMany({
      where: {
        OR: [
          { scopeLevel: ScopeLevel.TENANT },
          existingTenantRoleIds.length > 0 ? { roleId: { in: existingTenantRoleIds } } : undefined,
        ].filter(Boolean),
      },
    });
    if (existingTenantRoleIds.length > 0) {
      await tx.rolePermission.deleteMany({ where: { roleId: { in: existingTenantRoleIds } } });
      await tx.roleTerminalAccess.deleteMany({ where: { roleId: { in: existingTenantRoleIds } } });
      await tx.roleNavigationVisibility.deleteMany({ where: { roleId: { in: existingTenantRoleIds } } });
      await tx.roleLandingPolicy.deleteMany({ where: { roleId: { in: existingTenantRoleIds } } });
      await tx.role.deleteMany({ where: { id: { in: existingTenantRoleIds } } });
    }

    for (const role of SEEDED_TENANT_ROLES) {
      await tx.role.create({
        data: {
          id: role.id,
          code: role.code,
          description: role.description,
          allowTenantPermissionOverride: role.allowTenantPermissionOverride,
          isEnabled: role.isEnabled,
          isProtected: role.isProtected,
          kind: RoleKind[role.kind],
          name: role.name,
          scopeKey: role.scopeKey,
          templateRoleId: role.templateRoleId,
          tenantId: role.tenantId,
        },
      });
    }

    const tenantPermissionCodes = [
      ...new Set(
        SEEDED_TENANT_ROLES.flatMap((role) =>
          SEEDED_TENANT_ROLE_PERMISSION_CODES.get(role.code) ?? []
        ),
      ),
    ];

    if (tenantPermissionCodes.length > 0) {
      const permissionsByCode = new Map(
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
      );

      const missingTenantPermissionCodes = tenantPermissionCodes.filter(
        (code) => !permissionsByCode.has(code),
      );

      if (missingTenantPermissionCodes.length > 0) {
        throw new Error(
          `Missing seeded tenant role permissions: ${missingTenantPermissionCodes.join(', ')}`
        );
      }

      await tx.rolePermission.createMany({
        data: SEEDED_TENANT_ROLES.flatMap((role) =>
          (SEEDED_TENANT_ROLE_PERMISSION_CODES.get(role.code) ?? []).map((permissionCode) => ({
            roleId: role.id,
            permissionId: permissionsByCode.get(permissionCode),
          }))
        ),
      });
    }

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

    if (SYSTEM_ACCOUNT_IDS.length > 0) {
      await tx.accountRole.createMany({
        data: SYSTEM_ACCOUNT_IDS.map((accountId) => ({
          accountId,
          accountType: AccountType.USER,
          effectiveAt: null,
          expiresAt: null,
          roleId: systemAdminRole.id,
          scopeLevel: ScopeLevel.SYSTEM,
          tenantId: null,
        })),
        skipDuplicates: true,
      });
    }
  });
}

// Ensures the local PDA smoke account can log in only after the device is enrolled to its tenant.
async function seedPdaLoginSmokeAccess(permission) {
  const smoke = PDA_LOGIN_SMOKE_SEED;
  await permission.$transaction(async (tx) => {
    const navigationEntry = await tx.navigationEntry.findUnique({
      where: { entryKey: smoke.roleNavigationVisibility.entryKey },
      select: { entryKey: true },
    });
    if (!navigationEntry) {
      throw new Error('Missing pda.home navigation entry. Run permission foundation seed first.');
    }

    const navigationRole = await tx.role.findUnique({
      where: { id: smoke.roleNavigationVisibility.roleId },
      select: { id: true },
    });
    if (!navigationRole) {
      throw new Error('Missing PDA smoke navigation role. Run tenant-web seed roles first.');
    }

    await tx.accountTerminalAccessOverride.deleteMany({
      where: {
        accountId: smoke.accountTerminalAccessOverride.accountId,
        scopeLevel: ScopeLevel[smoke.accountTerminalAccessOverride.scopeLevel],
        tenantId: smoke.accountTerminalAccessOverride.tenantId,
      },
    });
    await tx.accountTerminalAccessOverride.create({
      data: {
        accountId: smoke.accountTerminalAccessOverride.accountId,
        scopeLevel: ScopeLevel[smoke.accountTerminalAccessOverride.scopeLevel],
        tenantId: smoke.accountTerminalAccessOverride.tenantId,
        allowedTerminals: smoke.accountTerminalAccessOverride.allowedTerminals,
      },
    });

    await tx.roleNavigationVisibility.upsert({
      where: {
        roleId_entryKey_terminal: {
          roleId: smoke.roleNavigationVisibility.roleId,
          entryKey: smoke.roleNavigationVisibility.entryKey,
          terminal: smoke.roleNavigationVisibility.terminal,
        },
      },
      update: {
        enabled: smoke.roleNavigationVisibility.enabled,
      },
      create: smoke.roleNavigationVisibility,
    });

    await tx.roleLandingPolicy.upsert({
      where: {
        roleId_terminal_defaultEntryKey: {
          roleId: smoke.roleLandingPolicy.roleId,
          terminal: smoke.roleLandingPolicy.terminal,
          defaultEntryKey: smoke.roleLandingPolicy.defaultEntryKey,
        },
      },
      update: {
        priority: smoke.roleLandingPolicy.priority,
        enabled: smoke.roleLandingPolicy.enabled,
      },
      create: smoke.roleLandingPolicy,
    });
  });
}

// Ensures the local browser-extension designer demo account can enter only the plugin workspace.
async function seedBrowserExtensionDesignerDemoAccess(permission) {
  const demo = BROWSER_EXTENSION_DESIGNER_DEMO_SEED;
  await permission.$transaction(async (tx) => {
    const navigationEntry = await tx.navigationEntry.findUnique({
      where: { entryKey: demo.roleNavigationVisibility.entryKey },
      select: { entryKey: true },
    });
    if (!navigationEntry) {
      throw new Error('Missing extension.designer.workspace navigation entry. Run permission foundation seed first.');
    }

    const navigationRole = await tx.role.findUnique({
      where: { id: demo.roleNavigationVisibility.roleId },
      select: { id: true },
    });
    if (!navigationRole) {
      throw new Error('Missing browser-extension designer role. Run tenant-web seed roles first.');
    }

    await tx.accountTerminalAccessOverride.deleteMany({
      where: {
        accountId: demo.accountTerminalAccessOverride.accountId,
        scopeLevel: ScopeLevel[demo.accountTerminalAccessOverride.scopeLevel],
        tenantId: demo.accountTerminalAccessOverride.tenantId,
      },
    });
    await tx.accountTerminalAccessOverride.create({
      data: {
        accountId: demo.accountTerminalAccessOverride.accountId,
        scopeLevel: ScopeLevel[demo.accountTerminalAccessOverride.scopeLevel],
        tenantId: demo.accountTerminalAccessOverride.tenantId,
        allowedTerminals: demo.accountTerminalAccessOverride.allowedTerminals,
      },
    });

    await tx.roleTerminalAccess.upsert({
      where: { roleId: demo.roleTerminalAccess.roleId },
      update: {
        allowedTerminals: demo.roleTerminalAccess.allowedTerminals,
      },
      create: demo.roleTerminalAccess,
    });

    await tx.roleNavigationVisibility.upsert({
      where: {
        roleId_entryKey_terminal: {
          roleId: demo.roleNavigationVisibility.roleId,
          entryKey: demo.roleNavigationVisibility.entryKey,
          terminal: demo.roleNavigationVisibility.terminal,
        },
      },
      update: {
        enabled: demo.roleNavigationVisibility.enabled,
      },
      create: demo.roleNavigationVisibility,
    });

    await tx.roleLandingPolicy.upsert({
      where: {
        roleId_terminal_defaultEntryKey: {
          roleId: demo.roleLandingPolicy.roleId,
          terminal: demo.roleLandingPolicy.terminal,
          defaultEntryKey: demo.roleLandingPolicy.defaultEntryKey,
        },
      },
      update: {
        priority: demo.roleLandingPolicy.priority,
        enabled: demo.roleLandingPolicy.enabled,
      },
      create: demo.roleLandingPolicy,
    });
  });
}

// Rebuilds tenant and org-unit truth in tenant-org-service for the organization workspace tree.
async function seedTenantOrg(tenantOrg) {
  await tenantOrg.$transaction(async (tx) => {
    await tx.orgUnit.deleteMany({});
    await tx.tenant.deleteMany({});

    await tx.tenant.createMany({
      data: SEEDED_TENANT_ORG_TENANTS.map((tenant) => ({
        id: tenant.id,
        code: tenant.code,
        employeeCodePrefix: tenant.employeeCodePrefix,
        name: tenant.name,
        rootOrgId: tenant.rootOrgId,
        status: TenantStatus[tenant.status],
      })),
    });

    await tx.orgUnit.createMany({
      data: SEEDED_TENANT_ORG_UNITS.map((orgUnit) => ({
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
      })),
    });
  });
}

// Rebuilds party-service person, organization, and tenant-party facts so names come from the proper owner.
async function seedParty(party) {
  await party.$transaction(async (tx) => {
    await tx.partyRelationship.deleteMany({});
    await tx.partyRegistrationIdempotency.deleteMany({});
    await tx.partyIdentifier.deleteMany({});
    await tx.tenantParty.deleteMany({});
    await tx.personParty.deleteMany({});
    await tx.organizationParty.deleteMany({});
    await tx.party.deleteMany({});

    await tx.party.createMany({
      data: SEEDED_PARTIES.map((seed) => ({
        id: seed.id,
        type: PartyType[seed.type],
        status: PartyStatus[seed.status],
        legalName: seed.legalName ?? seed.canonicalName ?? seed.displayName,
      })),
    });

    await tx.organizationParty.createMany({
      data: SEEDED_ORGANIZATION_PARTIES.map(({ legalName: _legalName, ...seed }) => seed),
    });

    await tx.personParty.createMany({
      data: SEEDED_PERSON_PARTIES.map(({ legalName: _legalName, ...seed }) => seed),
    });

    await tx.tenantParty.createMany({
      data: SEEDED_TENANT_PARTIES.map((seed) => ({
        id: seed.id,
        tenantId: seed.tenantId,
        partyId: seed.partyId,
        localDisplayName: seed.localDisplayName,
        localCode: seed.localCode,
        tags: seed.tags,
        status: TenantPartyStatus[seed.status],
      })),
    });
  });
}

// Rebuilds employee, employment, and onboarding-access truth in hr-service for member testing scenarios.
async function seedHr(hr) {
  await hr.$transaction(async (tx) => {
    await tx.employeeOnboardingAccess.deleteMany({});
    await tx.employment.deleteMany({});
    await tx.employee.deleteMany({});

    await tx.employee.createMany({
      data: SEEDED_EMPLOYEES.map((employee) => ({
        id: employee.id,
        tenantId: employee.tenantId,
        tenantPartyId: employee.tenantPartyId,
        partyId: employee.partyId,
        employeeCode: employee.employeeCode,
        lifecycleStatus: EmployeeLifecycleStatus[employee.lifecycleStatus],
      })),
    });

    await tx.employment.createMany({
      data: SEEDED_EMPLOYMENTS.map((employment) => ({
        id: employment.id,
        tenantId: employment.tenantId,
        employeeId: employment.employeeId,
        orgUnitId: employment.orgUnitId,
        status: EmploymentStatus[employment.status],
        effectiveFrom: employment.effectiveFrom,
        effectiveTo: employment.effectiveTo,
        endedReason: employment.endedReason,
        positionName: employment.positionName,
        activeSlot: employment.activeSlot,
      })),
    });

    if (SEEDED_ONBOARDING_ACCESSES.length > 0) {
      await tx.employeeOnboardingAccess.createMany({
        data: SEEDED_ONBOARDING_ACCESSES.map((access) => ({
          id: access.id,
          tenantId: access.tenantId,
          employeeId: access.employeeId,
          employmentId: access.employmentId,
          accountId: access.accountId,
          status: OnboardingAccessStatus[access.status],
          grantIdempotencyKey: access.grantIdempotencyKey,
          failureReason: access.failureReason,
        })),
      });
    }
  });
}

// Prints a compact summary so local operators can immediately see which tenants and credentials were rebuilt.
function printSummary() {
  const summary = buildSeedSummary();
  console.log('Seeded tenant-web org/people test data successfully.');
  console.log(`Tenants: ${summary.tenants.join(' / ')}`);
  console.log(`Org units: ${summary.orgUnitCount}`);
  console.log(`Employees: ${summary.employeeCount}`);
  console.log(`Lifecycle coverage: ${summary.lifecycleCoverage.join(', ')}`);
  console.log(`Access coverage: ${summary.accessCoverage.join(', ')}`);
  console.log(`Login users: ${summary.loginUsers.join(' ; ')}`);
  console.log(
    `PDA smoke login: ${PDA_LOGIN_SMOKE_SEED.identifier} / tenant ${PDA_LOGIN_SMOKE_SEED.tenantId}`
  );
  console.log(
    `Browser extension designer demo: ${BROWSER_EXTENSION_DESIGNER_DEMO_SEED.identifier} / tenant ${BROWSER_EXTENSION_DESIGNER_DEMO_SEED.tenantId}`
  );
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
  const party = new PartyPrismaClient({
    datasources: {
      db: { url: PARTY_DB_URL },
    },
  });
  const hr = new HrPrismaClient({
    datasources: {
      db: { url: HR_DB_URL },
    },
  });

  try {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    await seedParty(party);
    await seedTenantOrg(tenantOrg);
    await seedHr(hr);
    await seedIdentity(identity);
    await seedAuth(auth, passwordHash);
    syncPermissionFoundationForLocalSystemAccount();
    await seedPermission(permission);
    syncPermissionFoundationForLocalSystemAccount();
    await seedPdaLoginSmokeAccess(permission);
    await seedBrowserExtensionDesignerDemoAccess(permission);
    printSummary();
  } finally {
    await Promise.allSettled([
      identity.$disconnect(),
      auth.$disconnect(),
      permission.$disconnect(),
      tenantOrg.$disconnect(),
      party.$disconnect(),
      hr.$disconnect(),
    ]);
  }
}

main().catch((error) => {
  console.error('Failed to seed tenant-web org/people test data.');
  console.error(error);
  process.exitCode = 1;
});
