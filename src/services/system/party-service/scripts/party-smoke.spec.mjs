import test from 'node:test';
import assert from 'node:assert/strict';

import { createSmokeSeed, runPartySmokeFlow } from './party-smoke-lib.mjs';

// Verifies the smoke flow registers a party, finds it through candidates, and resolves the tenant binding.
test('runPartySmokeFlow executes the expected happy path against injected service stubs', async () => {
  const calls = [];
  const seed = createSmokeSeed(1710000000000);

  const services = {
    registration: {
      registerOrganizationParty: async (request) => {
        calls.push(['registerOrganizationParty', request]);
        return {
          party: {
            id: 'party-1',
            legalName: request.legalName,
          },
          tenantParty: {
            id: 'tenant-party-1',
            tenantId: request.tenantId,
            partyId: 'party-1',
          },
          matchResult: 'CREATED',
        };
      },
    },
    query: {
      searchPartyCandidates: async (request) => {
        calls.push(['searchPartyCandidates', request]);
        return {
          candidates: [
            {
              party: {
                id: 'party-1',
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
            partyId: 'party-1',
          },
        };
      },
    },
  };

  const result = await runPartySmokeFlow(services, seed);

  assert.deepEqual(result, {
    partyId: 'party-1',
    tenantPartyId: 'tenant-party-1',
    matchResult: 'CREATED',
  });

  assert.equal(calls.length, 3);
  assert.equal(calls[0][0], 'registerOrganizationParty');
  assert.equal(calls[1][0], 'searchPartyCandidates');
  assert.equal(calls[2][0], 'getTenantPartyById');
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
            registerOrganizationParty: async () => ({
              party: {
                id: '',
              },
              tenantParty: {
                id: '',
              },
            }),
          },
          query: {
            searchPartyCandidates: async () => ({ candidates: [] }),
            getTenantPartyById: async () => ({ tenantParty: undefined }),
          },
        },
        seed,
      ),
    /registerOrganizationParty did not return party and tenantParty ids/,
  );
});
