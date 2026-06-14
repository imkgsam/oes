import { PolicyInstance } from '../application/authorization/resource-policy'

export const POLICY_INSTANCE_FIXTURE_TENANT_ID = '__policy_template_instance_fixture_tenant__'
export const POLICY_INSTANCE_FIXTURE_ACCOUNT_ID = '__policy_template_instance_fixture_account__'

export type PolicyInstanceFoundationSeed = PolicyInstance

export const POLICY_INSTANCE_FOUNDATION_SEEDS: PolicyInstanceFoundationSeed[] = [
  {
    id: 'policy-fixture-crm-owner-visible',
    tenantId: POLICY_INSTANCE_FIXTURE_TENANT_ID,
    subjectSelector: {
      type: 'ACCOUNT',
      accountId: POLICY_INSTANCE_FIXTURE_ACCOUNT_ID
    },
    permissionCode: 'crm.account.read',
    resourceType: 'crm-account',
    templateCode: 'resource-field-matches-subject-field',
    effect: 'ALLOW',
    params: {
      resourceField: 'ownerAccountId',
      subjectField: 'accountId'
    },
    enabled: true,
    priority: 100,
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: '2026-05-16T00:00:00.000Z',
    updatedAt: '2026-05-16T00:00:00.000Z'
  },
  {
    id: 'policy-fixture-srm-responsible-buyer-visible',
    tenantId: POLICY_INSTANCE_FIXTURE_TENANT_ID,
    subjectSelector: {
      type: 'ACCOUNT',
      accountId: POLICY_INSTANCE_FIXTURE_ACCOUNT_ID
    },
    permissionCode: 'srm.supplier_profile.list',
    resourceType: 'supplier-profile',
    templateCode: 'resource-field-matches-subject-field',
    effect: 'ALLOW',
    params: {
      resourceField: 'responsibleBuyerAccountId',
      subjectField: 'accountId'
    },
    enabled: true,
    priority: 100,
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: '2026-05-16T00:00:00.000Z',
    updatedAt: '2026-05-16T00:00:00.000Z'
  },
  {
    id: 'policy-fixture-procurement-category-scope',
    tenantId: POLICY_INSTANCE_FIXTURE_TENANT_ID,
    subjectSelector: {
      type: 'ACCOUNT',
      accountId: POLICY_INSTANCE_FIXTURE_ACCOUNT_ID
    },
    permissionCode: 'procurement.purchase_request.create',
    resourceType: 'item',
    templateCode: 'resource-field-in-set',
    effect: 'ALLOW',
    params: {
      field: 'categoryId',
      allowedValues: ['fixture-raw-material', 'fixture-packaging']
    },
    enabled: true,
    priority: 100,
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: '2026-05-16T00:00:00.000Z',
    updatedAt: '2026-05-16T00:00:00.000Z'
  }
]

/** buildPolicyInstanceFoundationSeeds returns fixture-only policy instances for internal authorization smoke tests. */
export function buildPolicyInstanceFoundationSeeds(): PolicyInstanceFoundationSeed[] {
  return POLICY_INSTANCE_FOUNDATION_SEEDS.map((seed) => ({
    ...seed,
    subjectSelector: { ...seed.subjectSelector },
    params: { ...seed.params }
  }))
}
