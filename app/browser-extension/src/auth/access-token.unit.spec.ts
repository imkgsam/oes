import { describe, expect, it, vi } from 'vitest'

import { refreshStoredExtensionAccessToken } from './access-token'
import { MemoryAuthStorage } from './storage'

describe('extension access token refresh', () => {
  it('refreshes the stored extension session and saves the fresh context', async () => {
    const storage = new MemoryAuthStorage()
    await storage.save({
      accessToken: 'expired-token-1',
      context: {
        account: { accountId: 'account-1' },
        tenant: { tenantId: 'tenant-1' }
      },
      refreshToken: 'refresh-token-1'
    })
    const api = {
      getSessionContext: vi.fn().mockResolvedValue({
        account: { accountId: 'account-1' },
        tenant: { tenantId: 'tenant-1' }
      }),
      refreshSession: vi.fn().mockResolvedValue({
        accessToken: 'fresh-token-1',
        refreshToken: 'refresh-token-2'
      })
    }

    await expect(refreshStoredExtensionAccessToken({ api: api as never, storage })).resolves.toBe('fresh-token-1')

    await expect(storage.load()).resolves.toEqual({
      accessToken: 'fresh-token-1',
      context: {
        account: { accountId: 'account-1' },
        tenant: { tenantId: 'tenant-1' }
      },
      refreshToken: 'refresh-token-2'
    })
  })
})
