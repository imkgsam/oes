import { PdaSessionBootstrapUseCase } from './pda-session-bootstrap.use-case'

describe('PdaSessionBootstrapUseCase', () => {
  it('builds the managed PDA bootstrap payload from session context and device decision', async () => {
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
    const terminalDeviceAdapter = {
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue({
        allowed: true,
        decisionCode: 'ALLOW',
        resolvedTenantId: 'tenant-1',
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        deviceStatus: 'ACTIVE',
        presenceStatus: 'ONLINE',
        requiredAction: 'NONE',
        shouldClearLocalSession: false,
        shouldClearLocalTerminalDeviceId: false,
        versionPolicy: {
          minSupportedAppVersion: '2.0.0',
          latestAppVersion: '2.1.0',
          upgradeRequired: false,
          upgradeRecommended: true
        }
      })
    }
    const useCase = new PdaSessionBootstrapUseCase(sessionContextUseCase as any, terminalDeviceAdapter as any)

    const result = await useCase.execute(
      {
        user: {
          sid: 'session-1',
          terminal: 'PDA'
        }
      } as any,
      'terminal-device-1'
    )

    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        terminalDeviceId: 'terminal-device-1',
        requestPurpose: 'BOOTSTRAP',
        session: {
          accountId: 'account-1',
          sessionId: 'session-1'
        }
      })
    )
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
          terminalDeviceId: 'terminal-device-1',
          idleTimeoutSeconds: 900
        }),
        access: {
          roles: [],
          actionCodes: ['pda.home']
        },
        device: expect.objectContaining({
          terminalDeviceId: 'terminal-device-1',
          tenantId: 'tenant-1',
          deviceStatus: 'ACTIVE'
        }),
        decision: expect.objectContaining({
          decisionCode: 'ALLOW',
          versionPolicy: expect.objectContaining({
            minSupportedAppVersion: '2.0.0',
            latestAppVersion: '2.1.0'
          })
        }),
        workbench: {
          mode: 'PDA_MANAGED_DEVICE',
          enabledCards: ['SESSION', 'DEVICE', 'NETWORK', 'SCAN', 'CAMERA', 'LOGS']
        },
        serverTime: expect.any(String)
      })
    )
  })
})
