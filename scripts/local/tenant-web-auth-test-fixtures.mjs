const COMPANY_1_ID = 'ea06d4a0-6990-4ba0-ae13-fb31485c2001';
const COMPANY_2_ID = '1c1f7e79-e3d7-476e-9e85-3270d7f52002';
const COMPANY_3_ID = '6c737f64-5a9c-4381-bd5d-c2c7ab2b3003';
const COMPANY_1_ROOT_ORG_ID = 'aa06d4a0-6990-4ba0-ae13-fb31485c2001';
const COMPANY_2_ROOT_ORG_ID = '2c1f7e79-e3d7-476e-9e85-3270d7f52002';
const COMPANY_3_ROOT_ORG_ID = '7c737f64-5a9c-4381-bd5d-c2c7ab2b3003';

const USER_1_ID = '7df29e8e-f2f4-4ca3-8c17-bfe3bba0f111';
const USER_2_ID = '93e0b3fa-9e86-4a8d-84f2-40a18bbf1002';
const USER_3_ID = '08b688f0-e8c8-4d58-9e97-f8a9d3941003';
const USER_4_ID = 'b769bb64-69de-4273-909f-61307a111004';

export const DEFAULT_PASSWORD = 'Passw0rd!123';
export const DEFAULT_OTP_CODE = '123456';
export const LEGACY_IDENTIFIERS = ['ui.tester@oes.local', '+8613800000001'];

