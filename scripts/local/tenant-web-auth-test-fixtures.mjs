export const DEFAULT_PASSWORD = 'imkgsam6593';
export const DEFAULT_OTP_CODE = '123456';
export const LEGACY_IDENTIFIERS = ['ui.tester@oes.local', '+8613800000001'];

const ROOT_CREATED_BY = 'seed:tenant-web-auth';

function makeUuid(sequence) {
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}

const LIVE_SEED_TENANT_KEYS = new Set(['meilong', 'haisheng', 'beichen']);
const LIVE_SEED_ORG_UNIT_KEYS = new Set([
  'meilong.root',
  'meilong.office',
  'meilong.hr-admin',
  'haisheng.root',
  'haisheng.gm',
  'haisheng.trade-1',
  'beichen.root',
]);
const LIVE_SEED_EMPLOYEE_KEYS = new Set([
  'meilong.chen-shuangpeng',
  'meilong.lin-xiaowen',
  'haisheng.he-yuchen',
  'haisheng.su-manli',
]);
const LIVE_SEED_USER_KEYS = new Set([
  'chen-shuangpeng',
  'lin-xiaowen',
  'he-yuchen',
  'su-manli',
  'auth-recovery',
  'auth-password-setup',
  'auth-mfa',
]);

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

// Declares the compact tenant personas used by the local live seed baseline.
const ALL_SEEDED_COMPANIES = [
  {
    key: 'meilong',
    id: makeUuid(1),
    code: 'meilong-ceramics',
    domain: 'meilong.local',
    employeeCodePrefix: '0AF',
    name: '广东美隆陶瓷有限公司',
    rootOrgId: makeUuid(101),
    rootOrgName: '广东美隆陶瓷有限公司',
    organizationTenantPartyId: makeUuid(201),
  },
  {
    key: 'haisheng',
    id: makeUuid(2),
    code: 'haisheng-trade',
    domain: 'haisheng.local',
    employeeCodePrefix: '0B0',
    name: '海晟国际贸易有限公司',
    rootOrgId: makeUuid(102),
    rootOrgName: '海晟国际贸易有限公司',
    organizationTenantPartyId: makeUuid(202),
  },
  {
    key: 'beichen',
    id: makeUuid(3),
    code: 'beichen-retail',
    domain: 'beichen.local',
    employeeCodePrefix: '0B1',
    name: '北辰零售运营有限公司',
    rootOrgId: makeUuid(103),
    rootOrgName: '北辰零售运营有限公司',
    organizationTenantPartyId: makeUuid(203),
  },
];

export const SEEDED_COMPANIES = ALL_SEEDED_COMPANIES.filter((company) =>
  LIVE_SEED_TENANT_KEYS.has(company.key)
);

const companyByKey = new Map(SEEDED_COMPANIES.map((company) => [company.key, company]));

const ORG_UNIT_FIXTURES = [
  { key: 'meilong.root', tenantKey: 'meilong', id: makeUuid(101), parentKey: null, name: '广东美隆陶瓷有限公司', type: 'ROOT', sortOrder: 0, organizationTenantPartyId: makeUuid(201) },
  { key: 'meilong.office', tenantKey: 'meilong', id: makeUuid(111), parentKey: 'meilong.root', name: '总经办', type: 'DEPARTMENT', sortOrder: 10 },
  { key: 'meilong.hr-admin', tenantKey: 'meilong', id: makeUuid(112), parentKey: 'meilong.root', name: '人力行政部', type: 'DEPARTMENT', sortOrder: 20 },
  { key: 'meilong.finance', tenantKey: 'meilong', id: makeUuid(113), parentKey: 'meilong.root', name: '财务部', type: 'DEPARTMENT', sortOrder: 30 },
  { key: 'meilong.foreign-trade', tenantKey: 'meilong', id: makeUuid(114), parentKey: 'meilong.root', name: '外贸销售部', type: 'DEPARTMENT', sortOrder: 40 },
  { key: 'meilong.domestic-sales', tenantKey: 'meilong', id: makeUuid(115), parentKey: 'meilong.root', name: '国内销售部', type: 'DEPARTMENT', sortOrder: 50 },
  { key: 'meilong.procurement', tenantKey: 'meilong', id: makeUuid(116), parentKey: 'meilong.root', name: '采购部', type: 'DEPARTMENT', sortOrder: 60 },
  { key: 'meilong.warehouse', tenantKey: 'meilong', id: makeUuid(117), parentKey: 'meilong.root', name: '仓储部', type: 'DEPARTMENT', sortOrder: 70 },
  { key: 'meilong.manufacturing', tenantKey: 'meilong', id: makeUuid(118), parentKey: 'meilong.root', name: '制造中心', type: 'DEPARTMENT', sortOrder: 80 },
  { key: 'meilong.forming', tenantKey: 'meilong', id: makeUuid(119), parentKey: 'meilong.manufacturing', name: '成型车间', type: 'TEAM', sortOrder: 10 },
  { key: 'meilong.firing', tenantKey: 'meilong', id: makeUuid(120), parentKey: 'meilong.manufacturing', name: '烧成车间', type: 'TEAM', sortOrder: 20 },
  { key: 'meilong.quality', tenantKey: 'meilong', id: makeUuid(121), parentKey: 'meilong.root', name: '品质部', type: 'DEPARTMENT', sortOrder: 90 },

  { key: 'haisheng.root', tenantKey: 'haisheng', id: makeUuid(102), parentKey: null, name: '海晟国际贸易有限公司', type: 'ROOT', sortOrder: 0, organizationTenantPartyId: makeUuid(202) },
  { key: 'haisheng.gm', tenantKey: 'haisheng', id: makeUuid(131), parentKey: 'haisheng.root', name: '总经理办公室', type: 'DEPARTMENT', sortOrder: 10 },
  { key: 'haisheng.trade-1', tenantKey: 'haisheng', id: makeUuid(132), parentKey: 'haisheng.root', name: '外贸一部', type: 'DEPARTMENT', sortOrder: 20 },
  { key: 'haisheng.trade-2', tenantKey: 'haisheng', id: makeUuid(133), parentKey: 'haisheng.root', name: '外贸二部', type: 'DEPARTMENT', sortOrder: 30 },
  { key: 'haisheng.customer-service', tenantKey: 'haisheng', id: makeUuid(134), parentKey: 'haisheng.root', name: '单证客服部', type: 'DEPARTMENT', sortOrder: 40 },
  { key: 'haisheng.finance', tenantKey: 'haisheng', id: makeUuid(135), parentKey: 'haisheng.root', name: '财务结算部', type: 'DEPARTMENT', sortOrder: 50 },

  { key: 'beichen.root', tenantKey: 'beichen', id: makeUuid(103), parentKey: null, name: '北辰零售运营有限公司', type: 'ROOT', sortOrder: 0, organizationTenantPartyId: makeUuid(203) },
  { key: 'beichen.headquarters', tenantKey: 'beichen', id: makeUuid(141), parentKey: 'beichen.root', name: '总部', type: 'DEPARTMENT', sortOrder: 10 },
  { key: 'beichen.south-region', tenantKey: 'beichen', id: makeUuid(142), parentKey: 'beichen.root', name: '华南大区', type: 'BRANCH', sortOrder: 20 },
  { key: 'beichen.east-region', tenantKey: 'beichen', id: makeUuid(143), parentKey: 'beichen.root', name: '华东大区', type: 'BRANCH', sortOrder: 30 },
  { key: 'beichen.shenzhen-store', tenantKey: 'beichen', id: makeUuid(144), parentKey: 'beichen.south-region', name: '深圳门店', type: 'BRANCH', sortOrder: 10 },
  { key: 'beichen.guangzhou-store', tenantKey: 'beichen', id: makeUuid(145), parentKey: 'beichen.south-region', name: '广州门店', type: 'BRANCH', sortOrder: 20 },
  { key: 'beichen.hangzhou-store', tenantKey: 'beichen', id: makeUuid(146), parentKey: 'beichen.east-region', name: '杭州门店', type: 'BRANCH', sortOrder: 10 },
  { key: 'beichen.ecommerce', tenantKey: 'beichen', id: makeUuid(147), parentKey: 'beichen.root', name: '电商运营部', type: 'DEPARTMENT', sortOrder: 40 },
];

