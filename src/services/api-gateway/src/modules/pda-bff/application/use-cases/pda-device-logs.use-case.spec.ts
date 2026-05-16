import { InMemoryPdaDeviceDiagnosticLogStore } from '../../infrastructure/in-memory-pda-device-diagnostic-log.store'
import { PdaDeviceLogsUseCase } from './pda-device-logs.use-case'

describe('PdaDeviceLogsUseCase', () => {
  it('accepts manual diagnostic logs and stores sanitized recent entries', async () => {
    const store = new InMemoryPdaDeviceDiagnosticLogStore()
    const terminalDeviceAdapter = {
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue(allowDecision())
    }
    const useCase = new PdaDeviceLogsUseCase(store, terminalDeviceAdapter as any)

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
      session: null,
      logs: [
        {
          clientTime: '2026-05-14T10:15:00.000Z',
          level: 'INFO',
          eventType: 'SCAN_RECEIVED',
          message: 'Scan result received',
          traceId: 'trace-1',
          requestId: null,
          errorCode: null,
          diagnosticMode: true,
          details: {
            scanValue: 'PB202605140001',
            scanLength: 14,
            accessToken: 'token-must-not-survive',
            nested: {
              password: 'password-must-not-survive'
            }
          }
        }
      ]
    })

    expect(result).toEqual(
      expect.objectContaining({
        accepted: true,
        receivedCount: 1,
        decision: expect.objectContaining({ decisionCode: 'ALLOW' }),
        serverTime: expect.any(String)
      })
    )
    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'terminal-device-1',
        requestPurpose: 'DIAGNOSTIC_LOG'
      })
    )
    expect(store.getRecent('terminal-device-1')).toEqual([
      expect.objectContaining({
        deviceId: 'terminal-device-1',
        sessionId: null,
        eventType: 'SCAN_RECEIVED',
        details: {
          scanValue: 'PB202605140001',
          scanLength: 14,
          accessToken: '[REDACTED]',
          nested: {
            password: '[REDACTED]'
          }
        }
      })
    ])
  })

  it('redacts scan values when diagnostic mode is not explicitly enabled', async () => {
    const store = new InMemoryPdaDeviceDiagnosticLogStore()
    const terminalDeviceAdapter = {
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue(allowDecision())
    }
    const useCase = new PdaDeviceLogsUseCase(store, terminalDeviceAdapter as any)

    await useCase.execute({
      device: {
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        identity: {},
        software: {
          appVersion: '2.0.0'
        }
      },
      session: {
        accountId: 'account-1',
        tenantId: null,
        sessionId: 'session-1'
      },
      logs: [
        {
          clientTime: '2026-05-14T10:15:00.000Z',
          level: 'INFO',
          eventType: 'SCAN_RECEIVED',
          message: 'Scan result received',
          diagnosticMode: false,
          details: {
            scanValue: 'PB202605140001',
            scanLength: 14
          }
        }
      ]
    })

    expect(store.getRecent('terminal-device-1')[0]).toEqual(
      expect.objectContaining({
        accountId: 'account-1',
        tenantId: null,
        sessionId: 'session-1',
        details: {
          scanValue: '[REDACTED_DIAGNOSTIC_MODE_REQUIRED]',
          scanLength: 14
        }
      })
    )
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