// Builds a compact SVG avatar so each seeded demo user has a stable visual identity.
function buildSeedAvatar({ accent, label, textColor = '#ffffff' }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="48" fill="${accent}" />
      <circle cx="80" cy="62" r="30" fill="rgba(255,255,255,0.22)" />
      <path d="M32 136c8-27 28-42 48-42s40 15 48 42" fill="rgba(255,255,255,0.22)" />
      <text x="80" y="144" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="${textColor}">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Defines the realistic local tenant fixtures used by tenant-web auth demos and local integration checks.
export const SEEDED_COMPANIES = [
  {
    key: 'company-1',
    id: COMPANY_1_ID,
    code: 'meilong-ceramics',
    domain: 'meilong-ceramics.com',
    name: '潮州市美隆陶瓷实业有限公司',
    rootOrgId: COMPANY_1_ROOT_ORG_ID,
    rootOrgName: '潮州市美隆陶瓷实业有限公司',
  },
  {
    key: 'company-2',
    id: COMPANY_2_ID,
    code: 'dawu-tech',
    domain: 'dawu-tech.com',
    name: '潮州市达屋科技有限公司',
    rootOrgId: COMPANY_2_ROOT_ORG_ID,
    rootOrgName: '潮州市达屋科技有限公司',
  },
  {
    key: 'company-3',
    id: COMPANY_3_ID,
    code: 'wooyun',
    domain: 'wooyun.com',
    name: '深圳市乌云科技有限公司',
    rootOrgId: COMPANY_3_ROOT_ORG_ID,
    rootOrgName: '深圳市乌云科技有限公司',
  },
];

const companyByKey = new Map(SEEDED_COMPANIES.map((company) => [company.key, company]));

// Captures the managed user identities and their account contexts for the local auth seed.
export const SEEDED_USERS = [
  {
    key: 'user-1',
    id: USER_1_ID,
    personName: '陈双鹏',
    username: 'chen.shuangpeng',
    email: 'chen.shuangpeng@meilong-ceramics.com',
    phone: '+8613900000001',
    avatarUrl: buildSeedAvatar({
      accent: '#0f766e',
      label: 'SP',
    }),
    accounts: [
      {
        id: 'cb3f1d5d-1406-4fb0-8d53-75a144093001',
        scopeLevel: 'TENANT',
        companyKey: 'company-1',
        displayName: '陈双鹏',
        workEmail: 'chen.shuangpeng@meilong-ceramics.com',
      },
      {
        id: '3d1545a0-2f9f-4130-89ea-0e0bd8e45002',
        scopeLevel: 'TENANT',
        companyKey: 'company-3',
        displayName: '陈双鹏',
        workEmail: 'chen.shuangpeng@wooyun.com',
      },
      {
        id: '911a28e9-0d30-4dc8-a391-60bed62f5003',
        scopeLevel: 'SYSTEM',
        contextKey: 'SYSTEM',
        displayName: '陈双鹏',
      },
    ],
  },
  {
    key: 'user-2',
    id: USER_2_ID,
    personName: '詹佳妮',
    username: 'zhan.jiani',
    email: 'zhan.jiani@meilong-ceramics.com',
    phone: '+8613900000002',
    avatarUrl: buildSeedAvatar({
      accent: '#b45309',
      label: 'JN',
    }),
    accounts: [
      {
        id: '5e9774b0-cd66-4658-b2b8-74558ceab004',
        scopeLevel: 'TENANT',
        companyKey: 'company-1',
        displayName: '詹佳妮',
        workEmail: 'zhan.jiani@meilong-ceramics.com',
      },
    ],
  },
  {
    key: 'user-3',
    id: USER_3_ID,
    personName: '吴浩权',
    username: 'wu.haoquan',
    email: 'wu.haoquan@dawu-tech.com',
    phone: '+8613900000003',
    avatarUrl: buildSeedAvatar({
      accent: '#1d4ed8',
      label: 'HQ',
    }),
    accounts: [
      {
        id: '0ec31c5c-b3d3-461b-a6e8-e99d2abdd005',
        scopeLevel: 'TENANT',
        companyKey: 'company-2',
        displayName: '吴浩权',
        workEmail: 'wu.haoquan@dawu-tech.com',
      },
    ],
  },
  {
    key: 'user-4',
    id: USER_4_ID,
    personName: '陈双武',
    username: 'chen.shuangwu',
    email: 'chen.shuangwu@dawu-tech.com',
    phone: '+8613900000004',
    avatarUrl: buildSeedAvatar({
      accent: '#7c3aed',
      label: 'SW',
    }),
    accounts: [
      {
        id: '9894c123-0f4b-452e-812f-f7cc9eed6006',
        scopeLevel: 'TENANT',
        companyKey: 'company-2',
        displayName: '陈双武',
        workEmail: 'chen.shuangwu@dawu-tech.com',
      },
    ],
  },
];

// Declares the tenant role instances needed to reflect the requested user responsibilities.
export const SEEDED_TENANT_ROLES = [
  {
    id: '46be7eb3-cd06-48c7-bc7f-4e2c853c7001',
    companyKey: 'company-1',
    code: 'tenant.admin',
    name: '租户管理员',
    description: '本地联调用的租户管理员角色。',
  },
  {
    id: '46be7eb3-cd06-48c7-bc7f-4e2c853c7002',
    companyKey: 'company-1',
    code: 'foreign-trade.manager',
    name: '外贸主管',
    description: '本地联调用的外贸主管角色。',
  },
  {
    id: '46be7eb3-cd06-48c7-bc7f-4e2c853c7003',
    companyKey: 'company-1',
    code: 'foreign-trade.sales',
    name: '外贸业务员',
    description: '本地联调用的外贸业务员角色。',
  },
  {
    id: '46be7eb3-cd06-48c7-bc7f-4e2c853c7004',
    companyKey: 'company-2',
    code: 'domestic.sales',
    name: '国内业务员',
    description: '本地联调用的国内业务员角色。',
  },
  {
    id: '46be7eb3-cd06-48c7-bc7f-4e2c853c7005',
    companyKey: 'company-2',
    code: 'tenant.admin',
    name: '租户管理员',
    description: '本地联调用的租户管理员角色。',
  },
  {
    id: '46be7eb3-cd06-48c7-bc7f-4e2c853c7006',
    companyKey: 'company-3',
    code: 'cfo',
    name: 'CFO',
    description: '本地联调用的财务负责人角色。',
  },
];

// Declares which permission codes should be granted to the local tenant role instances.
export const SEEDED_TENANT_ROLE_PERMISSION_CODES = new Map([
  [
    'tenant.admin',
    [
      'auth.session.admin.view',
      'auth.session.admin.revoke',
      'auth.audit.list',
    ],
  ],
]);

const accountById = new Map(
  SEEDED_USERS.flatMap((user) =>
    user.accounts.map((account) => [
      account.id,
      {
        ...account,
        userId: user.id,
        personName: user.personName,
      },
    ]),
  ),
);

// Maps each managed account to the role instances that should be bound after seeding.
export const SEEDED_ROLE_BINDINGS = [
  {
    accountId: '911a28e9-0d30-4dc8-a391-60bed62f5003',
    roleCode: 'system.admin',
  },
  {
    accountId: 'cb3f1d5d-1406-4fb0-8d53-75a144093001',
    roleCode: 'tenant.admin',
    companyKey: 'company-1',
  },
  {
    accountId: 'cb3f1d5d-1406-4fb0-8d53-75a144093001',
    roleCode: 'foreign-trade.manager',
    companyKey: 'company-1',
  },
  {
    accountId: '5e9774b0-cd66-4658-b2b8-74558ceab004',
    roleCode: 'foreign-trade.sales',
    companyKey: 'company-1',
  },
  {
    accountId: '0ec31c5c-b3d3-461b-a6e8-e99d2abdd005',
    roleCode: 'domestic.sales',
    companyKey: 'company-2',
  },
  {
    accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
    roleCode: 'tenant.admin',
    companyKey: 'company-2',
  },
  {
    accountId: '3d1545a0-2f9f-4130-89ea-0e0bd8e45002',
    roleCode: 'cfo',
    companyKey: 'company-3',
  },
];

export const EXPECTED_ROLE_CODES = new Set([
  'system.admin',
  ...SEEDED_TENANT_ROLES.map((role) => role.code),
]);

export const MANAGED_USER_IDS = SEEDED_USERS.map((user) => user.id);
export const MANAGED_ACCOUNT_IDS = SEEDED_USERS.flatMap((user) =>
  user.accounts.map((account) => account.id),
);
export const SYSTEM_ACCOUNT_IDS = SEEDED_USERS.flatMap((user) =>
  user.accounts
    .filter((account) => account.scopeLevel === 'SYSTEM')
    .map((account) => account.id),
);

export const SEEDED_LOGIN_IDENTIFIERS = SEEDED_USERS.flatMap((user) => [
  user.email,
  user.phone,
]);

export const SEEDED_OTP_IDENTIFIERS = [
  ...new Set([...SEEDED_LOGIN_IDENTIFIERS, ...LEGACY_IDENTIFIERS]),
];

// Summarizes the requested role ownership per person for lightweight tests and CLI reporting.
export const SEEDED_USER_MEMBERSHIPS = new Map(
  SEEDED_USERS.map((user) => {
    const memberships = SEEDED_ROLE_BINDINGS.filter((binding) => {
      const account = accountById.get(binding.accountId);
      return account?.userId === user.id;
    }).map((binding) =>
      binding.companyKey ? `${binding.roleCode}@${binding.companyKey}` : binding.roleCode,
    );

    return [user.personName, memberships];
  }),
);

// Resolves the account rows expected by identity-service from the human-oriented fixture declarations.
export function buildSeedAccounts() {
  return SEEDED_USERS.flatMap((user) =>
    user.accounts.map((account) => {
      const company = account.companyKey ? companyByKey.get(account.companyKey) : null;

      return {
        ...account,
        avatarUrl: user.avatarUrl,
        contextKey: account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : company.id,
        tenantId: account.scopeLevel === 'SYSTEM' ? null : company.id,
        userId: user.id,
      };
    }),
  );
}

// Resolves work email contact assets for tenant-scoped accounts so the seeded data looks realistic inside identity-service.
export function buildSeedContactAssets() {
  return buildSeedAccounts()
    .filter((account) => account.scopeLevel === 'TENANT' && account.workEmail)
    .map((account) => ({
      id: `contact-${account.id}`,
      accountId: account.id,
      tenantId: account.tenantId,
      type: 'WORK_EMAIL',
      value: account.workEmail,
      status: 'ACTIVE',
      isPrimary: true,
      assignedAt: new Date('2026-04-14T09:00:00.000Z'),
      assignedBy: 'seed:tenant-web-auth',
    }));
}

// Resolves tenant role rows with concrete tenant ids and scope keys for permission-service seeding.
export function buildSeedTenantRoles() {
  return SEEDED_TENANT_ROLES.map((role) => {
    const company = companyByKey.get(role.companyKey);
    return {
      ...role,
      kind: 'TENANT_INSTANCE',
      scopeKey: company.id,
      tenantId: company.id,
      templateRoleId: null,
      isEnabled: true,
    };
  });
}

// Resolves account-role bindings using the tenant role ids managed by the local auth seed.
export function buildSeedAccountRoleBindings() {
  const roleByScopedCode = new Map(
    buildSeedTenantRoles().map((role) => [`${role.code}@${role.tenantId}`, role]),
  );

  return SEEDED_ROLE_BINDINGS.filter((binding) => binding.roleCode !== 'system.admin').map(
    (binding) => {
      const account = accountById.get(binding.accountId);
      const company = companyByKey.get(binding.companyKey);
      const role = roleByScopedCode.get(`${binding.roleCode}@${company.id}`);

      return {
        accountId: binding.accountId,
        accountType: 'USER',
        effectiveAt: null,
        expiresAt: null,
        roleId: role.id,
        scopeLevel: account.scopeLevel,
        tenantId: company.id,
      };
    },
  );
}

// Resolves tenant-org-service tenant rows and root org units for local shared-environment hydration paths.
export function buildSeedTenantOrgTenants() {
  return SEEDED_COMPANIES.map((company) => ({
    id: company.id,
    code: company.code,
    name: company.name,
    rootOrgId: company.rootOrgId,
    status: 'ACTIVE',
  }));
}

// Resolves one active root org unit per managed tenant so tenant-org-service can answer first-phase queries.
export function buildSeedTenantOrgRootUnits() {
  return SEEDED_COMPANIES.map((company) => ({
    id: company.rootOrgId,
    tenantId: company.id,
    parentOrgId: null,
    name: company.rootOrgName,
    type: 'ROOT',
    status: 'ACTIVE',
    path: `/${company.rootOrgId}`,
    depth: 0,
    sortOrder: 0,
    organizationPartyId: null,
  }));
}