const orgUnitByKey = new Map(ORG_UNIT_FIXTURES.map((orgUnit) => [orgUnit.key, orgUnit]));

function buildOrgPath(orgKey) {
  const segments = [];
  let current = orgUnitByKey.get(orgKey);

  while (current) {
    segments.unshift(current.id);
    current = current.parentKey ? orgUnitByKey.get(current.parentKey) : null;
  }

  return `/${segments.join('/')}`;
}

function buildOrgDepth(orgKey) {
  let depth = 0;
  let current = orgUnitByKey.get(orgKey);

  while (current?.parentKey) {
    depth += 1;
    current = orgUnitByKey.get(current.parentKey);
  }

  return depth;
}

// Builds the public employee barcode while HR fixtures store only the employee-owned suffix.
function buildEmployeeDisplayCode(employee) {
  const company = companyByKey.get(employee.tenantKey);
  return `EMP-${company.employeeCodePrefix}-${employee.employeeCode}`;
}

const EMPLOYEE_FIXTURES = [
  {
    key: 'meilong.chen-shuangpeng',
    tenantKey: 'meilong',
    employeeId: makeUuid(301),
    tenantPartyId: makeUuid(501),
    employeeCode: '0001',
    personName: '陈双鹏',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(601), orgKey: 'meilong.office', status: 'ACTIVE', effectiveFrom: '2025-01-06T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(701), status: 'COMPLETED', accountKey: 'account.chen-shuangpeng.meilong' },
  },
  {
    key: 'meilong.lin-xiaowen',
    tenantKey: 'meilong',
    employeeId: makeUuid(302),
    tenantPartyId: makeUuid(502),
    employeeCode: '0002',
    personName: '林晓雯',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(602), orgKey: 'meilong.hr-admin', status: 'ACTIVE', effectiveFrom: '2025-02-03T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(702), status: 'COMPLETED', accountKey: 'account.lin-xiaowen.meilong' },
  },
  {
    key: 'meilong.zhao-mingjie',
    tenantKey: 'meilong',
    employeeId: makeUuid(303),
    tenantPartyId: makeUuid(503),
    employeeCode: '0003',
    personName: '赵明杰',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(603), orgKey: 'meilong.finance', status: 'ACTIVE', effectiveFrom: '2025-02-10T09:00:00.000Z' }],
  },
  {
    key: 'meilong.xu-jiahao',
    tenantKey: 'meilong',
    employeeId: makeUuid(304),
    tenantPartyId: makeUuid(504),
    employeeCode: '0004',
    personName: '许嘉豪',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(604), orgKey: 'meilong.foreign-trade', status: 'ACTIVE', effectiveFrom: '2025-02-10T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(703), status: 'COMPLETED', accountKey: 'account.xu-jiahao.meilong' },
  },
  {
    key: 'meilong.cai-yilin',
    tenantKey: 'meilong',
    employeeId: makeUuid(305),
    tenantPartyId: makeUuid(505),
    employeeCode: '0005',
    personName: '蔡依琳',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(605), orgKey: 'meilong.foreign-trade', status: 'ACTIVE', effectiveFrom: '2025-03-03T09:00:00.000Z' }],
  },
  {
    key: 'meilong.peng-rui',
    tenantKey: 'meilong',
    employeeId: makeUuid(306),
    tenantPartyId: makeUuid(506),
    employeeCode: '0006',
    personName: '彭锐',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(606), orgKey: 'meilong.domestic-sales', status: 'ACTIVE', effectiveFrom: '2025-03-17T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(704), status: 'ACCOUNT_BINDING_PENDING', failureReason: '等待补充联系方式' },
  },
  {
    key: 'meilong.tang-siqi',
    tenantKey: 'meilong',
    employeeId: makeUuid(307),
    tenantPartyId: makeUuid(507),
    employeeCode: '0007',
    personName: '唐思齐',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(607), orgKey: 'meilong.procurement', status: 'ACTIVE', effectiveFrom: '2025-03-24T09:00:00.000Z' }],
  },
  {
    key: 'meilong.gao-wentao',
    tenantKey: 'meilong',
    employeeId: makeUuid(308),
    tenantPartyId: makeUuid(508),
    employeeCode: '0008',
    personName: '高文涛',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(608), orgKey: 'meilong.warehouse', status: 'ACTIVE', effectiveFrom: '2025-03-31T09:00:00.000Z' }],
  },
  {
    key: 'meilong.xie-cheng',
    tenantKey: 'meilong',
    employeeId: makeUuid(309),
    tenantPartyId: makeUuid(509),
    employeeCode: '0009',
    personName: '谢成',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(609), orgKey: 'meilong.forming', status: 'ACTIVE', effectiveFrom: '2025-04-07T09:00:00.000Z' }],
  },
  {
    key: 'meilong.luo-zhiyuan',
    tenantKey: 'meilong',
    employeeId: makeUuid(310),
    tenantPartyId: makeUuid(510),
    employeeCode: '000A',
    personName: '罗志远',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(610), orgKey: 'meilong.firing', status: 'ACTIVE', effectiveFrom: '2025-04-14T09:00:00.000Z' }],
  },
  {
    key: 'meilong.zhou-yaqing',
    tenantKey: 'meilong',
    employeeId: makeUuid(311),
    tenantPartyId: makeUuid(511),
    employeeCode: '000B',
    personName: '周雅晴',
    lifecycleStatus: 'ACTIVE',
    employments: [
      { id: makeUuid(611), orgKey: 'meilong.foreign-trade', status: 'ENDED', effectiveFrom: '2025-02-03T09:00:00.000Z', effectiveTo: '2025-06-30T09:00:00.000Z', endedReason: 'transfer_to_quality' },
      { id: makeUuid(612), orgKey: 'meilong.quality', status: 'ACTIVE', effectiveFrom: '2025-07-01T09:00:00.000Z' },
    ],
  },
  {
    key: 'meilong.ou-jiamin',
    tenantKey: 'meilong',
    employeeId: makeUuid(312),
    tenantPartyId: makeUuid(512),
    employeeCode: '000C',
    personName: '欧嘉敏',
    lifecycleStatus: 'OFFBOARDED',
    employments: [{ id: makeUuid(613), orgKey: 'meilong.hr-admin', status: 'ENDED', effectiveFrom: '2024-11-04T09:00:00.000Z', effectiveTo: '2025-05-30T09:00:00.000Z', endedReason: 'resigned' }],
  },
  {
    key: 'meilong.han-zhuoran',
    tenantKey: 'meilong',
    employeeId: makeUuid(313),
    tenantPartyId: makeUuid(513),
    employeeCode: '000D',
    personName: '韩卓然',
    lifecycleStatus: 'PREBOARDING',
    employments: [],
  },

  {
    key: 'haisheng.he-yuchen',
    tenantKey: 'haisheng',
    employeeId: makeUuid(321),
    tenantPartyId: makeUuid(521),
    employeeCode: '0001',
    personName: '何宇辰',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(621), orgKey: 'haisheng.gm', status: 'ACTIVE', effectiveFrom: '2025-01-08T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(721), status: 'COMPLETED', accountKey: 'account.he-yuchen.haisheng' },
  },
  {
    key: 'haisheng.su-manli',
    tenantKey: 'haisheng',
    employeeId: makeUuid(322),
    tenantPartyId: makeUuid(522),
    employeeCode: '0002',
    personName: '苏曼丽',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(622), orgKey: 'haisheng.trade-1', status: 'ACTIVE', effectiveFrom: '2025-02-10T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(722), status: 'COMPLETED', accountKey: 'account.su-manli.haisheng' },
  },
  {
    key: 'haisheng.ye-jiacheng',
    tenantKey: 'haisheng',
    employeeId: makeUuid(323),
    tenantPartyId: makeUuid(523),
    employeeCode: '0003',
    personName: '叶嘉诚',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(623), orgKey: 'haisheng.trade-1', status: 'ACTIVE', effectiveFrom: '2025-02-17T09:00:00.000Z' }],
  },
  {
    key: 'haisheng.fang-qing',
    tenantKey: 'haisheng',
    employeeId: makeUuid(324),
    tenantPartyId: makeUuid(524),
    employeeCode: '0004',
    personName: '方晴',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(624), orgKey: 'haisheng.trade-2', status: 'ACTIVE', effectiveFrom: '2025-03-03T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(723), status: 'ACCOUNT_BINDING_PENDING', failureReason: '等待业务负责人确认邮箱' },
  },
  {
    key: 'haisheng.zhang-yufei',
    tenantKey: 'haisheng',
    employeeId: makeUuid(325),
    tenantPartyId: makeUuid(525),
    employeeCode: '0005',
    personName: '张语菲',
    lifecycleStatus: 'ACTIVE',
    employments: [
      { id: makeUuid(625), orgKey: 'haisheng.trade-2', status: 'ENDED', effectiveFrom: '2025-01-13T09:00:00.000Z', effectiveTo: '2025-04-30T09:00:00.000Z', endedReason: 'transfer_to_customer_service' },
      { id: makeUuid(626), orgKey: 'haisheng.customer-service', status: 'ACTIVE', effectiveFrom: '2025-05-01T09:00:00.000Z' },
    ],
  },
  {
    key: 'haisheng.ma-rui',
    tenantKey: 'haisheng',
    employeeId: makeUuid(326),
    tenantPartyId: makeUuid(526),
    employeeCode: '0006',
    personName: '马芮',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(627), orgKey: 'haisheng.finance', status: 'ACTIVE', effectiveFrom: '2025-03-10T09:00:00.000Z' }],
  },
  {
    key: 'haisheng.li-yuanhang',
    tenantKey: 'haisheng',
    employeeId: makeUuid(327),
    tenantPartyId: makeUuid(527),
    employeeCode: '0007',
    personName: '黎远航',
    lifecycleStatus: 'OFFBOARDED',
    employments: [{ id: makeUuid(628), orgKey: 'haisheng.trade-2', status: 'ENDED', effectiveFrom: '2024-12-02T09:00:00.000Z', effectiveTo: '2025-05-15T09:00:00.000Z', endedReason: 'resigned' }],
  },

  {
    key: 'beichen.qin-hao',
    tenantKey: 'beichen',
    employeeId: makeUuid(331),
    tenantPartyId: makeUuid(531),
    employeeCode: '0001',
    personName: '秦浩',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(631), orgKey: 'beichen.headquarters', status: 'ACTIVE', effectiveFrom: '2025-01-06T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(731), status: 'COMPLETED', accountKey: 'account.qin-hao.beichen' },
  },
  {
    key: 'beichen.xu-lin',
    tenantKey: 'beichen',
    employeeId: makeUuid(332),
    tenantPartyId: makeUuid(532),
    employeeCode: '0002',
    personName: '许琳',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(632), orgKey: 'beichen.south-region', status: 'ACTIVE', effectiveFrom: '2025-02-03T09:00:00.000Z' }],
  },
  {
    key: 'beichen.liang-siyuan',
    tenantKey: 'beichen',
    employeeId: makeUuid(333),
    tenantPartyId: makeUuid(533),
    employeeCode: '0003',
    personName: '梁思源',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(633), orgKey: 'beichen.east-region', status: 'ACTIVE', effectiveFrom: '2025-02-10T09:00:00.000Z' }],
  },
  {
    key: 'beichen.chen-yinuo',
    tenantKey: 'beichen',
    employeeId: makeUuid(334),
    tenantPartyId: makeUuid(534),
    employeeCode: '0004',
    personName: '陈一诺',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(634), orgKey: 'beichen.shenzhen-store', status: 'ACTIVE', effectiveFrom: '2025-02-17T09:00:00.000Z' }],
  },
  {
    key: 'beichen.huang-kexin',
    tenantKey: 'beichen',
    employeeId: makeUuid(335),
    tenantPartyId: makeUuid(535),
    employeeCode: '0005',
    personName: '黄可欣',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(635), orgKey: 'beichen.guangzhou-store', status: 'ACTIVE', effectiveFrom: '2025-03-03T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(732), status: 'ACCESS_GRANT_PENDING', accountKey: 'account.huang-kexin.beichen', failureReason: '待补齐访问角色授权' },
  },
  {
    key: 'beichen.tang-jiahe',
    tenantKey: 'beichen',
    employeeId: makeUuid(336),
    tenantPartyId: makeUuid(536),
    employeeCode: '0006',
    personName: '唐嘉禾',
    lifecycleStatus: 'ACTIVE',
    employments: [{ id: makeUuid(636), orgKey: 'beichen.ecommerce', status: 'ACTIVE', effectiveFrom: '2025-03-10T09:00:00.000Z' }],
    access: { onboardingId: makeUuid(733), status: 'COMPLETED', accountKey: 'account.tang-jiahe.beichen' },
  },
  {
    key: 'beichen.wu-chengze',
    tenantKey: 'beichen',
    employeeId: makeUuid(337),
    tenantPartyId: makeUuid(537),
    employeeCode: '0007',
    personName: '吴承泽',
    lifecycleStatus: 'ACTIVE',
    employments: [
      { id: makeUuid(637), orgKey: 'beichen.headquarters', status: 'ENDED', effectiveFrom: '2025-01-06T09:00:00.000Z', effectiveTo: '2025-04-30T09:00:00.000Z', endedReason: 'transfer_to_region' },
      { id: makeUuid(638), orgKey: 'beichen.south-region', status: 'ACTIVE', effectiveFrom: '2025-05-01T09:00:00.000Z' },
    ],
    access: { onboardingId: makeUuid(734), status: 'COMPLETED', accountKey: 'account.wu-chengze.beichen' },
  },
  {
    key: 'beichen.he-zhixia',
    tenantKey: 'beichen',
    employeeId: makeUuid(338),
    tenantPartyId: makeUuid(538),
    employeeCode: '0008',
    personName: '何知夏',
    lifecycleStatus: 'OFFBOARDED',
    employments: [{ id: makeUuid(639), orgKey: 'beichen.guangzhou-store', status: 'ENDED', effectiveFrom: '2024-12-09T09:00:00.000Z', effectiveTo: '2025-05-20T09:00:00.000Z', endedReason: 'resigned' }],
  },
];

