import { PdaDeviceHeartbeatUseCase } from './pda-device-heartbeat.use-case'

describe('PdaDeviceHeartbeatUseCase', () => {
  it('records heartbeat runtime through terminal-device-service and returns the current decision', async () => {
    const terminalDeviceAdapter = {
      recordHeartbeat: jest.fn().mockResolvedValue({
        accepted: true,
        terminalDeviceId: 'terminal-device-1',
        lastHeartbeatAt: '2026-05-14T10:00:01.000Z',
        presenceStatus: 'ONLINE',
        heartbeatIntervalSeconds: 300,
        rotatedDeviceCredential: 'rotated-credential-2',
        deviceCredentialExpiresAt: '2026-06-15T10:00:00.000Z',
        deviceCredentialVersion: 2
      }),
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue(allowDecision())
    }
    const useCase = new PdaDeviceHeartbeatUseCase(terminalDeviceAdapter as any)

    const result = await useCase.execute({
      device: {
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        identity: {
          manufacturerSerial: 'SEUIC-SN-123456',
          manufacturer: 'Seuic',
          model: 'Cruise Ge'
        },
        software: {
          androidVersion: '9',
          appVersion: '2.0.0'
        }
      },
      runtime: {
        networkStatus: 'ONLINE',
        appState: 'FOREGROUND'
      },
      session: null,
      clientTime: '2026-05-14T10:00:00.000Z'
    }, trustedSource(), 'credential-1')

    expect(terminalDeviceAdapter.recordHeartbeat).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: null,
        terminalDeviceId: 'terminal-device-1',
        runtime: expect.objectContaining({ appState: 'FOREGROUND' }),
        deviceCredential: 'credential-1'
      })
    )
    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'terminal-device-1',
        requestPurpose: 'HEARTBEAT',
        deviceCredential: 'rotated-credential-2'
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        accepted: true,
        decision: expect.objectContaining({ decisionCode: 'ALLOW' }),
        heartbeatIntervalSeconds: 300,
        serverTime: expect.any(String)
      })
    )
    expect(JSON.parse(JSON.stringify(result))).toEqual(
      expect.objectContaining({
        deviceCredentialExpiresAt: '2026-06-15T10:00:00.000Z',
        deviceCredentialVersion: 2
      })
    )
    expect(JSON.stringify(result)).not.toContain('rotated-credential-2')
  })

  it('passes authenticated session summary when PDA web includes it', async () => {
    const terminalDeviceAdapter = {
      recordHeartbeat: jest.fn().mockResolvedValue({
        accepted: true,
        heartbeatIntervalSeconds: 300
      }),
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue(allowDecision())
    }
    const useCase = new PdaDeviceHeartbeatUseCase(terminalDeviceAdapter as any)

    const result = await useCase.execute({
      device: {
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        identity: {},
        software: {
          appVersion: '2.0.0'
        }
      },
      runtime: {
        networkStatus: 'ONLINE',
        appState: 'FOREGROUND'
      },
      session: {
        accountId: 'account-1',
        tenantId: null,
        sessionId: 'session-1'
      },
      clientTime: '2026-05-14T10:00:00.000Z'
    }, trustedSource(), 'credential-1')

    expect(terminalDeviceAdapter.recordHeartbeat).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'terminal-device-1',
        tenantId: null,
        session: {
          accountId: 'account-1',
          sessionId: 'session-1'
        },
        deviceCredential: 'credential-1'
      })
    )
    expect(result).not.toHaveProperty('deviceCredentialExpiresAt')
    expect(result).not.toHaveProperty('deviceCredentialVersion')
  })
})

function allowDecision() {
  return {
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
    versionPolicy: null
  }
}

function trustedSource() {
  return { requestId: 'request-1', traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' }
}
