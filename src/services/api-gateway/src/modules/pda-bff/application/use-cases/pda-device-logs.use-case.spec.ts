import { InMemoryPdaDeviceDiagnosticLogStore } from '../../infrastructure/in-memory-pda-device-diagnostic-log.store'
import { PdaDeviceLogsUseCase } from './pda-device-logs.use-case'

describe('PdaDeviceLogsUseCase', () => {
  it('accepts manual diagnostic logs and stores sanitized recent entries', async () => {
    const store = new InMemoryPdaDeviceDiagnosticLogStore()
    const useCase = new PdaDeviceLogsUseCase(store)

    const result = await useCase.execute({
      device: {
        deviceId: 'device-1',
        idSource: 'MANUFACTURER_SERIAL',
        manufacturer: 'Seuic',
        deviceModel: 'Cruise Ge',
        androidVersion: '9',
        appVersion: '0.1.0'
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
        serverTime: expect.any(String)
      })
    )
    expect(store.getRecent('device-1')).toEqual([
      expect.objectContaining({
        deviceId: 'device-1',
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
    const useCase = new PdaDeviceLogsUseCase(store)

    await useCase.execute({
      device: {
        deviceId: 'device-1',
        idSource: 'MANUFACTURER_SERIAL',
        appVersion: '0.1.0'
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

    expect(store.getRecent('device-1')[0]).toEqual(
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