const employeeByKey = new Map(EMPLOYEE_FIXTURES.map((employee) => [employee.key, employee]));

// Captures the managed user identities and account contexts used for manual login and access-summary tests.
const ALL_SEEDED_USERS = [
  {
    key: 'chen-shuangpeng',
    id: makeUuid(801),
    personName: '陈双鹏',
    username: 'chen.shuangpeng',
    email: 'csp@ml.lc',
    phone: '+8613900000101',
    avatarUrl: buildSeedAvatar({ accent: '#0f766e', label: 'SP' }),
    accounts: [
      { key: 'account.chen-shuangpeng.meilong', id: makeUuid(901), scopeLevel: 'TENANT', companyKey: 'meilong', displayName: '陈双鹏', workEmail: 'csp@ml.lc', bindEmployeeKey: 'meilong.chen-shuangpeng', primaryOrgKey: 'meilong.office', roleCodes: ['tenant.admin', 'extension.designer', 'crm.sales', 'mes.forming_workshop.supervisor'] },
      { key: 'account.chen-shuangpeng.system', id: makeUuid(902), scopeLevel: 'SYSTEM', contextKey: 'SYSTEM', displayName: '陈双鹏', roleCodes: ['system.admin'] },
    ],
  },
  {
    key: 'lin-xiaowen',
    id: makeUuid(802),
    personName: '林晓雯',
    username: 'lin.xiaowen',
    email: 'lin.xiaowen@meilong.local',
    phone: '+8613900000102',
    avatarUrl: buildSeedAvatar({ accent: '#b45309', label: 'XW' }),
    accounts: [
      { key: 'account.lin-xiaowen.meilong', id: makeUuid(903), scopeLevel: 'TENANT', companyKey: 'meilong', displayName: '林晓雯', workEmail: 'lin.xiaowen@meilong.local', bindEmployeeKey: 'meilong.lin-xiaowen', primaryOrgKey: 'meilong.hr-admin', roleCodes: [] },
    ],
  },
  {
    key: 'xu-jiahao',
    id: makeUuid(803),
    personName: '许嘉豪',
    username: 'xu.jiahao',
    email: 'xu.jiahao@meilong.local',
    phone: '+8613900000103',
    avatarUrl: buildSeedAvatar({ accent: '#1d4ed8', label: 'JH' }),
    accounts: [
      { key: 'account.xu-jiahao.meilong', id: makeUuid(904), scopeLevel: 'TENANT', companyKey: 'meilong', displayName: '许嘉豪', workEmail: 'xu.jiahao@meilong.local', bindEmployeeKey: 'meilong.xu-jiahao', primaryOrgKey: 'meilong.foreign-trade', roleCodes: [] },
    ],
  },
  {
    key: 'he-yuchen',
    id: makeUuid(804),
    personName: '何宇辰',
    username: 'he.yuchen',
    email: 'he.yuchen@haisheng.local',
    phone: '+8613900000104',
    avatarUrl: buildSeedAvatar({ accent: '#4338ca', label: 'YC' }),
    accounts: [
      { key: 'account.he-yuchen.haisheng', id: makeUuid(905), scopeLevel: 'TENANT', companyKey: 'haisheng', displayName: '何宇辰', workEmail: 'he.yuchen@haisheng.local', bindEmployeeKey: 'haisheng.he-yuchen', primaryOrgKey: 'haisheng.gm', roleCodes: ['tenant.admin'] },
    ],
  },
  {
    key: 'su-manli',
    id: makeUuid(805),
    personName: '苏曼丽',
    username: 'su.manli',
    email: 'su.manli@haisheng.local',
    phone: '+8613900000105',
    avatarUrl: buildSeedAvatar({ accent: '#be185d', label: 'ML' }),
    accounts: [
      { key: 'account.su-manli.haisheng', id: makeUuid(906), scopeLevel: 'TENANT', companyKey: 'haisheng', displayName: '苏曼丽', workEmail: 'su.manli@haisheng.local', bindEmployeeKey: 'haisheng.su-manli', primaryOrgKey: 'haisheng.trade-1', roleCodes: [] },
    ],
  },
  {
    key: 'qin-hao',
    id: makeUuid(806),
    personName: '秦浩',
    username: 'qin.hao',
    email: 'qin.hao@beichen.local',
    phone: '+8613900000106',
    avatarUrl: buildSeedAvatar({ accent: '#0f766e', label: 'QH' }),
    accounts: [
      { key: 'account.qin-hao.beichen', id: makeUuid(907), scopeLevel: 'TENANT', companyKey: 'beichen', displayName: '秦浩', workEmail: 'qin.hao@beichen.local', bindEmployeeKey: 'beichen.qin-hao', primaryOrgKey: 'beichen.headquarters', roleCodes: ['tenant.admin'] },
    ],
  },
  {
    key: 'huang-kexin',
    id: makeUuid(807),
    personName: '黄可欣',
    username: 'huang.kexin',
    email: 'huang.kexin@beichen.local',
    phone: '+8613900000107',
    avatarUrl: buildSeedAvatar({ accent: '#ea580c', label: 'KX' }),
    accounts: [
      { key: 'account.huang-kexin.beichen', id: makeUuid(908), scopeLevel: 'TENANT', companyKey: 'beichen', displayName: '黄可欣', workEmail: 'huang.kexin@beichen.local', bindEmployeeKey: 'beichen.huang-kexin', primaryOrgKey: 'beichen.guangzhou-store', roleCodes: [] },
    ],
  },
  {
    key: 'tang-jiahe',
    id: makeUuid(808),
    personName: '唐嘉禾',
    username: 'tang.jiahe',
    email: 'tang.jiahe@beichen.local',
    phone: '+8613900000108',
    avatarUrl: buildSeedAvatar({ accent: '#334155', label: 'JH' }),
    accounts: [
      { key: 'account.tang-jiahe.beichen', id: makeUuid(909), scopeLevel: 'TENANT', companyKey: 'beichen', displayName: '唐嘉禾', workEmail: 'tang.jiahe@beichen.local', bindEmployeeKey: 'beichen.tang-jiahe', primaryOrgKey: 'beichen.ecommerce', roleCodes: ['extension.designer'] },
    ],
  },
  {
    key: 'wu-chengze',
    id: makeUuid(809),
    personName: '吴承泽',
    username: 'wu.chengze',
    email: 'wu.chengze@beichen.local',
    phone: '+8613900000109',
    avatarUrl: buildSeedAvatar({ accent: '#7c3aed', label: 'CZ' }),
    accounts: [
      { key: 'account.wu-chengze.beichen', id: makeUuid(910), scopeLevel: 'TENANT', companyKey: 'beichen', displayName: '吴承泽', workEmail: 'wu.chengze@beichen.local', bindEmployeeKey: 'beichen.wu-chengze', primaryOrgKey: 'beichen.south-region', roleCodes: [] },
    ],
  },
  {
    key: 'auth-recovery',
    id: makeUuid(810),
    personName: 'Recovery Acceptance',
    username: 'auth.recovery',
    email: 'auth.recovery@meilong.local',
    phone: '+8613900000110',
    avatarUrl: buildSeedAvatar({ accent: '#0369a1', label: 'RC' }),
    accounts: [
      { key: 'account.auth-recovery.meilong', id: makeUuid(911), scopeLevel: 'TENANT', companyKey: 'meilong', displayName: 'Recovery Acceptance', roleCodes: [] },
    ],
  },
  {
    key: 'auth-password-setup',
    id: makeUuid(811),
    personName: 'Password Setup Acceptance',
    username: 'auth.password.setup',
    email: 'auth.password.setup@haisheng.local',
    phone: '+8613900000111',
    avatarUrl: buildSeedAvatar({ accent: '#7c2d12', label: 'PS' }),
    accounts: [
      { key: 'account.auth-password-setup.haisheng', id: makeUuid(912), scopeLevel: 'TENANT', companyKey: 'haisheng', displayName: 'Password Setup Acceptance', roleCodes: [] },
    ],
  },
  {
    key: 'auth-mfa',
    id: makeUuid(812),
    personName: 'MFA Acceptance',
    username: 'auth.mfa',
    email: 'auth.mfa@beichen.local',
    phone: '+8613900000112',
    avatarUrl: buildSeedAvatar({ accent: '#6d28d9', label: 'MF' }),
    accounts: [
      { key: 'account.auth-mfa.beichen', id: makeUuid(913), scopeLevel: 'TENANT', companyKey: 'beichen', displayName: 'MFA Acceptance', roleCodes: [] },
    ],
  },
];

