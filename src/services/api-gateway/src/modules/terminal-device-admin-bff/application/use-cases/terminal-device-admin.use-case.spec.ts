import { TerminalDeviceAdminUseCase } from './terminal-device-admin.use-case'

describe('TerminalDeviceAdminUseCase', () => {
  it('creates enrollment in the current tenant through terminal-device-service', async () => {
    const terminalDeviceAdapter = {
      createEnrollment: jest.fn().mockResolvedValue({ enrollmentId: 'enr-1' })
    }
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, {} as any, diagnosticLogStoreStub() as any)
    const source = sourceWithTenant()

    await useCase.createEnrollment(
      {
        terminalDeviceType: 'PDA',
        displayName: 'Dock PDA',
        expiresAt: '2026-05-17T10:00:00.000Z'
      },
      source
    )

    expect(terminalDeviceAdapter.createEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        displayName: 'Dock PDA',
        source
      })
    )
  })

  it('loads current sessions from auth-service by terminal device instead of heartbeat account truth', async () => {
    const terminalDeviceAdapter = {
      getDevice: jest.fn().mockResolvedValue({
        device: { terminalDeviceId: 'tdv-1', terminalDeviceType: 'PDA' },
        identity: {},
        runtime: {
          presenceStatus: 'ONLINE',
          lastReportedAccount: { accountId: 'account-from-heartbeat', displayName: 'Worker One' }
        }
      })
    }
    const authAdapter = {
      adminListTerminalDeviceSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-1',
            accountId: 'account-1',
            terminalDeviceId: 'tdv-1',
            isRevoked: false,
            createdAt: '2026-05-16T09:00:00.000Z',
            lastActiveAt: '2026-05-16T10:00:00.000Z'
          },
          {
            sessionId: 'session-2',
            accountId: 'account-2',
            terminalDeviceId: 'tdv-other',
            isRevoked: false
          }
        ]
      })
    }
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, authAdapter as any, diagnosticLogStoreStub() as any)

    const result = await useCase.getDevice('tdv-1', sourceWithTenant())

    expect(terminalDeviceAdapter.getDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        terminalDeviceId: 'tdv-1',
        includeSensitiveIdentity: true
      })
    )
    expect(authAdapter.adminListTerminalDeviceSessions).toHaveBeenCalledWith('tdv-1', expect.any(Object), 'PDA')
    expect(result.currentSessions).toEqual([
      {
        sessionId: 'session-1',
        accountId: 'account-1',
        displayName: 'account-1',
        createdAt: '2026-05-16T09:00:00.000Z',
        lastSeenAt: '2026-05-16T10:00:00.000Z'
      }
    ])
  })

  it('lists heartbeat records from terminal-device-service for the current tenant', async () => {
    const terminalDeviceAdapter = {
      listHeartbeatRecords: jest.fn().mockResolvedValue({
        items: [
          {
            heartbeatId: 'heartbeat-1',
            terminalDeviceId: 'tdv-1',
            receivedAt: '2026-05-16T10:10:03.000Z'
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      })
    }
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, {} as any, diagnosticLogStoreStub() as any)

    const result = await useCase.listHeartbeatRecords('tdv-1', { page: 1, pageSize: 20 }, sourceWithTenant())

    expect(terminalDeviceAdapter.listHeartbeatRecords).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      terminalDeviceId: 'tdv-1',
      page: 1,
      pageSize: 20,
      source: sourceWithTenant()
    })
    expect(result.items).toEqual([expect.objectContaining({ heartbeatId: 'heartbeat-1' })])
  })

  it('lists uploaded PDA diagnostic logs from terminal-device-service persistence', async () => {
    const terminalDeviceAdapter = {
      listDiagnosticLogs: jest.fn().mockResolvedValue({
        items: [
          {
            deviceId: 'tdv-1',
            idSource: 'TERMINAL_DEVICE_ID',
            accountId: 'account-1',
            tenantId: 'tenant-1',
            sessionId: 'session-1',
            clientTime: '2026-05-16T10:09:00.000Z',
            receivedAt: '2026-05-16T10:10:00.000Z',
            level: 'WARN',
            eventType: 'SCAN_RECEIVED',
            message: 'Scan result received',
            traceId: 'trace-1',
            requestId: null,
            errorCode: null,
            diagnosticMode: false,
            details: { scanValue: '[REDACTED_DIAGNOSTIC_MODE_REQUIRED]' }
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      })
    }
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, {} as any, diagnosticLogStoreStub() as any)

    const result = await useCase.listDiagnosticLogs('tdv-1', { page: 1, pageSize: 20 }, sourceWithTenant())

    expect(terminalDeviceAdapter.listDiagnosticLogs).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      terminalDeviceId: 'tdv-1',
      page: 1,
      pageSize: 20,
      source: sourceWithTenant()
    })
    expect(result).toMatchObject({
      items: [
        {
          eventType: 'SCAN_RECEIVED',
          level: 'WARN',
          details: { scanValue: '[REDACTED_DIAGNOSTIC_MODE_REQUIRED]' }
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
  })

  it('requests auth-service cleanup when terminal-device-service returns a session revoke intent', async () => {
    const terminalDeviceAdapter = {
      changeStatus: jest.fn().mockResolvedValue({
        terminalDeviceId: 'tdv-1',
        previousStatus: 'ACTIVE',
        status: 'DISABLED',
        statusReason: 'lost',
        changedAt: '2026-05-16T10:00:00.000Z',
        sessionRevokeIntent: {
          required: true,
          terminalDeviceId: 'tdv-1'
        }
      })
    }
    const authAdapter = {
      handleTerminalDeviceUnavailable: jest.fn().mockResolvedValue({
        handled: true,
        action: 'SESSIONS_REVOKED',
        message: 'Revoked 2 session(s) for terminal device'
      })
    }
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, authAdapter as any, diagnosticLogStoreStub() as any)

    const result = await useCase.changeStatus(
      'tdv-1',
      { targetStatus: 'DISABLED', reason: 'lost' },
      sourceWithTenant()
    )

    expect(authAdapter.handleTerminalDeviceUnavailable).toHaveBeenCalledWith(
      {
        terminal: 'PDA',
        terminalDeviceId: 'tdv-1',
        deviceBoundTenantId: 'tenant-1',
        reasonCode: 'DISABLED'
      },
      expect.any(Object)
    )
    expect(result.sessionRevoke).toEqual({
      requested: true,
      status: 'ACCEPTED',
      affectedSessionCount: 2
    })
  })

  it('passes an omitted status reason through as optional audit metadata', async () => {
    const terminalDeviceAdapter = {
      changeStatus: jest.fn().mockResolvedValue({
        terminalDeviceId: 'tdv-1',
        previousStatus: 'ACTIVE',
        status: 'LOST',
        statusReason: null,
        changedAt: '2026-05-16T10:00:00.000Z',
        sessionRevokeIntent: {
          required: false,
          terminalDeviceId: 'tdv-1'
        }
      })
    }
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, {} as any, diagnosticLogStoreStub() as any)

    await useCase.changeStatus('tdv-1', { targetStatus: 'LOST' }, sourceWithTenant())

    expect(terminalDeviceAdapter.changeStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        terminalDeviceId: 'tdv-1',
        targetStatus: 'LOST',
        reason: undefined
      })
    )
  })
})

function sourceWithTenant() {
  return {
    traceId: 'trace-1',
    user: {
      tid: 'tenant-1',
      aid: 'operator-1',
      permissions: ['terminal-device.sensitive.read']
    }
  }
}

function diagnosticLogStoreStub() {
  return {
    getRecent: jest.fn().mockReturnValue([])
  }
}
