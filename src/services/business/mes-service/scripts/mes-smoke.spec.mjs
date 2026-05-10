import test from 'node:test';
import assert from 'node:assert/strict';

import { createSmokeSeed, runMesSmokeFlow } from './mes-smoke-lib.mjs';

// Verifies the MES smoke helper traverses ProductionSpec, ProductionMold, ToolingInstallation, usage, idempotency, and outbox checks.
test('mes smoke flow / should execute the current mold tooling runtime path with idempotency and outbox checks', async () => {
  const calls = [];
  const seed = createSmokeSeed(1700000000650);
  const productionSpecId = `spec-${seed.productionSpecCode}`;
  const moldDesignId = `design-${seed.designCode}`;
  const productionMoldId = `mold-${seed.moldCode}`;
  const toolingInstallationId = `install-${seed.moldCode}`;
  const moldUsageRecordId = `usage-${seed.moldCode}`;
  const moldLifeCounterId = `counter-${seed.moldCode}`;

  const result = await runMesSmokeFlow(
    {
      specManagement: {
        createProductionSpec: async (request) => {
          calls.push(['createProductionSpec', request]);
          return {
            productionSpec: {
              productionSpecId,
              specCode: seed.productionSpecCode,
              name: request.name,
              status: 1,
              version: 1
            }
          };
        },
        activateProductionSpec: async (request) => {
          calls.push(['activateProductionSpec', request]);
          return {
            productionSpec: {
              productionSpecId: request.productionSpecId,
              specCode: seed.productionSpecCode,
              name: 'MES Smoke Production Spec',
              status: 2,
              version: 2
            }
          };
        }
      },
      management: {
        registerMoldDesign: async (request) => {
          calls.push(['registerMoldDesign', request]);
          return {
            moldDesign: {
              moldDesignId,
              designCode: seed.designCode
            }
          };
        },
        registerProductionMold: async (request) => {
          calls.push(['registerProductionMold', request]);
          return {
            productionMold: {
              productionMoldId,
              moldCode: request.moldCode,
              currentStatus: 3
            }
          };
        },
        moveTooling: async (request) => {
          calls.push(['moveTooling', request]);
          return {
            placement: {
              placementType: 1,
              storageResourceRef: request.toStorageResourceRef
            }
          };
        },
        installTooling: async (request) => {
          calls.push(['installTooling', request]);
          return {
            toolingInstallation: {
              toolingInstallationId,
              toolingType: request.toolingType,
              toolingId: request.toolingId,
              workCenterRef: request.workCenterRef,
              workUnitRef: request.workUnitRef,
              status: 1,
              moldDetail: {
                toolingInstallationId,
                moldPosition: request.moldPosition
              }
            }
          };
        },
        recordMoldUsage: async (request) => {
          calls.push(['recordMoldUsage', request]);
          return {
            moldUsageRecord: {
              moldUsageRecordId,
              productionMoldId: request.productionMoldId,
              toolingInstallationId: request.toolingInstallationId
            },
            moldLifeCounter: {
              moldLifeCounterId,
              productionMoldId: request.productionMoldId,
              usedValue: request.lifeDelta,
              limitValue: seed.lifeLimitValue
            }
          };
        }
      },
      query: {
        listCurrentMoldsByWorkCenter: async (request) => {
          calls.push(['listCurrentMoldsByWorkCenter', request]);
          return {
            items: [
              {
                productionMold: {
                  productionMoldId
                },
                toolingInstallation: {
                  toolingInstallationId
                }
              }
            ]
          };
        },
        listMoldLifeCounters: async (request) => {
          calls.push(['listMoldLifeCounters', request]);
          return {
            counters: [
              {
                moldLifeCounterId,
                productionMoldId,
                usedValue: seed.lifeDelta
              }
            ],
            total: 1,
            page: request.page,
            pageSize: request.pageSize
          };
        }
      },
      diagnostics: {
        replaySameCommand: async () => {
          calls.push(['replaySameCommand']);
          return {
            productionMoldCount: 1,
            commandOutboxCount: 1,
            commandAuditCount: 1
          };
        },
        conflictSameCommandDifferentPayload: async () => {
          calls.push(['conflictSameCommandDifferentPayload']);
          return { conflicted: true };
        },
        verifyOutbox: async () => {
          calls.push(['verifyOutbox']);
          return {
            pendingCount: 7,
            eventTypes: [
              'ProductionSpecCreated',
              'ProductionSpecActivated',
              'MoldDesignRegistered',
              'ProductionMoldRegistered',
              'ToolingMoved',
              'ToolingInstalled',
              'MoldUsageRecorded'
            ]
          };
        }
      }
    },
    seed
  );

  assert.equal(result.spec.productionSpecId, productionSpecId);
  assert.equal(result.design.moldDesignId, moldDesignId);
  assert.equal(result.mold.productionMoldId, productionMoldId);
  assert.equal(result.currentMolds.items.length, 1);
  assert.equal(result.counters.total, 1);
  assert.equal(result.idempotency.productionMoldCount, 1);
  assert.equal(result.outbox.pendingCount, 7);
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      'createProductionSpec',
      'activateProductionSpec',
      'registerMoldDesign',
      'registerProductionMold',
      'moveTooling',
      'installTooling',
      'recordMoldUsage',
      'listCurrentMoldsByWorkCenter',
      'listMoldLifeCounters',
      'replaySameCommand',
      'conflictSameCommandDifferentPayload',
      'verifyOutbox'
    ]
  );
});