export const SEEDED_USERS = ALL_SEEDED_USERS.filter((user) =>
  LIVE_SEED_USER_KEYS.has(user.key)
);

const userByKey = new Map(SEEDED_USERS.map((user) => [user.key, user]));
const accountByKey = new Map(
  SEEDED_USERS.flatMap((user) => user.accounts.map((account) => [account.key, { ...account, userId: user.id }]))
);

const recoveryAcceptanceUser = userByKey.get('auth-recovery');
const passwordSetupAcceptanceUser = userByKey.get('auth-password-setup');
const mfaAcceptanceUser = userByKey.get('auth-mfa');

if (!recoveryAcceptanceUser || !passwordSetupAcceptanceUser || !mfaAcceptanceUser) {
  throw new Error('Auth acceptance fixtures are incomplete.');
}

// Declares resettable auth journey states without printing their credential material during seed.
export const AUTH_ACCEPTANCE_FIXTURES = Object.freeze({
  passwordRecovery: Object.freeze({
    userId: recoveryAcceptanceUser.id,
    accountId: recoveryAcceptanceUser.accounts[0].id,
    identifier: recoveryAcceptanceUser.email,
    expectedChannels: Object.freeze(['EMAIL', 'PHONE']),
    accountTerminalAccessOverride: Object.freeze({
      id: makeUuid(825),
      accountId: recoveryAcceptanceUser.accounts[0].id,
      scopeLevel: 'TENANT',
      tenantId: companyByKey.get('meilong').id,
      allowedTerminals: Object.freeze(['WEB']),
    }),
    grant: Object.freeze({
      id: makeUuid(820),
      challengeId: makeUuid(824),
      expiresAt: new Date('2099-12-31T23:59:59.000Z'),
      verifiedAt: new Date('2026-04-14T09:00:00.000Z'),
    }),
  }),
  passwordSetup: Object.freeze({
    userId: passwordSetupAcceptanceUser.id,
    accountId: passwordSetupAcceptanceUser.accounts[0].id,
    identifier: passwordSetupAcceptanceUser.email,
    accountTerminalAccessOverride: Object.freeze({
      id: makeUuid(826),
      accountId: passwordSetupAcceptanceUser.accounts[0].id,
      scopeLevel: 'TENANT',
      tenantId: companyByKey.get('haisheng').id,
      allowedTerminals: Object.freeze(['WEB']),
    }),
    requirement: Object.freeze({
      id: makeUuid(821),
      reason: 'FIRST_LOGIN',
      required: true,
      requiredBy: ROOT_CREATED_BY,
      requiredAt: new Date('2026-04-14T09:00:00.000Z'),
    }),
  }),
  mfa: Object.freeze({
    userId: mfaAcceptanceUser.id,
    accountId: mfaAcceptanceUser.accounts[0].id,
    identifier: mfaAcceptanceUser.email,
    tenantId: companyByKey.get('beichen').id,
    accountTerminalAccessOverride: Object.freeze({
      id: makeUuid(827),
      accountId: mfaAcceptanceUser.accounts[0].id,
      scopeLevel: 'TENANT',
      tenantId: companyByKey.get('beichen').id,
      allowedTerminals: Object.freeze(['WEB']),
    }),
    binding: Object.freeze({
      id: makeUuid(822),
      type: 'TOTP',
      secret: 'JBSWY3DPEHPK3PXP',
      enabled: true,
    }),
    tenantTerminalMfaPolicy: Object.freeze({
      terminal: 'WEB',
      loginMfaRequired: true,
      newDeviceMfaRequired: false,
      allowedFactors: Object.freeze(['TOTP']),
      factorPriority: Object.freeze(['TOTP']),
    }),
    tenantScenarioPolicy: Object.freeze({
      scenario: 'LOGIN',
      required: true,
      updatedBy: ROOT_CREATED_BY,
    }),
    tenantFactorPolicies: Object.freeze([
      Object.freeze({
        factor: 'TOTP',
        enabled: true,
        priority: 1,
        updatedBy: ROOT_CREATED_BY,
      }),
      Object.freeze({
        factor: 'EMAIL_OTP',
        enabled: false,
        priority: 2,
        updatedBy: ROOT_CREATED_BY,
      }),
      Object.freeze({
        factor: 'SMS_OTP',
        enabled: false,
        priority: 3,
        updatedBy: ROOT_CREATED_BY,
      }),
      Object.freeze({
        factor: 'BACKUP_CODE',
        enabled: false,
        priority: 4,
        updatedBy: ROOT_CREATED_BY,
      }),
    ]),
  }),
});

