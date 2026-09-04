import { HandleTerminalDeviceUnavailableCommand } from './handle-terminal-device-unavailable.command'
import { HandleTerminalDeviceUnavailableHandler } from './handle-terminal-device-unavailable.handler'

describe('HandleTerminalDeviceUnavailableHandler', () => {
  it('deletes active sessions for one terminal device and emits audit', async () => {
    const sessions = [{ getId: () => 'session-1' }, { getId: () => 'session-2' }]
    const sessionRepository = {
      findActiveByTerminalDeviceId: jest.fn().mockResolvedValue(sessions),
      delete: jest.fn().mockResolvedValue(undefined)
    }
    const authAuditService = {
      emitTerminalDeviceSessionsRevoked: jest.fn()
    }
    const handler = new HandleTerminalDeviceUnavailableHandler(
      sessionRepository as any,
      authAuditService as any
    )

    await expect(
      handler.execute(
        new HandleTerminalDeviceUnavailableCommand({
          tenantId: 'tenant-1',
          terminalDeviceId: 'terminal-device-1',
          previousStatus: 'ACTIVE',
          newStatus: 'LOST',
          reason: 'device lost',
          traceId: 'trace-1'
        })
      )
    ).resolves.toEqual({
      terminalDeviceId: 'terminal-device-1',
      revokedSessionIds: ['session-1', 'session-2'],
      revokedCount: 2
    })

    expect(sessionRepository.findActiveByTerminalDeviceId).toHaveBeenCalledWith(
      'terminal-device-1'
    )
    expect(sessionRepository.delete).toHaveBeenCalledWith('session-1')
    expect(sessionRepository.delete).toHaveBeenCalledWith('session-2')
    expect(authAuditService.emitTerminalDeviceSessionsRevoked).toHaveBeenCalledWith({
      terminalDeviceId: 'terminal-device-1',
      tenantId: 'tenant-1',
      previousStatus: 'ACTIVE',
      newStatus: 'LOST',
      reason: 'device lost',
      traceId: 'trace-1',
      sessionIds: ['session-1', 'session-2']
    })
  })

  it('is idempotent when the unavailable event is replayed after sessions are already gone', async () => {
    const sessionRepository = {
      findActiveByTerminalDeviceId: jest.fn().mockResolvedValue([]),
      delete: jest.fn()
    }
    const authAuditService = {
      emitTerminalDeviceSessionsRevoked: jest.fn()
    }
    const handler = new HandleTerminalDeviceUnavailableHandler(
      sessionRepository as any,
      authAuditService as any
    )

    await expect(
      handler.execute(
        new HandleTerminalDeviceUnavailableCommand({
          tenantId: 'tenant-1',
          terminalDeviceId: 'terminal-device-1',
          previousStatus: 'ACTIVE',
          newStatus: 'DISABLED'
        })
      )
    ).resolves.toEqual({
      terminalDeviceId: 'terminal-device-1',
      revokedSessionIds: [],
      revokedCount: 0
    })

    expect(sessionRepository.delete).not.toHaveBeenCalled()
    expect(authAuditService.emitTerminalDeviceSessionsRevoked).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'terminal-device-1',
        newStatus: 'DISABLED',
        sessionIds: []
      })
    )
  })
})
