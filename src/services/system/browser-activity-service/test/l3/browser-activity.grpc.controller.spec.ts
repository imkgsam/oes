import { RPC_OPERATOR_CONTEXT_KEY } from '@oes/common/authorization'
import { BrowserActivityApplication } from '../../src/application/browser-activity-application'
import { BrowserActivityGrpcController } from '../../src/interfaces/grpc/browser-activity.grpc.controller'

/** Attaches the same verified context produced by the trusted guard without restoring body authority. */
function trusted<T extends object>(
  request: T,
  terminal: 'WEB' | 'BROWSER_EXTENSION',
  sessionId = 'session-1'
): T {
  return Object.assign(request, {
    [RPC_OPERATOR_CONTEXT_KEY]: {
      verifiedExecutionToken: {
        subject: terminal === 'WEB' ? 'admin-1' : 'account-1',
        principalType: 'HUMAN',
        sessionId,
        sessionTerminal: terminal,
        tenantId: 'tenant-1'
      }
    }
  })
}

/** Verifies controller mapping derives tenant, account and extension session only from verified claims. */
describe('BrowserActivityGrpcController', () => {
  it('maps token-only WEB and extension requests without legacy identity fields', async () => {
    const controller = new BrowserActivityGrpcController(new BrowserActivityApplication())

    await controller.updatePolicy(
      trusted(
        { policy: { aggregateRetentionDays: 365, enabled: true, rawRetentionDays: 90 } },
        'WEB'
      )
    )
    await controller.updateEmployeeAuditGrant(
      trusted({ accountId: 'account-1', enabled: true }, 'WEB')
    )
    await controller.appendVisitSessions(
      trusted(
        {
          sessions: [
            {
              activeDurationSeconds: 60,
              clientVisitId: 'visit-1',
              domain: 'supplier.example',
              dwellDurationSeconds: 60,
              endedAt: '2026-08-10T09:01:00.000Z',
              foregroundDurationSeconds: 60,
              idleDurationSeconds: 0,
              lastFlushedAt: '2026-08-10T09:01:00.000Z',
              mergeKey: 'account-1:supplier.example:https://supplier.example',
              pageTitle: 'Supplier',
              startedAt: '2026-08-10T09:00:00.000Z',
              url: 'https://supplier.example'
            }
          ]
        },
        'BROWSER_EXTENSION',
        'extension-session-1'
      )
    )

    await expect(
      controller.heartbeat(
        trusted(
          { observedAt: '2026-08-10T09:02:00.000Z' },
          'BROWSER_EXTENSION',
          'extension-session-1'
        )
      )
    ).resolves.toEqual(expect.objectContaining({ accepted: true }))
    await expect(controller.getPolicy(trusted({}, 'WEB'))).resolves.toEqual(
      expect.objectContaining({ policy: expect.objectContaining({ enabled: true }) })
    )
    await expect(
      controller.getEmployeeTimeline(
        trusted({ employeeAccountId: 'account-1', period: 'LAST_1_DAY' }, 'WEB')
      )
    ).resolves.toEqual(expect.objectContaining({ employeeAccountId: 'account-1' }))
  })
})
