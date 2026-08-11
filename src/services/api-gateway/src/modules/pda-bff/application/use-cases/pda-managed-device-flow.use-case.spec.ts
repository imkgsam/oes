import { PdaDeviceHeartbeatUseCase } from './pda-device-heartbeat.use-case'
import { PdaDeviceLogsUseCase } from './pda-device-logs.use-case'
import { PdaSessionBootstrapUseCase } from './pda-session-bootstrap.use-case'
import { InMemoryPdaDeviceDiagnosticLogStore } from '../../infrastructure/in-memory-pda-device-diagnostic-log.store'
import { PdaDeviceController } from '../../interfaces/http/controllers/pda-device.controller'

describe('PDA managed device BFF flow', () => {
  it('bootstrap resolves device decision using the authenticated PDA session tenant', async () => {
    const sessionContextUseCase = {
      execute: jest.fn().mockResolvedValue({
        operator: { userId: 'user-1', displayName: 'Worker One', scopeLevel: 'TENANT' },
        account: { accountId: 'account-1', name: 'Worker One', scopeLevel: 'TENANT' },
        tenant: { tenantId: 'tenant-1', name: 'Tenant One' },
        access: { actionCodes: ['pda.home'] },
        terminal: 'PDA',
        allowedTerminals: ['PDA']
      })
    }
    const terminalDeviceAdapter = {
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue(allowDecision())
    }
    const useCase = new PdaSessionBootstrapUseCase(sessionContextUseCase as any, terminalDeviceAdapter as any)

    const result = await useCase.execute(
      {
        user: {
          sid: 'session-1',
          terminal: 'PDA'
        }
      } as any,
      'tdv-1',
      'credential-1'
    )

    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        terminalDeviceId: 'tdv-1',
        requestPurpose: 'BOOTSTRAP',
        deviceCredential: 'credential-1'
      })
    )
    expect(result.device).toEqual(
      expect.objectContaining({
        terminalDeviceId: 'tdv-1',
        tenantId: 'tenant-1',
        deviceStatus: 'ACTIVE'
      })
    )
    expect(result.decision).toEqual(expect.objectContaining({ decisionCode: 'ALLOW' }))
    expect(result).not.toHaveProperty('deviceCredential')
  })

  it('heartbeat records runtime state and returns cleanup decision from terminal-device-service', async () => {
    const terminalDeviceAdapter = {
      recordHeartbeat: jest.fn().mockResolvedValue({
        accepted: true,
        heartbeatIntervalSeconds: 300,
        lastHeartbeatAt: '2026-05-16T10:10:03.000Z'
      }),
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue({
        ...allowDecision(),
        allowed: false,
        decisionCode: 'DEVICE_DISABLED',
        requiredAction: 'CLEAR_LOCAL_SESSION',
        shouldClearLocalSession: true
      })
    }
    const useCase = new PdaDeviceHeartbeatUseCase(terminalDeviceAdapter as any)

    const result = await useCase.execute({
      device: managedDevice('tdv-1'),
      runtime: {
        networkStatus: 'ONLINE',
        networkType: 'WIFI',
        appState: 'FOREGROUND'
      },
      session: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        sessionId: 'session-1'
      },
      clientTime: '2026-05-16T10:10:00.000Z'
    }, trustedSource(), 'credential-1')

    expect(terminalDeviceAdapter.recordHeartbeat).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'tdv-1',
        tenantId: 'tenant-1',
        runtime: expect.objectContaining({ networkStatus: 'ONLINE' }),
        deviceCredential: 'credential-1'
      })
    )
    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'tdv-1',
        requestPurpose: 'HEARTBEAT',
        deviceCredential: 'credential-1'
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        accepted: true,
        heartbeatIntervalSeconds: 300,
        decision: expect.objectContaining({
          decisionCode: 'DEVICE_DISABLED',
          shouldClearLocalSession: true
        })
      })
    )
    expect(result).not.toHaveProperty('rotatedDeviceCredential')
  })

  it('diagnostic log upload consumes device decision while keeping sanitized local log storage', async () => {
    const store = new InMemoryPdaDeviceDiagnosticLogStore()
    const terminalDeviceAdapter = {
      recordDiagnosticLogs: jest.fn().mockResolvedValue({ accepted: true, receivedCount: 1 }),
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue(allowDecision())
    }
    const useCase = new PdaDeviceLogsUseCase(store, terminalDeviceAdapter as any)

    const result = await useCase.execute({
      device: managedDevice('tdv-1'),
      session: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        sessionId: 'session-1'
      },
      logs: [
        {
          clientTime: '2026-05-16T10:20:00.000Z',
          level: 'INFO',
          eventType: 'SCAN_RECEIVED',
          message: 'Scan result received',
          diagnosticMode: false,
          details: {
            scanValue: 'PB202605140001',
            accessToken: 'token-must-not-survive'
          }
        }
      ]
    }, trustedSource(), 'credential-1')

    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'tdv-1',
        requestPurpose: 'DIAGNOSTIC_LOG',
        deviceCredential: 'credential-1'
      })
    )
    expect(terminalDeviceAdapter.recordDiagnosticLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'tdv-1',
        deviceCredential: 'credential-1'
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        accepted: true,
        receivedCount: 1,
        decision: expect.objectContaining({ decisionCode: 'ALLOW' })
      })
    )
    expect(result).not.toHaveProperty('deviceCredential')
    expect(store.getRecent('tdv-1')[0]).toEqual(
      expect.objectContaining({
        details: {
          scanValue: '[REDACTED_DIAGNOSTIC_MODE_REQUIRED]',
          accessToken: '[REDACTED]'
        }
      })
    )
  })

  it('puts the activation secret only in the dedicated header while returning credential lifecycle facts in the body', async () => {
    const activation = {
      enrolled: true,
      deviceCredentialExpiresAt: '2026-06-15T10:00:00.000Z',
      deviceCredentialVersion: 2
    }
    Object.defineProperty(activation, 'deviceCredential', { value: 'credential-1', enumerable: false })
    const controller = new PdaDeviceController(
      { execute: jest.fn().mockResolvedValue(activation) } as any,
      {} as any,
      {} as any
    )
    const response = { setHeader: jest.fn() }

    const result = await controller.enroll({} as any, {} as any, response)

    expect(response.setHeader).toHaveBeenCalledWith('X-OES-Terminal-Device-Credential', 'credential-1')
    expect(JSON.parse(JSON.stringify(result))).toEqual(expect.objectContaining({ deviceCredentialExpiresAt: '2026-06-15T10:00:00.000Z', deviceCredentialVersion: 2 }))
    expect(JSON.stringify(result)).not.toContain('credential-1')
  })

  it('returns heartbeat rotation lifecycle facts without emitting stale facts when no rotation occurs', async () => {
    const rotation = {
      accepted: true,
      deviceCredentialExpiresAt: '2026-06-15T10:00:00.000Z',
      deviceCredentialVersion: 2
    }
    Object.defineProperty(rotation, 'rotatedDeviceCredential', { value: 'rotated-credential-2', enumerable: false })
    const heartbeatUseCase = {
      execute: jest.fn()
        .mockResolvedValueOnce(rotation)
        .mockResolvedValueOnce({ accepted: true })
    }
    const controller = new PdaDeviceController({} as any, heartbeatUseCase as any, {} as any)
    const rotatedResponse = { setHeader: jest.fn() }
    const unchangedResponse = { setHeader: jest.fn() }

    const rotated = await controller.heartbeat({} as any, 'credential-1', {} as any, rotatedResponse)
    const unchanged = await controller.heartbeat({} as any, 'credential-1', {} as any, unchangedResponse)

    expect(rotatedResponse.setHeader).toHaveBeenCalledWith('X-OES-Terminal-Device-Credential', 'rotated-credential-2')
    expect(JSON.parse(JSON.stringify(rotated))).toEqual(expect.objectContaining({ deviceCredentialExpiresAt: '2026-06-15T10:00:00.000Z', deviceCredentialVersion: 2 }))
    expect(JSON.stringify(rotated)).not.toContain('rotated-credential-2')
    expect(unchangedResponse.setHeader).not.toHaveBeenCalled()
    expect(unchanged).not.toHaveProperty('deviceCredentialExpiresAt')
    expect(unchanged).not.toHaveProperty('deviceCredentialVersion')
  })
})

function managedDevice(terminalDeviceId: string) {
  return {
    terminalDeviceId,
    terminalDeviceType: 'PDA' as const,
    identity: {
      manufacturerSerial: 'SEUIC-SN-123456',
      manufacturer: 'Seuic',
      model: 'Cruise Ge'
    },
    software: {
      androidVersion: '9',
      webViewVersion: '66.0.3359.158',
      appVersion: '2.0.0'
    }
  }
}

function trustedSource() {
  return {
    requestId: 'request-1',
    traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
  }
}

function allowDecision() {
  return {
    allowed: true,
    decisionCode: 'ALLOW',
    resolvedTenantId: 'tenant-1',
    terminalDeviceId: 'tdv-1',
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
      upgradeRecommended: true,
      apkDownloadUrl: null,
      releaseNotesUrl: null
    }
  }
}
