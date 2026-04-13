import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const {
  PrismaClient: IdentityPrismaClient,
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
const bcrypt = require(path.join(
  ROOT,
  'src/services/system/auth-service/node_modules/bcrypt',
));

const AUTH_DB_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/authdb';
const IDENTITY_DB_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/identitydb';
const PERMISSION_DB_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/permissiondb';
const PASSWORD_PLAIN = 'Passw0rd!123';
const OTP_CODE = '123456';

const TEST_IDS = {
  userId: '7df29e8e-f2f4-4ca3-8c17-bfe3bba0f111',
  tenantAId: 'ea06d4a0-6990-4ba0-ae13-fb31485c2001',
  tenantBId: '1c1f7e79-e3d7-476e-9e85-3270d7f52002',
  accountAId: 'cb3f1d5d-1406-4fb0-8d53-75a144093001',
  accountBId: '3d1545a0-2f9f-4130-89ea-0e0bd8e45002',
  accountSystemId: '911a28e9-0d30-4dc8-a391-60bed62f5003',
};

const TEST_USER = {
  email: 'ui.tester@oes.local',
  phone: '+8613800000001',
  username: 'ui.tester',
  displayNameA: 'UI Tester @ OES Manufacturing',
  displayNameB: 'UI Tester @ OES Trading',
  displayNameSystem: 'UI Tester @ OES Platform',
  tenantAName: 'OES Manufacturing Demo',
  tenantBName: 'OES Trading Demo',
  tenantACode: 'oes-manufacturing-demo',
  tenantBCode: 'oes-trading-demo',
};

// Runs the permission-service foundation seed and binds the local system account to system.admin.
function syncPermissionFoundationForLocalSystemAccount() {
  const result = spawnSync(
    'pnpm',
    ['--filter', 'permission-service', 'permission-codes:sync'],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        DATABASE_URL: PERMISSION_DB_URL,
        OES_SYSTEM_ADMIN_ACCOUNT_IDS: TEST_IDS.accountSystemId,
      },
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    throw new Error(`permission foundation sync failed with status ${result.status}`);
  }
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

  try {
    const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

    await identity.$transaction(async (tx) => {
      await tx.tenant.upsert({
        where: { code: TEST_USER.tenantACode },
        update: {
          entityId: `entity:${TEST_IDS.tenantAId}`,
          isActive: true,
          name: TEST_USER.tenantAName,
        },
        create: {
          id: TEST_IDS.tenantAId,
          entityId: `entity:${TEST_IDS.tenantAId}`,
          code: TEST_USER.tenantACode,
          isActive: true,
          name: TEST_USER.tenantAName,
        },
      });

      await tx.tenant.upsert({
        where: { code: TEST_USER.tenantBCode },
        update: {
          entityId: `entity:${TEST_IDS.tenantBId}`,
          isActive: true,
          name: TEST_USER.tenantBName,
        },
        create: {
          id: TEST_IDS.tenantBId,
          entityId: `entity:${TEST_IDS.tenantBId}`,
          code: TEST_USER.tenantBCode,
          isActive: true,
          name: TEST_USER.tenantBName,
        },
      });

      await tx.user.upsert({
        where: { email: TEST_USER.email },
        update: {
          entityId: `entity:${TEST_IDS.userId}`,
          isActive: true,
          phone: TEST_USER.phone,
          username: TEST_USER.username,
        },
        create: {
          id: TEST_IDS.userId,
          entityId: `entity:${TEST_IDS.userId}`,
          email: TEST_USER.email,
          isActive: true,
          phone: TEST_USER.phone,
          username: TEST_USER.username,
        },
      });

      await tx.userAccount.upsert({
        where: {
          userId_scopeLevel_contextKey: {
            contextKey: TEST_IDS.tenantAId,
            scopeLevel: 'TENANT',
            userId: TEST_IDS.userId,
          },
        },
        update: {
          avatarUrl: null,
          contextKey: TEST_IDS.tenantAId,
          displayName: TEST_USER.displayNameA,
          isEnable: true,
          scopeLevel: 'TENANT',
        },
        create: {
          id: TEST_IDS.accountAId,
          contextKey: TEST_IDS.tenantAId,
          scopeLevel: 'TENANT',
          tenantId: TEST_IDS.tenantAId,
          userId: TEST_IDS.userId,
          avatarUrl: null,
          displayName: TEST_USER.displayNameA,
          isEnable: true,
        },
      });

      await tx.userAccount.upsert({
        where: {
          userId_scopeLevel_contextKey: {
            contextKey: TEST_IDS.tenantBId,
            scopeLevel: 'TENANT',
            userId: TEST_IDS.userId,
          },
        },
        update: {
          avatarUrl: null,
          contextKey: TEST_IDS.tenantBId,
          displayName: TEST_USER.displayNameB,
          isEnable: true,
          scopeLevel: 'TENANT',
        },
        create: {
          id: TEST_IDS.accountBId,
          contextKey: TEST_IDS.tenantBId,
          scopeLevel: 'TENANT',
          tenantId: TEST_IDS.tenantBId,
          userId: TEST_IDS.userId,
          avatarUrl: null,
          displayName: TEST_USER.displayNameB,
          isEnable: true,
        },
      });

      await tx.userAccount.upsert({
        where: {
          userId_scopeLevel_contextKey: {
            contextKey: 'SYSTEM',
            scopeLevel: 'SYSTEM',
            userId: TEST_IDS.userId,
          },
        },
        update: {
          avatarUrl: null,
          contextKey: 'SYSTEM',
          displayName: TEST_USER.displayNameSystem,
          isEnable: true,
          scopeLevel: 'SYSTEM',
          tenantId: null,
        },
        create: {
          id: TEST_IDS.accountSystemId,
          contextKey: 'SYSTEM',
          scopeLevel: 'SYSTEM',
          tenantId: null,
          userId: TEST_IDS.userId,
          avatarUrl: null,
          displayName: TEST_USER.displayNameSystem,
          isEnable: true,
        },
      });
    });

    await auth.$transaction(async (tx) => {
      const emailMethod = await tx.loginMethod.upsert({
        where: {
          type_identifier: {
            type: LoginMethodType.EMAIL,
            identifier: TEST_USER.email,
          },
        },
        update: {
          enabled: true,
          userId: TEST_IDS.userId,
          verified: true,
        },
        create: {
          userId: TEST_IDS.userId,
          type: LoginMethodType.EMAIL,
          identifier: TEST_USER.email,
          verified: true,
          enabled: true,
        },
      });

      const phoneMethod = await tx.loginMethod.upsert({
        where: {
          type_identifier: {
            type: LoginMethodType.PHONE,
            identifier: TEST_USER.phone,
          },
        },
        update: {
          enabled: true,
          userId: TEST_IDS.userId,
          verified: true,
        },
        create: {
          userId: TEST_IDS.userId,
          type: LoginMethodType.PHONE,
          identifier: TEST_USER.phone,
          verified: true,
          enabled: true,
        },
      });

      await tx.credential.deleteMany({
        where: {
          loginMethodId: {
            in: [emailMethod.id, phoneMethod.id],
          },
        },
      });

      await tx.credential.createMany({
        data: [
          {
            loginMethodId: emailMethod.id,
            credentialType: CredentialType.PASSWORD,
            hashedValue: passwordHash,
            enabled: true,
          },
          {
            loginMethodId: phoneMethod.id,
            credentialType: CredentialType.PASSWORD,
            hashedValue: passwordHash,
            enabled: true,
          },
        ],
      });

      await tx.oTP.upsert({
        where: {
          identifier_usage: {
            identifier: TEST_USER.email,
            usage: OTPUsage.LOGIN,
          },
        },
        update: {
          hashedValue: OTP_CODE,
          consumed: false,
          attemptCount: 0,
          maxAttempt: 3,
          valid: true,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastSentAt: new Date(),
        },
        create: {
          id: 'a50f3c62-5d45-4518-87ab-52f2fd67e101',
          identifier: TEST_USER.email,
          usage: OTPUsage.LOGIN,
          hashedValue: OTP_CODE,
          consumed: false,
          attemptCount: 0,
          maxAttempt: 3,
          valid: true,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastSentAt: new Date(),
        },
      });

      await tx.oTP.upsert({
        where: {
          identifier_usage: {
            identifier: TEST_USER.phone,
            usage: OTPUsage.LOGIN,
          },
        },
        update: {
          hashedValue: OTP_CODE,
          consumed: false,
          attemptCount: 0,
          maxAttempt: 3,
          valid: true,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastSentAt: new Date(),
        },
        create: {
          id: 'bfcb87d8-f8fc-468a-8a5e-f432e38aa102',
          identifier: TEST_USER.phone,
          usage: OTPUsage.LOGIN,
          hashedValue: OTP_CODE,
          consumed: false,
          attemptCount: 0,
          maxAttempt: 3,
          valid: true,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastSentAt: new Date(),
        },
      });
    });

    syncPermissionFoundationForLocalSystemAccount();

    console.log('Seeded tenant-web auth test data successfully.');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Phone: ${TEST_USER.phone}`);
    console.log(`Password: ${PASSWORD_PLAIN}`);
    console.log(`OTP: ${OTP_CODE}`);
  } finally {
    await Promise.allSettled([identity.$disconnect(), auth.$disconnect()]);
  }
}

main().catch((error) => {
  console.error('Failed to seed tenant-web auth test data.');
  console.error(error);
  process.exitCode = 1;
});