const PAGE_ACCEPTANCE_TENANT_ID = companyByKey.get('meilong').id;
const PAGE_ACCEPTANCE_ACCOUNT_ID = accountByKey.get('account.chen-shuangpeng.meilong').id;
const PAGE_ACCEPTANCE_ATTRIBUTE_DEFINITION_ID = makeUuid(999);
const PAGE_ACCEPTANCE_ATTRIBUTE_OPTION_ID = makeUuid(998);
const PAGE_ACCEPTANCE_ITEM_MODEL_ID = makeUuid(999);
const PAGE_ACCEPTANCE_ITEM_ID = makeUuid(999);
const PAGE_ACCEPTANCE_CATEGORY_ID = makeUuid(996);

// Declares exact IDs and owner fields for the eight fixture-gated tenant-web acceptance pages.
export const PAGE_ACCEPTANCE_FIXTURES = Object.freeze({
  policyPreview: Object.freeze({
    tenantId: PAGE_ACCEPTANCE_TENANT_ID,
    accountId: PAGE_ACCEPTANCE_ACCOUNT_ID,
    permissionCode: 'procurement.purchase_request.create',
    resourceType: 'item',
    policyInstance: Object.freeze({
      id: makeUuid(999),
      subjectSelectorType: 'ACCOUNT',
      subjectSelectorValue: PAGE_ACCEPTANCE_ACCOUNT_ID,
      templateCode: 'resource-field-in-set',
      effect: 'ALLOW',
      params: Object.freeze({
        field: 'categoryId',
        allowedValues: Object.freeze([PAGE_ACCEPTANCE_CATEGORY_ID]),
      }),
      priority: 100,
      isEnabled: true,
      createdBy: ROOT_CREATED_BY,
      updatedBy: ROOT_CREATED_BY,
    }),
  }),
  itemMaster: Object.freeze({
    tenantId: PAGE_ACCEPTANCE_TENANT_ID,
    category: Object.freeze({
      id: PAGE_ACCEPTANCE_CATEGORY_ID,
      categoryCode: 'acceptance-fixture',
      categoryName: 'Acceptance Fixture',
      parentCategoryId: null,
      active: true,
    }),
    attributeDefinition: Object.freeze({
      id: PAGE_ACCEPTANCE_ATTRIBUTE_DEFINITION_ID,
      attributeCode: 'acceptance-color',
      attributeName: 'Acceptance Color',
      active: true,
    }),
    attributeOption: Object.freeze({
      id: PAGE_ACCEPTANCE_ATTRIBUTE_OPTION_ID,
      attributeDefinitionId: PAGE_ACCEPTANCE_ATTRIBUTE_DEFINITION_ID,
      optionCode: 'acceptance-blue',
      optionName: 'Acceptance Blue',
      description: 'Task-owned tenant-web acceptance option.',
      active: true,
    }),
    itemModel: Object.freeze({
      id: PAGE_ACCEPTANCE_ITEM_MODEL_ID,
      modelCode: 'ACCEPTANCE-MODEL-001',
      modelName: 'Acceptance ItemModel',
      modelKind: 'PHYSICAL',
      modelType: 'FINISHED_PRODUCT',
      active: true,
      sellable: true,
      purchasable: true,
      stockable: true,
      manufacturable: false,
      assemblable: false,
      transformable: false,
      packable: false,
      packaged: false,
      primaryCategoryId: PAGE_ACCEPTANCE_CATEGORY_ID,
    }),
    itemModelAttributeRule: Object.freeze({
      id: makeUuid(997),
      itemModelId: PAGE_ACCEPTANCE_ITEM_MODEL_ID,
      attributeDefinitionId: PAGE_ACCEPTANCE_ATTRIBUTE_DEFINITION_ID,
      required: true,
      allowedOptionIds: Object.freeze([PAGE_ACCEPTANCE_ATTRIBUTE_OPTION_ID]),
    }),
    item: Object.freeze({
      id: PAGE_ACCEPTANCE_ITEM_ID,
      itemModelId: PAGE_ACCEPTANCE_ITEM_MODEL_ID,
      itemCode: 'ACCEPTANCE-ITEM-001',
      itemName: 'Acceptance Item',
      itemType: 'STANDARD',
      lockedAttributeOptionIds: Object.freeze([PAGE_ACCEPTANCE_ATTRIBUTE_OPTION_ID]),
      variantKey: `attrs:${PAGE_ACCEPTANCE_ATTRIBUTE_OPTION_ID}|pkg:`,
      packagingSpecId: null,
      active: true,
      sellable: true,
      purchasable: true,
      stockable: true,
      manufacturable: false,
      assemblable: false,
      transformable: false,
      packable: false,
      packaged: false,
    }),
  }),
});

