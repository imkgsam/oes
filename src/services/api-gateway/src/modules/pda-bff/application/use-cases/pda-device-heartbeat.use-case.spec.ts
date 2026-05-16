import { PdaDeviceHeartbeatUseCase } from './pda-device-heartbeat.use-case'
import { InMemoryPdaDeviceHeartbeatStore } from '../../infrastructure/in-memory-pda-device-heartbeat.store'

describe('PdaDeviceHeartbeatUseCase', () => {
  it('accepts unauthenticated device heartbeat and records latest diagnostic state', async () => {
    const store = new InMemoryPdaDeviceHeartbeatStore()
    const useCase = new PdaDeviceHeartbeatUseCase(store)

    const result = await useCase.execute({
      device: {
        deviceId: 'device-1',
        idSource: 'MANUFACTURER_SERIAL',
        manufacturer: 'Seuic',
        deviceModel: 'Cruise Ge',
        androidVersion: '9',
        appVersion: '0.1.0'
      },
      runtime: {
        networkStatus: 'ONLINE',
        appState: 'FOREGROUND'
      },
      session: null,
      clientTime: '2026-05-14T10:00:00.000Z'
    })

    expect(result).toEqual(
      expect.objectContaining({
        accepted: true,
        deviceStatus: 'ACTIVE',
        devicePolicy: expect.objectContaining({
          heartbeatIntervalSeconds: 300,
          idleTimeoutSeconds: 900
        }),
        serverTime: expect.any(String)
      })
    )
    expect(store.getLatest('device-1')).toEqual(
      expect.objectContaining({
        deviceId: 'device-1',
        sessionId: null,
        networkStatus: 'ONLINE',
        appState: 'FOREGROUND',
        lastClientTime: '2026-05-14T10:00:00.000Z',
        lastHeartbeatAt: expect.any(String)
      })
    )
  })

  it('records authenticated session summary when PDA web includes it', async () => {
    const store = new InMemoryPdaDeviceHeartbeatStore()
    const useCase = new PdaDeviceHeartbeatUseCase(store)

    await useCase.execute({
      device: {
        deviceId: 'device-1',
        idSource: 'MANUFACTURER_SERIAL',
        appVersion: '0.1.0'
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
    })

    expect(store.getLatest('device-1')).toEqual(
      expect.objectContaining({
        accountId: 'account-1',
        tenantId: null,
        sessionId: 'session-1'
      })
    )
  })
})
