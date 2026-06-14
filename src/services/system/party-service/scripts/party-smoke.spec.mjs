import test from 'node:test';
import assert from 'node:assert/strict';

import { createSmokeSeed, runPartySmokeFlow } from './party-smoke-lib.mjs';

// Verifies the smoke flow registers a tenant party, finds it through candidates, and resolves it by id.
test('runPartySmokeFlow executes the expected happy path against injected service stubs', async () => {
  const calls = [];
  const seed = createSmokeSeed(1710000000000);

  const services = {
    registration: {
      registerTenantParty: async (request) => {
        calls.push(['registerTenantParty', request]);
        return {
          tenantParty: {
            id: 'tenant-party-1',
            tenantId: request.tenantId,
            type: request.type,
            legalName: request.legalName,
          },
          matchResult: 'CREATED',
        };
      },
    },
    query: {
      searchTenantPartyCandidates: async (request) => {
        calls.push(['searchTenantPartyCandidates', request]);
        return {
          candidates: [
            {
              tenantParty: {
                id: 'tenant-party-1',
              },
            },
          ],
        };
      },
      getTenantPartyById: async (request) => {
        calls.push(['getTenantPartyById', request]);
        return {
          tenantParty: {
            id: request.tenantPartyId,
            tenantId: request.tenantId,
          },
        };
      },
    },
  };

  const result = await runPartySmokeFlow(services, seed);

  assert.deepEqual(result, {
    tenantPartyId: 'tenant-party-1',
    matchResult: 'CREATED',
  });

  assert.equal(calls.length, 3);
  assert.equal(calls[0][0], 'registerTenantParty');
  assert.equal(calls[1][0], 'searchTenantPartyCandidates');
  assert.equal(calls[2][0], 'getTenantPartyById');
  assert.equal(calls[0][1].type, 'ORGANIZATION');
  assert.equal(calls[1][1].partyType, 'ORGANIZATION');
  assert.equal(calls[2][1].tenantPartyId, 'tenant-party-1');
});

// Verifies the smoke flow fails loudly when the downstream service returns an incomplete registration response.
test('runPartySmokeFlow throws when registration response is incomplete', async () => {
  const seed = createSmokeSeed(1710000000001);

  await assert.rejects(
    () =>
      runPartySmokeFlow(
        {
          registration: {
            registerTenantParty: async () => ({
              tenantParty: {
                id: '',
              },
            }),
          },
          query: {
            searchTenantPartyCandidates: async () => ({ candidates: [] }),
            getTenantPartyById: async () => ({ tenantParty: undefined }),
          },
        },
        seed,
      ),
    /registerTenantParty did not return tenantParty id/,
  );
});