const SEEDED_TENANT_ROLE_TEMPLATES = [
  {
    templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82001',
    code: 'tenant.admin',
    name: '租户管理员',
    description: '本地租户管理员角色实例。',
    allowTenantPermissionOverride: false,
    isProtected: true,
  },
  {
    templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82002',
    code: 'hr.admin',
    name: 'HR 管理员',
    description: '本地 HR 管理员角色实例。',
    allowTenantPermissionOverride: true,
    isProtected: false,
  },
  {
    templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82003',
    code: 'account.basic',
    name: '基础账号',
    description: '本地租户账号基础访问角色实例。',
    allowTenantPermissionOverride: false,
    isProtected: true,
  },
  {
    templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82005',
    code: 'item_master.product_data_manager',
    name: 'Item 主数据管理员',
    description: '本地 Item 主数据管理员角色实例。',
    allowTenantPermissionOverride: true,
    isProtected: false,
  },
  {
    templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82006',
    code: 'extension.designer',
    name: '插件设计师',
    description: '本地浏览器插件 Designer Workspace demo 角色实例。',
    allowTenantPermissionOverride: true,
    isProtected: false,
  },
  {
    templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82007',
    code: 'crm.sales',
    name: 'CRM 销售',
    description: '本地 CRM Sales Workspace demo 角色实例。',
    allowTenantPermissionOverride: true,
    isProtected: false,
  },
];

const MES_ACCEPTANCE_ROLE = {
  id: makeUuid(1050),
  companyKey: 'meilong',
  templateRoleId: '2cf72f72-e04a-4946-b8c0-22f120f82004',
  code: 'mes.forming_workshop.supervisor',
  name: '成型车间主管',
  description: '本地 MES 模具管理验收角色实例。',
  allowTenantPermissionOverride: true,
  isProtected: false,
};

export const SEEDED_TENANT_ROLES = [
  ...SEEDED_COMPANIES.flatMap((company, companyIndex) =>
    SEEDED_TENANT_ROLE_TEMPLATES.map((role, roleIndex) => ({
      id: makeUuid(1001 + companyIndex * SEEDED_TENANT_ROLE_TEMPLATES.length + roleIndex),
      companyKey: company.key,
      ...role,
    }))
  ),
  MES_ACCEPTANCE_ROLE,
];

const TENANT_ADMIN_PERMISSION_CODES = [
  'permission.role_template.list',
  'permission.role_template.get_by_id',
  'permission.role_instance.create',
  'permission.role_instance.create_from_template',
  'permission.role_instance.update',
  'permission.role_instance.delete',
  'permission.role_instance.assign_permissions',
  'permission.role_instance.sync_from_template',
  'permission.role_instance.list',
  'permission.role_instance.get_by_id',
  'permission.account.get_roles',
  'permission.account.assign_roles',
  'identity.account.list',
  'identity.account.create',
  'identity.account.profile.update',
  'identity.account.update_status',
  'auth.session.admin.view',
  'auth.session.admin.revoke',
  'auth.account_credentials.bootstrap',
  'auth.account_login_methods.manage',
  'auth.mfa_policy.manage',
  'tenant_org.org_unit.list_tree',
  'tenant_org.org_unit.get_by_id',
  'tenant_org.org_unit.create',
  'tenant_org.org_unit.update',
  'tenant_org.org_unit.archive',
  'crm.account.read',
  'crm.account.create',
  'crm.account.convert',
  'collaboration.annotation.create',
  'collaboration.annotation.manage',
];

const HR_ADMIN_PERMISSION_CODES = [
  'hr.employee.list',
  'hr.employee.get_by_id',
  'hr.employee.create',
  'hr.employment.create',
  'hr.employment.end',
  'hr.employment.change_primary',
  'identity.account.list',
  'identity.account.create',
  'identity.account.profile.update',
  'identity.account.update_status',
  'identity.contact.work_email.assign',
  'identity.contact.work_email.revoke',
  'identity.contact.work_email.set_primary',
  'identity.contact.work_email.set_status',
  'identity.contact.work_phone.assign',
  'identity.contact.work_phone.revoke',
  'identity.contact.work_phone.set_primary',
  'identity.contact.work_phone.set_status',
  'auth.account_credentials.bootstrap',
  'auth.account_login_methods.manage',
  'auth.session.admin.revoke',
  'permission.account.get_roles',
];

const ITEM_MASTER_PRODUCT_DATA_MANAGER_PERMISSION_CODES = [
  'item_master.item_model.list',
  'item_master.item_model.get_by_id',
  'item_master.item_model.create',
  'item_master.item_model.manage',
  'item_master.item.list',
  'item_master.item.get_by_id',
  'item_master.item.create',
  'item_master.item.update_basics',
  'item_master.item.update_status',
  'item_master.item.set_primary_category',
  'item_master.item_category.list',
  'item_master.item_category.create',
  'item_master.item_category.update_basics',
  'item_master.item_category.update_status',
  'item_master.item_category.delete',
  'item_master.attribute.list',
  'item_master.attribute.create',
  'item_master.attribute.manage',
  'item_master.packaging.list',
  'item_master.packaging.create',
  'item_master.packaging.manage',
  'item_master.bom.list',
  'item_master.bom.create',
  'item_master.bom.manage',
  'item_master.item.set_capabilities',
  'item_master.supplier_item_mapping.list_by_item',
  'item_master.supplier_item_mapping.upsert',
];

const EXTENSION_DESIGNER_PERMISSION_CODES = [];

const CRM_SALES_PERMISSION_CODES = [
  'crm.account.read',
  'crm.account.create',
  'crm.account.update',
  'crm.account.claim',
  'crm.account.release',
];

const MES_FORMING_WORKSHOP_SUPERVISOR_PERMISSION_CODES = [
  'mes.production_spec.read',
  'mes.production_spec.manage',
  'mes.mold_design.read',
  'mes.mold_design.manage',
  'mes.production_mold.read',
  'mes.production_mold.manage',
  'mes.tooling_installation.read',
  'mes.tooling_installation.manage',
  'mes.mold_usage.record',
  'mes.mold_life.manage',
];

const ACCOUNT_BASIC_PERMISSION_CODES = [
  'identity.account.self.read',
  'tenant_org.org_unit.list_tree',
  'tenant_org.org_unit.get_by_id',
];

export const SEEDED_TENANT_ROLE_PERMISSION_CODES = new Map([
  ['tenant.admin', TENANT_ADMIN_PERMISSION_CODES],
  ['hr.admin', HR_ADMIN_PERMISSION_CODES],
  ['account.basic', ACCOUNT_BASIC_PERMISSION_CODES],
  ['item_master.product_data_manager', ITEM_MASTER_PRODUCT_DATA_MANAGER_PERMISSION_CODES],
  ['extension.designer', EXTENSION_DESIGNER_PERMISSION_CODES],
  ['crm.sales', CRM_SALES_PERMISSION_CODES],
  ['mes.forming_workshop.supervisor', MES_FORMING_WORKSHOP_SUPERVISOR_PERMISSION_CODES],
]);

function resolveSeedAccountRoleCodes(account) {
  if (account.scopeLevel !== 'TENANT') {
    return account.roleCodes ?? [];
  }

  const roleCodes = new Set(account.roleCodes ?? []);
  roleCodes.add('account.basic');
  if (roleCodes.has('tenant.admin')) {
    roleCodes.add('hr.admin');
    roleCodes.add('item_master.product_data_manager');
  }
  return [...roleCodes];
}

