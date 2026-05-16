import { PdaSessionBootstrapUseCase } from './pda-session-bootstrap.use-case'

describe('PdaSessionBootstrapUseCase', () => {
  it('builds the Phase 1 PDA bootstrap payload from the authenticated session context', async () => {
    const sessionContextUseCase = {
      execute: jest.fn().mockResolvedValue({
        operator: {
          userId: 'user-1',
          displayName: 'Worker One',
          scopeLevel: 'TENANT'
        },
        account: {
          accountId: 'account-1',
          name: 'Worker One',
          scopeLevel: 'TENANT'
        },
        tenant: {
          tenantId: 'tenant-1',
          name: 'Tenant One'
        },
        navigation: {
          defaultEntry: 'pda.home',
          visibleEntries: ['pda.home']
        },
        access: {
          actionCodes: ['pda.home']
        },
        terminal: 'PDA',
        allowedTerminals: ['PDA']
      })
    }
    const useCase = new PdaSessionBootstrapUseCase(sessionContextUseCase as any)

    const result = await useCase.execute({
      user: {
        sid: 'session-1',
        terminal: 'PDA'
      }
    } as any)

    expect(result).toEqual(
      expect.objectContaining({
        account: {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Worker One'
        },
        session: expect.objectContaining({
          sessionId: 'session-1',
          terminal: 'PDA',
          idleTimeoutSeconds: 900
        }),
        access: {
          roles: [],
          actionCodes: ['pda.home']
        },
        device: expect.objectContaining({
          deviceStatus: 'ACTIVE'
        }),
        devicePolicy: expect.objectContaining({
          heartbeatIntervalSeconds: 300,
          idleTimeoutSeconds: 900,
          minSupportedAppVersion: '0.1.0'
        }),
        workbench: {
          mode: 'FOUNDATION_ACCEPTANCE',
          enabledCards: ['SESSION', 'DEVICE', 'NETWORK', 'SCAN', 'CAMERA', 'LOGS']
        },
        serverTime: expect.any(String)
      })
    )
  })
})
