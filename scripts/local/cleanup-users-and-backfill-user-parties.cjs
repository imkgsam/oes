#!/usr/bin/env node

// This script removes the named demo users across identity/auth/permission stores and backfills person parties for every remaining user.
const { PrismaClient: IdentityPrisma } = require('../../src/services/system/identity-service/prisma/generated/prisma');
const { PrismaClient: AuthPrisma } = require('../../src/services/system/auth-service/prisma/generated/prisma');
const { PrismaClient: PermissionPrisma } = require('../../src/services/system/permission-service/prisma/generated/prisma');
const { PrismaClient: PartyPrisma } = require('../../src/services/system/party-service/prisma/generated/prisma');

const IDENTITY_URL = 'postgres://imkgsam:imkgsam@localhost:5432/identitydb';
const AUTH_URL = 'postgres://imkgsam:imkgsam@localhost:5432/authdb';
const PERMISSION_URL = 'postgres://imkgsam:imkgsam@localhost:5432/permissiondb';
const PARTY_URL = 'postgres://imkgsam:imkgsam@localhost:5432/partydb';
const TARGET_ACCOUNT_NAMES = ['是对方', '李卡卡', '陈楚銮1', '陈一'];

const identity = new IdentityPrisma({ datasources: { db: { url: IDENTITY_URL } } });
const auth = new AuthPrisma({ datasources: { db: { url: AUTH_URL } } });
const permission = new PermissionPrisma({ datasources: { db: { url: PERMISSION_URL } } });
const party = new PartyPrisma({ datasources: { db: { url: PARTY_URL } } });

async function main() {
  const targets = await loadTargetUsers();
  await deleteTargetUsers(targets);
  const backfillSummary = await backfillRemainingUsers();

  console.log(
    JSON.stringify(
      {
        deletedUsers: targets.map((target) => ({
          userId: target.user.id,
          accountIds: target.accounts.map((account) => account.id),
          matchedAccountNames: target.accounts.map((account) => account.displayName),
        })),
        backfillSummary,
      },
      null,
      2,
    ),
  );
}

// Loads the exact user/account sets that must be removed and fails fast if any requested name is missing.
async function loadTargetUsers() {
  const users = await identity.user.findMany({
    include: {
      userAccounts: {
        include: {
          contactAssets: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const matches = users
    .map((user) => ({
      user,
      accounts: user.userAccounts.filter((account) => TARGET_ACCOUNT_NAMES.includes(account.displayName || '')),
    }))
    .filter((item) => item.accounts.length > 0);

  const matchedNames = new Set(
    matches.flatMap((item) => item.accounts.map((account) => account.displayName).filter(Boolean)),
  );

  const missing = TARGET_ACCOUNT_NAMES.filter((name) => !matchedNames.has(name));
  if (missing.length > 0) {
    throw new Error(`Missing target accounts: ${missing.join(', ')}`);
  }

  return matches;
}

// Deletes one user's auth state, permission bindings, account rows, and the owning user record as one coordinated cleanup.
async function deleteTargetUsers(targets) {
  const userIds = targets.map((target) => target.user.id);
  const accountIds = targets.flatMap((target) => target.user.userAccounts.map((account) => account.id));

  const loginMethods = await auth.loginMethod.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true },
  });
  const loginMethodIds = loginMethods.map((item) => item.id);

  await permission.$transaction([
    permission.accountRole.deleteMany({ where: { accountId: { in: accountIds } } }),
    permission.policy.deleteMany({
      where: {
        subjectType: 'ACCOUNT',
        subjectId: { in: accountIds },
      },
    }),
  ]);

  await auth.$transaction([
    auth.passwordRecoveryGrant.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          ...(loginMethodIds.length > 0 ? [{ loginMethodId: { in: loginMethodIds } }] : []),
        ],
      },
    }),
    auth.userSession.deleteMany({ where: { userId: { in: userIds } } }),
    auth.mfaBinding.deleteMany({ where: { userId: { in: userIds } } }),
    auth.passwordSetupRequirement.deleteMany({ where: { userId: { in: userIds } } }),
    auth.credential.deleteMany({
      where: loginMethodIds.length > 0 ? { loginMethodId: { in: loginMethodIds } } : { id: { in: [] } },
    }),
    auth.loginMethod.deleteMany({ where: { userId: { in: userIds } } }),
  ]);

  await identity.$transaction([
    identity.accountContactAsset.deleteMany({ where: { accountId: { in: accountIds } } }),
    identity.userAccount.deleteMany({ where: { id: { in: accountIds } } }),
    identity.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);
}

// Creates a person party for every remaining user that has not yet been linked and binds tenant accounts back to tenant-party rows.
async function backfillRemainingUsers() {
  const remainingUsers = await identity.user.findMany({
    include: {
      userAccounts: {
        include: {
          Tenant: true,
        },
        orderBy: [{ scopeLevel: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let createdPartyCount = 0;
  let createdTenantPartyCount = 0;
  let linkedUserCount = 0;

  for (const user of remainingUsers) {
    if (user.partyId) {
      continue;
    }

    const legalName = resolveLegalName(user);
    const createdParty = await party.party.create({
      data: {
        type: 'PERSON',
        status: 'ACTIVE',
        legalName,
        personParty: {
          create: {
            preferredName: legalName,
          },
        },
      },
    });

    createdPartyCount += 1;

    const tenantBindings = collectTenantBindings(user.userAccounts);
    for (const binding of tenantBindings) {
      await party.tenantParty.create({
        data: {
          tenantId: binding.tenantId,
          partyId: createdParty.id,
          localDisplayName: binding.localDisplayName,
          localCode: null,
          status: 'ACTIVE',
        },
      });
      createdTenantPartyCount += 1;
    }

    await identity.user.update({
      where: { id: user.id },
      data: { partyId: createdParty.id },
    });
    linkedUserCount += 1;
  }

  return {
    remainingUserCount: remainingUsers.length,
    linkedUserCount,
    createdPartyCount,
    createdTenantPartyCount,
  };
}

// Picks the least-wrong current human-readable name source until UI and creation flows stop conflating usernames and account display names.
function resolveLegalName(user) {
  const accountDisplayName = user.userAccounts
    .map((account) => normalize(account.displayName))
    .find(Boolean);
  return (
    accountDisplayName
    || normalize(user.username)
    || normalize(user.email)
    || normalize(user.phone)
    || `user-${user.id}`
  );
}

// Collapses multi-account tenant rows into one tenant-party binding per tenant while preserving the first available local display name.
function collectTenantBindings(accounts) {
  const tenantBindings = new Map();
  for (const account of accounts) {
    if (!account.tenantId) {
      continue;
    }

    if (!tenantBindings.has(account.tenantId)) {
      tenantBindings.set(account.tenantId, {
        tenantId: account.tenantId,
        localDisplayName: normalize(account.displayName) || undefined,
      });
    }
  }

  return [...tenantBindings.values()];
}

function normalize(value) {
  const normalized = value?.trim();
  return normalized || '';
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await identity.$disconnect();
    await auth.$disconnect();
    await permission.$disconnect();
    await party.$disconnect();
  });
