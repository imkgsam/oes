import test from 'node:test';
import assert from 'node:assert/strict';

import { createSmokeSeed, runCrmSmokeFlow } from './crm-smoke-lib.mjs';

// Verifies the minimal CRM smoke flow keeps an unbound customer out of the selector and binds it when party-service is available.
test('crm smoke flow / should create an account and bind it into the selector when party registration is available', async () => {
  const calls = [];
  const seed = createSmokeSeed(1700000000000);

  const result = await runCrmSmokeFlow(
    {
      crm: {
        query: {
          searchSelectableCustomers: async (request) => {
            calls.push(['searchSelectableCustomers', request]);

            if (calls.length === 1) {
              return {
                customers: [],
                total: 0,
                page: request.page,
                pageSize: request.pageSize,
              };
            }

            if (calls.length === 3) {
              return {
                customers: [],
                total: 0,
                page: request.page,
                pageSize: request.pageSize,
              };
            }

            return {
              customers: [
                {
                  customerAccountId: 'customer-1',
                  customerAccountNo: 'CA-0001',
                  displayName: seed.displayName,
                  status: 1,
                  primaryTenantPartyId: 'tenant-party-1',
                  primaryPartyDisplayName: seed.partyLocalDisplayName,
                },
              ],
              total: 1,
              page: request.page,
              pageSize: request.pageSize,
            };
          },
        },
        management: {
          createCustomerAccount: async (request) => {
            calls.push(['createCustomerAccount', request]);
            return {
              customerAccount: {
                customerAccountId: 'customer-1',
                customerAccountNo: 'CA-0001',
                tenantId: request.tenantId,
                displayName: request.displayName,
                status: 1,
                tags: request.tags ?? [],
              },
            };
          },
          bindCustomerAccountToTenantParty: async (request) => {
            calls.push(['bindCustomerAccountToTenantParty', request]);
            return {
              customerAccount: {
                customerAccountId: request.customerAccountId,
                customerAccountNo: 'CA-0001',
                tenantId: request.tenantId,
                displayName: seed.displayName,
                status: 1,
                primaryBinding: {
                  customerPartyBindingId: 'binding-1',
                  tenantPartyId: request.tenantPartyId,
                  bindingStatus: 1,
                  partyDisplayName: seed.partyLocalDisplayName,
                },
              },
            };
          },
        },
      },
      party: {
        registration: {
          registerOrganizationParty: async (request) => {
            calls.push(['registerOrganizationParty', request]);
            return {
              party: { id: 'party-1' },
              tenantParty: { id: 'tenant-party-1' },
              matchResult: 'CREATED',
            };
          },
        },
      },
    },
    seed,
  );

  assert.equal(result.customerAccountId, 'customer-1');
  assert.equal(result.binding.status, 'bound');
  assert.equal(result.binding.tenantPartyId, 'tenant-party-1');
  assert.equal(result.selectableTotals.beforeCreate, 0);
  assert.equal(result.selectableTotals.afterCreate, 0);
  assert.equal(result.selectableTotals.afterBind, 1);
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      'searchSelectableCustomers',
      'createCustomerAccount',
      'searchSelectableCustomers',
      'registerOrganizationParty',
      'bindCustomerAccountToTenantParty',
      'searchSelectableCustomers',
    ],
  );
});

// Verifies the minimal CRM smoke flow still succeeds when party-service is unavailable and binding must be skipped explicitly.
test('crm smoke flow / should skip binding when party registration is unavailable', async () => {
  const seed = createSmokeSeed(1700000000001);

  const result = await runCrmSmokeFlow(
    {
      crm: {
        query: {
          searchSelectableCustomers: async (request) => ({
            customers: [],
            total: 0,
            page: request.page,
            pageSize: request.pageSize,
          }),
        },
        management: {
          createCustomerAccount: async (request) => ({
            customerAccount: {
              customerAccountId: 'customer-2',
              customerAccountNo: 'CA-0002',
              tenantId: request.tenantId,
              displayName: request.displayName,
              status: 1,
            },
          }),
        },
      },
    },
    seed,
  );

  assert.equal(result.customerAccountId, 'customer-2');
  assert.equal(result.binding.status, 'skipped');
  assert.equal(result.binding.reason, 'party-service unavailable');
  assert.equal(result.selectableTotals.beforeCreate, 0);
  assert.equal(result.selectableTotals.afterCreate, 0);
  assert.equal(result.selectableTotals.afterBind, null);
});

// Verifies optional party unavailability can be surfaced by the caller without re-running the CRM creation flow.
test('crm smoke flow / should skip binding when the party registration client marks the environment unavailable', async () => {
  const seed = createSmokeSeed(1700000000002);
  let createCount = 0;

  const result = await runCrmSmokeFlow(
    {
      crm: {
        query: {
          searchSelectableCustomers: async (request) => ({
            customers: [],
            total: 0,
            page: request.page,
            pageSize: request.pageSize,
          }),
        },
        management: {
          createCustomerAccount: async (request) => {
            createCount += 1;
            return {
              customerAccount: {
                customerAccountId: 'customer-3',
                customerAccountNo: 'CA-0003',
                tenantId: request.tenantId,
                displayName: request.displayName,
                status: 1,
              },
            };
          },
        },
      },
      party: {
        registration: {
          registerOrganizationParty: async () => {
            const error = new Error('party-service unavailable');
            error.crmSmokeOptionalPartyUnavailable = true;
            throw error;
          },
        },
      },
    },
    seed,
  );

  assert.equal(createCount, 1);
  assert.equal(result.customerAccountId, 'customer-3');
  assert.equal(result.binding.status, 'skipped');
  assert.equal(result.binding.reason, 'party-service unavailable');
});