export const SEEDED_ROLE_BINDINGS = SEEDED_USERS.flatMap((user) =>
  user.accounts.flatMap((account) =>
    resolveSeedAccountRoleCodes(account).map((roleCode) => ({
      accountId: account.id,
      roleCode,
      companyKey: account.companyKey,
    }))
  )
);

export const EXPECTED_ROLE_CODES = new Set([
  'system.admin',
  'tenant.admin',
  'hr.admin',
  'account.basic',
  'item_master.product_data_manager',
  'mes.forming_workshop.supervisor',
  'extension.designer',
]);

export const MANAGED_TENANT_IDS = SEEDED_COMPANIES.map((company) => company.id);
export const MANAGED_USER_IDS = SEEDED_USERS.map((user) => user.id);
export const MANAGED_ACCOUNT_IDS = SEEDED_USERS.flatMap((user) => user.accounts.map((account) => account.id));
export const SYSTEM_ACCOUNT_IDS = ALL_SEEDED_USERS.flatMap((user) =>
  user.accounts.filter((account) => account.scopeLevel === 'SYSTEM').map((account) => account.id)
);
// Grants platform administrator access to dedicated SYSTEM account contexts.
export const SYSTEM_ADMIN_ACCOUNT_IDS = [
  ...SYSTEM_ACCOUNT_IDS,
];
// Tenant account contexts must not receive platform administrator role bindings.
export const TENANT_SYSTEM_ADMIN_ACCOUNT_ROLE_BINDINGS = [];
export const MANAGED_TENANT_PARTY_IDS = [
  ...SEEDED_COMPANIES.map((company) => company.organizationTenantPartyId),
  ...getLiveEmployeeFixtures().map((employee) => employee.tenantPartyId),
];
export const MANAGED_EMPLOYEE_IDS = getLiveEmployeeFixtures().map((employee) => employee.employeeId);
export const MANAGED_EMPLOYMENT_IDS = getLiveEmployeeFixtures().flatMap((employee) =>
  employee.employments.map((employment) => employment.id)
);

export const SEEDED_LOGIN_IDENTIFIERS = SEEDED_USERS.flatMap((user) => [user.email, user.phone]);
export const SEEDED_OTP_IDENTIFIERS = [...new Set([...SEEDED_LOGIN_IDENTIFIERS, ...LEGACY_IDENTIFIERS])];

// Builds the deterministic local PDA login smoke grant without broadening tenant role terminal defaults.
export function buildPdaLoginSmokeSeed() {
  const tenantKey = 'meilong';
  const accountKey = 'account.chen-shuangpeng.meilong';
  const navigationRoleCode = 'account.basic';
  const tenant = companyByKey.get(tenantKey);
  const account = accountByKey.get(accountKey);
  const user = SEEDED_USERS.find((candidate) => candidate.id === account?.userId);
  const navigationRole = buildSeedTenantRoles().find(
    (role) => role.tenantId === tenant?.id && role.code === navigationRoleCode
  );

  if (!tenant || !account || !user || !navigationRole) {
    throw new Error('PDA login smoke seed fixtures are incomplete.');
  }

  return {
    key: 'pda-login-smoke',
    tenantKey,
    tenantId: tenant.id,
    accountKey,
    accountId: account.id,
    userId: user.id,
    identifier: user.email,
    password: DEFAULT_PASSWORD,
    terminal: 'PDA',
    accountTerminalAccessOverride: {
      accountId: account.id,
      scopeLevel: 'TENANT',
      tenantId: tenant.id,
      allowedTerminals: ['WEB', 'PDA'],
    },
    roleNavigationVisibility: {
      roleId: navigationRole.id,
      entryKey: 'pda.home',
      terminal: 'PDA',
      enabled: true,
    },
    roleLandingPolicy: {
      roleId: navigationRole.id,
      terminal: 'PDA',
      defaultEntryKey: 'pda.home',
      priority: 1000,
      enabled: true,
    },
    terminalLoginPolicy: {
      terminal: 'PDA',
      enabledLoginFlows: ['PASSWORD'],
    },
    tenantTerminalMfaPolicy: {
      tenantId: tenant.id,
      terminal: 'PDA',
      loginMfaRequired: false,
      newDeviceMfaRequired: false,
      allowedFactors: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'],
      factorPriority: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'],
    },
  };
}

// Builds the deterministic local browser-extension designer login grant for the first plugin demo.
export function buildBrowserExtensionDesignerDemoSeed() {
  const tenantKey = 'meilong';
  const accountKey = 'account.chen-shuangpeng.meilong';
  const navigationRoleCode = 'extension.designer';
  const tenant = companyByKey.get(tenantKey);
  const account = accountByKey.get(accountKey);
  const user = SEEDED_USERS.find((candidate) => candidate.id === account?.userId);
  const navigationRole = buildSeedTenantRoles().find(
    (role) => role.tenantId === tenant?.id && role.code === navigationRoleCode
  );

  if (!tenant || !account || !user || !navigationRole) {
    throw new Error('Browser extension designer demo seed fixtures are incomplete.');
  }

  return {
    key: 'browser-extension-designer-demo',
    tenantKey,
    tenantId: tenant.id,
    accountKey,
    accountId: account.id,
    userId: user.id,
    identifier: user.email,
    password: DEFAULT_PASSWORD,
    terminal: 'BROWSER_EXTENSION',
    accountTerminalAccessOverride: {
      accountId: account.id,
      scopeLevel: 'TENANT',
      tenantId: tenant.id,
      allowedTerminals: ['WEB', 'PDA', 'BROWSER_EXTENSION'],
    },
    roleTerminalAccess: {
      roleId: navigationRole.id,
      allowedTerminals: ['WEB', 'BROWSER_EXTENSION'],
    },
    roleNavigationVisibility: {
      roleId: navigationRole.id,
      entryKey: 'extension.designer.workspace',
      terminal: 'BROWSER_EXTENSION',
      enabled: true,
    },
    roleLandingPolicy: {
      roleId: navigationRole.id,
      terminal: 'BROWSER_EXTENSION',
      defaultEntryKey: 'extension.designer.workspace',
      priority: 1000,
      enabled: true,
    },
    terminalLoginPolicy: {
      terminal: 'BROWSER_EXTENSION',
      enabledLoginFlows: ['PASSWORD'],
    },
    tenantTerminalMfaPolicy: {
      tenantId: tenant.id,
      terminal: 'BROWSER_EXTENSION',
      loginMfaRequired: false,
      newDeviceMfaRequired: false,
      allowedFactors: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'],
      factorPriority: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'],
    },
  };
}

// Summarizes the seeded memberships per person so local operators can quickly choose a login context.
export const SEEDED_USER_MEMBERSHIPS = new Map(
  SEEDED_USERS.map((user) => {
    const memberships = user.accounts.flatMap((account) =>
      resolveSeedAccountRoleCodes(account).map((roleCode) =>
        account.companyKey ? `${roleCode}@${account.companyKey}` : roleCode
      )
    );
    return [user.personName, memberships];
  })
);

export function buildSeedAccounts() {
  return SEEDED_USERS.flatMap((user) =>
    user.accounts.map((account) => {
      const company = account.companyKey ? companyByKey.get(account.companyKey) : null;
      const employee = account.bindEmployeeKey ? employeeByKey.get(account.bindEmployeeKey) : null;

      return {
        id: account.id,
        avatarUrl: user.avatarUrl,
        contextKey: account.scopeLevel === 'SYSTEM' ? account.contextKey ?? 'SYSTEM' : company.id,
        displayName: account.displayName,
        scopeLevel: account.scopeLevel,
        tenantId: account.scopeLevel === 'SYSTEM' ? null : company.id,
        tenantPartyId: employee?.tenantPartyId ?? null,
        userId: user.id,
        workEmail: account.workEmail ?? null,
      };
    })
  );
}

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
      assignedBy: ROOT_CREATED_BY,
    }));
}

