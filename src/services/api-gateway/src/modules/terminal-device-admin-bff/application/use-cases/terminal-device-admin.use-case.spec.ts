import { TerminalDeviceAdminUseCase } from './terminal-device-admin.use-case'

describe('TerminalDeviceAdminUseCase', () => {
  it('creates enrollment in the current tenant through terminal-device-service', async () => {
    const terminalDeviceAdapter = {
      createEnrollment: jest.fn().mockResolvedValue({ enrollmentId: 'enr-1' })
    }
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, {} as any)
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

  it('loads current sessions from auth-service instead of treating heartbeat as session truth', async () => {
    const terminalDeviceAdapter = {
      getDevice: jest.fn().mockResolvedValue({
        device: { terminalDeviceId: 'tdv-1' },
        identity: {},
        runtime: {
          presenceStatus: 'ONLINE',
          lastReportedAccount: { accountId: 'user-1', displayName: 'Worker One' }
        }
      })
    }
    const authAdapter = {
      adminListUserSessions: jest.fn().mockResolvedValue({
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
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, authAdapter as any)

    const result = await useCase.getDevice('tdv-1', sourceWithTenant())

    expect(terminalDeviceAdapter.getDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        terminalDeviceId: 'tdv-1',
        includeSensitiveIdentity: true
      })
    )
    expect(authAdapter.adminListUserSessions).toHaveBeenCalledWith('user-1', expect.any(Object))
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
    const useCase = new TerminalDeviceAdminUseCase(terminalDeviceAdapter as any, authAdapter as any)

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
