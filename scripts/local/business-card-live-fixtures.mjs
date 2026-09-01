import {
  buildSeedAccountRoleBindings,
  buildSeedAccounts,
  buildSeedContactAssets,
  buildSeedIdentityEmployeeBindings,
} from './tenant-web-auth-test-fixtures.mjs';

const DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001';
const DEFAULT_OPERATOR_ACCOUNT_ID = '00000000-0000-4000-8000-000000000901';
const DEFAULT_SELF_ACCOUNT_ID = '00000000-0000-4000-8000-000000000903';
const DEFAULT_UNAVAILABLE_ACCOUNT_ID = '00000000-0000-4000-8000-000000000905';

export const PUBLIC_BUSINESS_CARD_ACCEPTANCE_IDS = Object.freeze({
  available: Object.freeze({
    businessCardId: '00000000-0000-4000-8000-000000000701',
    shortLinkId: '00000000-0000-4000-8000-000000000801',
    shortCode: 'PBCAV01',
  }),
  disabled: Object.freeze({
    businessCardId: '00000000-0000-4000-8000-000000000702',
    shortLinkId: '00000000-0000-4000-8000-000000000802',
    shortCode: 'PBCDS01',
  }),
  unavailable: Object.freeze({
    businessCardId: '00000000-0000-4000-8000-000000000703',
    shortLinkId: '00000000-0000-4000-8000-000000000803',
    shortCode: 'PBCUN01',
  }),
  notFound: Object.freeze({
    businessCardId: '00000000-0000-4000-8000-000000000799',
  }),
});

/** buildBusinessCardLiveFixtureSeed derives one reusable live-stack fixture from tenant-web auth seed data. */
export function buildBusinessCardLiveFixtureSeed({
  tenantId = DEFAULT_TENANT_ID,
  operatorAccountId = DEFAULT_OPERATOR_ACCOUNT_ID,
  selfAccountId = DEFAULT_SELF_ACCOUNT_ID,
} = {}) {
  const accounts = buildSeedAccounts();
  const bindings = buildSeedIdentityEmployeeBindings();
  const roleBindings = buildSeedAccountRoleBindings();
  const contactAssets = buildSeedContactAssets();
  const operatorAccount = accounts.find((account) => account.id === operatorAccountId);
  const selfAccount = accounts.find((account) => account.id === selfAccountId);
  const unavailableAccount = accounts.find((account) => account.id === DEFAULT_UNAVAILABLE_ACCOUNT_ID);
  const operatorEmployeeBinding = bindings.find((binding) => binding.accountId === operatorAccountId);
  const selfEmployeeBinding = bindings.find((binding) => binding.accountId === selfAccountId);
  const unavailableEmployeeBinding = bindings.find(
    (binding) => binding.accountId === DEFAULT_UNAVAILABLE_ACCOUNT_ID
  );
  const workEmailContactAsset = contactAssets.find(
    (asset) => asset.accountId === selfAccountId && asset.type === 'WORK_EMAIL' && asset.status === 'ACTIVE'
  );

  if (!operatorAccount || operatorAccount.tenantId !== tenantId) {
    throw new Error(`BusinessCard live fixture operator account ${operatorAccountId} is not in tenant ${tenantId}`);
  }
  if (!roleBindings.some((binding) => binding.accountId === operatorAccountId && binding.tenantId === tenantId)) {
    throw new Error(`BusinessCard live fixture operator account ${operatorAccountId} has no tenant role binding`);
  }
  if (!selfAccount || selfAccount.tenantId !== tenantId) {
    throw new Error(`BusinessCard live fixture self account ${selfAccountId} is not in tenant ${tenantId}`);
  }
  if (!selfEmployeeBinding?.employeeId || selfEmployeeBinding.tenantId !== tenantId) {
    throw new Error(`BusinessCard live fixture self account ${selfAccountId} has no tenant employee binding`);
  }
  if (!operatorEmployeeBinding?.employeeId || operatorEmployeeBinding.tenantId !== tenantId) {
    throw new Error(`BusinessCard live fixture operator account ${operatorAccountId} has no tenant employee binding`);
  }
  if (
    !unavailableAccount?.tenantId
    || !unavailableEmployeeBinding?.employeeId
    || unavailableEmployeeBinding.tenantId !== unavailableAccount.tenantId
  ) {
    throw new Error('BusinessCard unavailable fixture has no isolated tenant employee binding');
  }
  if (!workEmailContactAsset?.id || workEmailContactAsset.tenantId !== tenantId) {
    throw new Error(`BusinessCard live fixture self account ${selfAccountId} has no active work email Contact Asset`);
  }

  return {
    tenantId,
    employeeId: selfEmployeeBinding.employeeId,
    operatorAccountId,
    selfAccountId,
    workEmailContactAssetId: workEmailContactAsset.id,
    publicCards: {
      available: {
        ...PUBLIC_BUSINESS_CARD_ACCEPTANCE_IDS.available,
        tenantId,
        employeeId: selfEmployeeBinding.employeeId,
      },
      disabled: {
        ...PUBLIC_BUSINESS_CARD_ACCEPTANCE_IDS.disabled,
        tenantId,
        employeeId: operatorEmployeeBinding.employeeId,
      },
      unavailable: {
        ...PUBLIC_BUSINESS_CARD_ACCEPTANCE_IDS.unavailable,
        tenantId: unavailableAccount.tenantId,
        employeeId: unavailableEmployeeBinding.employeeId,
      },
      notFound: PUBLIC_BUSINESS_CARD_ACCEPTANCE_IDS.notFound,
    },
  };
}

/** renderBusinessCardLiveFixtureEnv prints env lines consumed by BusinessCard live preflight and smoke commands. */
export function renderBusinessCardLiveFixtureEnv(seed = buildBusinessCardLiveFixtureSeed()) {
  return [
    `BUSINESS_CARD_LIVE_TENANT_ID=${seed.tenantId}`,
    `BUSINESS_CARD_LIVE_EMPLOYEE_ID=${seed.employeeId}`,
    `BUSINESS_CARD_LIVE_OPERATOR_ACCOUNT_ID=${seed.operatorAccountId}`,
    `BUSINESS_CARD_LIVE_SELF_ACCOUNT_ID=${seed.selfAccountId}`,
    `BUSINESS_CARD_LIVE_WORK_EMAIL_CONTACT_ASSET_ID=${seed.workEmailContactAssetId}`,
    `BUSINESS_CARD_LIVE_AVAILABLE_CARD_ID=${seed.publicCards.available.businessCardId}`,
    `BUSINESS_CARD_LIVE_DISABLED_CARD_ID=${seed.publicCards.disabled.businessCardId}`,
    `BUSINESS_CARD_LIVE_UNAVAILABLE_CARD_ID=${seed.publicCards.unavailable.businessCardId}`,
    `BUSINESS_CARD_LIVE_NOT_FOUND_CARD_ID=${seed.publicCards.notFound.businessCardId}`,
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(renderBusinessCardLiveFixtureEnv());
}