export function buildSeedTenantRoles() {
  return SEEDED_TENANT_ROLES.map((role) => {
    const company = companyByKey.get(role.companyKey);
    return {
      ...role,
      kind: 'TENANT_INSTANCE',
      scopeKey: company.id,
      tenantId: company.id,
      templateRoleId: role.templateRoleId,
      isEnabled: true,
      isProtected: role.isProtected,
      allowTenantPermissionOverride: role.allowTenantPermissionOverride,
    };
  });
}

export function buildSeedAccountRoleBindings() {
  const roleByScopedCode = new Map(
    buildSeedTenantRoles().map((role) => [`${role.code}@${role.tenantId}`, role])
  );

  return SEEDED_ROLE_BINDINGS.filter((binding) => binding.roleCode !== 'system.admin').map((binding) => {
    const account = SEEDED_USERS.flatMap((user) => user.accounts).find((candidate) => candidate.id === binding.accountId);
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
  });
}

export function buildSeedTenantOrgTenants() {
  return SEEDED_COMPANIES.map((company) => ({
    id: company.id,
    code: company.code,
    name: company.name,
    employeeCodePrefix: company.employeeCodePrefix,
    rootOrgId: company.rootOrgId,
    status: 'ACTIVE',
  }));
}

export function buildSeedTenantOrgRootUnits() {
  return buildSeedTenantOrgUnits().filter((orgUnit) => orgUnit.depth === 0);
}

export function buildSeedTenantOrgUnits() {
  return getLiveOrgUnitFixtures().map((orgUnit) => {
    const company = companyByKey.get(orgUnit.tenantKey);
    return {
      id: orgUnit.id,
      tenantId: company.id,
      parentOrgId: orgUnit.parentKey ? orgUnitByKey.get(orgUnit.parentKey).id : null,
      name: orgUnit.name,
      type: orgUnit.type,
      status: 'ACTIVE',
      path: buildOrgPath(orgUnit.key),
      depth: buildOrgDepth(orgUnit.key),
      sortOrder: orgUnit.sortOrder,
      organizationTenantPartyId: orgUnit.organizationTenantPartyId ?? null,
    };
  });
}

export function buildSeedIdentityTenants() {
  return SEEDED_COMPANIES.map((company) => ({
    id: company.id,
    code: company.code,
    name: company.name,
    isActive: true,
  }));
}

export function buildSeedIdentityOrgs() {
  return getLiveOrgUnitFixtures().filter((orgUnit) => orgUnit.type !== 'ROOT').map((orgUnit) => {
    const company = companyByKey.get(orgUnit.tenantKey);
    const parent = orgUnit.parentKey ? orgUnitByKey.get(orgUnit.parentKey) : null;

    return {
      id: orgUnit.id,
      tenantId: company.id,
      parentId: parent?.type === 'ROOT' ? null : parent?.id ?? null,
      name: orgUnit.name,
      code: orgUnit.key.replaceAll('.', '_'),
      type: orgUnit.type === 'TEAM' ? 'TEAM' : orgUnit.type === 'BRANCH' ? 'BRANCH' : 'DEPARTMENT',
      order: orgUnit.sortOrder,
      createdBy: ROOT_CREATED_BY,
    };
  });
}

export function buildSeedIdentityEmployeeBindings() {
  return SEEDED_USERS.flatMap((user) =>
    user.accounts
      .filter((account) => account.scopeLevel === 'TENANT' && account.bindEmployeeKey)
      .map((account) => ({
        id: `binding-${account.id}`,
        tenantId: companyByKey.get(account.companyKey).id,
        accountId: account.id,
        employeeId: employeeByKey.get(account.bindEmployeeKey).employeeId,
      }))
  );
}

export function buildSeedIdentityOrgMemberships() {
  return SEEDED_USERS.flatMap((user) =>
    user.accounts
      .filter((account) => account.scopeLevel === 'TENANT' && account.primaryOrgKey)
      .map((account) => ({
        id: `membership-${account.id}`,
        accountId: account.id,
        orgId: orgUnitByKey.get(account.primaryOrgKey).id,
        relationType: 'PRIMARY',
        isPrimary: true,
      }))
  );
}

export function buildSeedTenantParties() {
  const organizationTenantParties = SEEDED_COMPANIES.map((company) => ({
    id: company.organizationTenantPartyId,
    tenantId: company.id,
    type: 'ORGANIZATION',
    legalName: company.name,
    displayName: company.rootOrgName,
    localCode: company.code,
    registeredCountry: 'CN',
    tags: null,
    status: 'ACTIVE',
  }));

  const personTenantParties = getLiveEmployeeFixtures().map((employee) => ({
    id: employee.tenantPartyId,
    tenantId: companyByKey.get(employee.tenantKey).id,
    type: 'PERSON',
    legalName: employee.personName,
    displayName: employee.personName,
    localCode: buildEmployeeDisplayCode(employee),
    registeredCountry: null,
    tags: null,
    status: 'ACTIVE',
  }));

  return [...organizationTenantParties, ...personTenantParties];
}

export function buildSeedHrEmployees() {
  return getLiveEmployeeFixtures().map((employee) => ({
    id: employee.employeeId,
    tenantId: companyByKey.get(employee.tenantKey).id,
    tenantPartyId: employee.tenantPartyId,
    employeeCode: employee.employeeCode,
    lifecycleStatus: employee.lifecycleStatus,
  }));
}

export function buildSeedEmployments() {
  return getLiveEmployeeFixtures().flatMap((employee) =>
    employee.employments.map((employment) => ({
      id: employment.id,
      tenantId: companyByKey.get(employee.tenantKey).id,
      employeeId: employee.employeeId,
      orgUnitId: orgUnitByKey.get(employment.orgKey).id,
      positionName: employment.positionName ?? null,
      status: employment.status,
      effectiveFrom: new Date(employment.effectiveFrom),
      effectiveTo: employment.effectiveTo ? new Date(employment.effectiveTo) : null,
      endedReason: employment.endedReason ?? null,
      activeSlot: employment.status === 'ACTIVE' ? employment.id : null,
    }))
  );
}

export function buildSeedOnboardingAccesses() {
  return getLiveEmployeeFixtures().filter((employee) => employee.access).map((employee) => {
    const activeEmployment = employee.employments.find((employment) => employment.status === 'ACTIVE');
    const access = employee.access;
    const account = access.accountKey ? accountByKey.get(access.accountKey) : null;

    return {
      id: access.onboardingId,
      tenantId: companyByKey.get(employee.tenantKey).id,
      employeeId: employee.employeeId,
      employmentId: activeEmployment?.id ?? employee.employments.at(-1)?.id ?? null,
      accountId: account?.id ?? null,
      status: access.status,
      grantIdempotencyKey: `seed:${employee.key}`,
      failureReason: access.failureReason ?? null,
    };
  });
}

export function buildSeedUsers() {
  return SEEDED_USERS.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    isActive: true,
  }));
}

export function buildSeedSummary() {
  return {
    tenants: SEEDED_COMPANIES.map((company) => company.name),
    employeeCount: getLiveEmployeeFixtures().length,
    orgUnitCount: getLiveOrgUnitFixtures().length,
    loginUsers: SEEDED_USERS.map((user) => `${user.personName}<${user.email}>`),
    lifecycleCoverage: Array.from(new Set(getLiveEmployeeFixtures().map((employee) => employee.lifecycleStatus))).sort(),
    accessCoverage: Array.from(
      new Set(
        getLiveEmployeeFixtures().map((employee) => employee.access?.status ?? 'NOT_ENABLED')
      )
    ).sort(),
  };
}

// Returns the compact local live seed employee set used across party, HR, identity, and auth fixtures.
function getLiveEmployeeFixtures() {
  return EMPLOYEE_FIXTURES.filter((employee) => LIVE_SEED_EMPLOYEE_KEYS.has(employee.key));
}

// Returns only the org units needed by the compact tenant-web local baseline.
function getLiveOrgUnitFixtures() {
  return ORG_UNIT_FIXTURES.filter((orgUnit) => LIVE_SEED_ORG_UNIT_KEYS.has(orgUnit.key));
}
