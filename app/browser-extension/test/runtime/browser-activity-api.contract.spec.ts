import { describe, expect, it, vi } from 'vitest'

import { BrowserActivityApi, BrowserActivityApiError } from '../../src/runtime/browser-activity-api'

function createResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(body === undefined ? undefined : JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init
  })
}

// Verifies BrowserActivityApi calls the extension-only Browser Activity BFF surface.
describe('BrowserActivityApi', () => {
  it('appends visit sessions with bearer extension token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(createResponse({
      code: 'SYS_000000',
      data: {
        acceptedCount: 1,
        policyEnabled: true,
        rejectedCount: 0,
        serverReceivedAt: '2026-06-25T09:28:02.000Z'
      }
    }))
    const api = new BrowserActivityApi({
      baseUrl: 'http://localhost:9101/api/v1',
      fetchImpl: fetchImpl as any
    })

    await expect(api.appendVisitSessions('access-1', {
      sessions: [
        {
          activeDurationSeconds: 60,
          clientVisitId: 'visit-1',
          domain: 'supplier.example',
          dwellDurationSeconds: 60,
          endedAt: '2026-06-25T09:01:00.000Z',
          extensionSessionId: 'extension-session-1',
          foregroundDurationSeconds: 60,
          idleDurationSeconds: 0,
          lastFlushedAt: '2026-06-25T09:01:00.000Z',
          mergeKey: 'account-1:supplier.example:https://supplier.example',
          pageTitle: 'Supplier',
          startedAt: '2026-06-25T09:00:00.000Z',
          url: 'https://supplier.example'
        }
      ]
    })).resolves.toEqual({
      acceptedCount: 1,
      policyEnabled: true,
      rejectedCount: 0,
      serverReceivedAt: '2026-06-25T09:28:02.000Z'
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/browser-activity/visit-sessions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-1'
        }),
        method: 'POST'
      })
    )
  })

  it('posts heartbeat with bearer extension token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(createResponse({
      data: {
        accepted: true,
        nextHeartbeatAfterSeconds: 60,
        policyEnabled: true
      },
      success: true
    }))
    const api = new BrowserActivityApi({
      baseUrl: 'http://localhost:9101/api/v1/',
      fetchImpl: fetchImpl as any
    })

    await expect(api.heartbeat('access-1', {
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:30:00.000Z'
    })).resolves.toEqual({
      accepted: true,
      nextHeartbeatAfterSeconds: 60,
      policyEnabled: true
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/browser-activity/heartbeat',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('posts disconnect with bearer extension token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(createResponse({
      data: {
        accepted: true
      },
      success: true
    }))
    const api = new BrowserActivityApi({
      baseUrl: 'http://localhost:9101/api/v1/',
      fetchImpl: fetchImpl as any
    })

    await expect(api.disconnect('access-1', {
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:31:00.000Z'
    })).resolves.toEqual({
      accepted: true
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/browser-activity/disconnect',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('reads audit control with bearer extension token without sending page facts', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(createResponse({
      data: {
        enabled: false,
        nextPollAfterSeconds: 60,
        reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
      },
      success: true
    }))
    const api = new BrowserActivityApi({
      baseUrl: 'http://localhost:9101/api/v1/',
      fetchImpl: fetchImpl as any
    })

    await expect(api.getAuditControl('access-1')).resolves.toEqual({
      enabled: false,
      nextPollAfterSeconds: 60,
      reasonCode: 'EMPLOYEE_AUDIT_DISABLED'
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:9101/api/v1/extension/browser-activity/audit-control',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-1'
        }),
        method: 'GET'
      })
    )
  })

  it('throws stable errors from failed BFF responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(createResponse({
      message: 'policy disabled',
      reasonCode: 'BROWSER_ACTIVITY_POLICY_DISABLED'
    }, { status: 409 }))
    const api = new BrowserActivityApi({ fetchImpl: fetchImpl as any })

    await expect(api.heartbeat('access-1', {
      extensionSessionId: 'extension-session-1',
      observedAt: '2026-06-25T09:30:00.000Z'
    })).rejects.toMatchObject({
      message: 'policy disabled',
      status: 409
    } satisfies Partial<BrowserActivityApiError>)
  })
})
