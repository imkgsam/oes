import test from 'node:test';
import assert from 'node:assert/strict';

import { createSmokeSeed, runMesSmokeFlow } from './mes-smoke-lib.mjs';

// Verifies the minimal MES mold smoke traverses design, instance, movement, installation, usage, queries, idempotency, and outbox checks.
test('mes smoke flow / should execute the phase 1 mold runtime path with idempotency and outbox checks', async () => {
  const calls = [];
  const seed = createSmokeSeed(1700000000650);

  const result = await runMesSmokeFlow(
    {
      management: {
        registerMoldDesign: async (request) => {
          calls.push(['registerMoldDesign', request]);
          return {
            moldDesign: {
              moldDesignId: seed.moldDesignId,
              designCode: seed.designCode
            }
          };
        },
        registerProductionMoldInstance: async (request) => {
          calls.push(['registerProductionMoldInstance', request]);
          return {
            productionMoldInstance: {
              productionMoldInstanceId: seed.productionMoldInstanceId,
              moldInstanceCode: seed.moldInstanceCode,
              currentStatus: 3
            },
            moldLifeCounter: {
              productionMoldInstanceId: seed.productionMoldInstanceId,
              usedValue: '0',
              limitValue: seed.lifeLimitValue,
              warningThresholdValue: seed.warningThresholdValue
            }
          };
        },
        moveMold: async (request) => {
          calls.push(['moveMold', request]);
          return {
            movementEvent: {
              moldMovementEventId: seed.movementEventId,
              moldResourceId: request.moldResourceId
            },
            moldCurrentLocation: {
              moldResourceId: request.moldResourceId,
              currentMesLocationSummary: {
                mesLocationId: seed.readyLocationId
              }
            }
          };
        },
        installMold: async (request) => {
          calls.push(['installMold', request]);
          return {
            moldInstallation: {
              moldInstallationId: seed.moldInstallationId,
              productionMoldInstanceId: request.productionMoldInstanceId,
              workCenterId: request.workCenterId,
              resourcePositionId: request.resourcePositionId
            },
            productionMoldInstance: {
              productionMoldInstanceId: request.productionMoldInstanceId,
              currentStatus: 4
            }
          };
        },
        recordMoldUsage: async (request) => {
          calls.push(['recordMoldUsage', request]);
          return {
            usageEvent: {
              moldUsageEventId: seed.moldUsageEventId,
              productionMoldInstanceId: request.productionMoldInstanceId
            },
            moldLifeCounter: {
              productionMoldInstanceId: request.productionMoldInstanceId,
              usedValue: request.lifeDelta,
              limitValue: seed.lifeLimitValue,
              warningThresholdValue: seed.warningThresholdValue
            },
            raisedWarning: {
              moldWarningEventId: seed.moldWarningEventId,
              productionMoldInstanceId: request.productionMoldInstanceId,
              warningLevel: 2
            }
          };
        }
      },
      query: {
        listCurrentMoldsByWorkCenter: async (request) => {
          calls.push(['listCurrentMoldsByWorkCenter', request]);
          return {
            installedMolds: [
              {
                productionMoldInstance: {
                  productionMoldInstanceId: seed.productionMoldInstanceId
                },
                moldInstallation: {
                  moldInstallationId: seed.moldInstallationId
                }
              }
            ],
            total: 1,
            page: request.page,
            pageSize: request.pageSize
          };
        },
        listMoldLifeWarnings: async (request) => {
          calls.push(['listMoldLifeWarnings', request]);
          return {
            warnings: [
              {
                moldWarningEventId: seed.moldWarningEventId,
                productionMoldInstanceSummary: {
                  productionMoldInstanceId: seed.productionMoldInstanceId
                }
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
            productionMoldInstanceCount: 1,
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
            pendingCount: 6,
            eventTypes: [
              'MoldRegistered',
              'MoldRegistered',
              'MoldMoved',
              'MoldInstalled',
              'MoldUsageRecorded',
              'MoldLifeWarningRaised'
            ]
          };
        }
      }
    },
    seed
  );

  assert.equal(result.design.moldDesignId, seed.moldDesignId);
  assert.equal(result.instance.productionMoldInstanceId, seed.productionMoldInstanceId);
  assert.equal(result.currentMolds.total, 1);
  assert.equal(result.warnings.total, 1);
  assert.equal(result.idempotency.productionMoldInstanceCount, 1);
  assert.equal(result.outbox.pendingCount, 6);
  assert.deepEqual(
    calls.map(([name]) => name),
    [
      'registerMoldDesign',
      'registerProductionMoldInstance',
      'moveMold',
      'installMold',
      'recordMoldUsage',
      'listCurrentMoldsByWorkCenter',
      'listMoldLifeWarnings',
      'replaySameCommand',
      'conflictSameCommandDifferentPayload',
      'verifyOutbox'
    ]
  );
});
