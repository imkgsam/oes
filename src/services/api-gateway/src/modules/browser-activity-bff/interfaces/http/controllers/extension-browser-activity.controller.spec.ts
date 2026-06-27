import { ExtensionBrowserActivityController } from './extension-browser-activity.controller'

describe('ExtensionBrowserActivityController', () => {
  const service = {
    appendVisitSessions: jest.fn(),
    disconnect: jest.fn(),
    getAuditControl: jest.fn(),
    heartbeat: jest.fn()
  }
  const controller = new ExtensionBrowserActivityController(service as any)
  const source = { user: { aid: 'account-1', terminal: 'BROWSER_EXTENSION', tid: 'tenant-1' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('forwards extension audit control checks without accepting client tenant context', async () => {
    service.getAuditControl.mockResolvedValue({
      enabled: false,
      nextPollAfterSeconds: 60,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
    })

    await expect(controller.getAuditControl(source as any)).resolves.toEqual({
      enabled: false,
      nextPollAfterSeconds: 60,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
    })

    expect(service.getAuditControl).toHaveBeenCalledWith({}, source)
  })

  it('forwards extension ingest endpoints to the BFF service', async () => {
    service.appendVisitSessions.mockResolvedValue({ acceptedCount: 1 })
    service.heartbeat.mockResolvedValue({ accepted: true })

    await controller.appendVisitSessions({ sessions: [] } as any, source as any)
    await controller.heartbeat({ extensionSessionId: 'session-1', observedAt: '2026-06-26T00:00:00.000Z' }, source as any)

    expect(service.appendVisitSessions).toHaveBeenCalledWith({ sessions: [] }, source)
    expect(service.heartbeat).toHaveBeenCalledWith(
      { extensionSessionId: 'session-1', observedAt: '2026-06-26T00:00:00.000Z' },
      source
    )
  })

  it('forwards extension disconnect requests to the BFF service', async () => {
    service.disconnect.mockResolvedValue({ accepted: true })

    await expect(
      controller.disconnect({ extensionSessionId: 'session-1', observedAt: '2026-06-26T00:01:00.000Z' }, source as any)
    ).resolves.toEqual({ accepted: true })

    expect(service.disconnect).toHaveBeenCalledWith(
      { extensionSessionId: 'session-1', observedAt: '2026-06-26T00:01:00.000Z' },
      source
    )
  })
})
