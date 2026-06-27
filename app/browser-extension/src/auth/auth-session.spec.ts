import { describe, expect, it, vi } from 'vitest'

import { AuthSessionController } from './auth-session'
import { MemoryAuthStorage } from './storage'

describe('AuthSessionController', () => {
  it('saves a successful extension login and loads session context', async () => {
    const api = {
      getSessionContext: vi.fn().mockResolvedValue({
        operator: { displayName: 'Mira Tan' },
        terminal: 'BROWSER_EXTENSION'
      }),
      login: vi.fn().mockResolvedValue({
        accountOptions: [],
        nextStep: 'NONE',
        session: {
          accessToken: 'access-1',
          expiresIn: 3600,
          refreshToken: 'refresh-1',
          terminal: 'BROWSER_EXTENSION'
        },
        status: 'SUCCESS'
      })
    }
    const storage = new MemoryAuthStorage()
    const controller = new AuthSessionController({ api: api as any, storage })

    await expect(
      controller.login({
        credential: 'secret-1',
        identifier: 'designer@example.com',
        method: 'EMAIL_PASSWORD'
      })
    ).resolves.toEqual({
      context: {
        operator: { displayName: 'Mira Tan' },
        terminal: 'BROWSER_EXTENSION'
      },
      kind: 'authenticated',
      session: {
        accessToken: 'access-1',
        context: {
          operator: { displayName: 'Mira Tan' },
          terminal: 'BROWSER_EXTENSION'
        },
        refreshToken: 'refresh-1'
      }
    })
    await expect(storage.load()).resolves.toEqual(
      expect.objectContaining({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    )
  })

  it('starts browser activity runtime after a successful authenticated extension login', async () => {
    const browserActivityRuntime = {
      logout: vi.fn(),
      startFromSession: vi.fn()
    }
    const api = {
      getSessionContext: vi.fn().mockResolvedValue({
        account: { accountId: 'account-1' },
        tenant: { tenantId: 'tenant-1' },
        terminal: 'BROWSER_EXTENSION'
      }),
      login: vi.fn().mockResolvedValue({
        accountOptions: [],
        nextStep: 'NONE',
        session: {
          accessToken: 'access-1',
          expiresIn: 3600,
          refreshToken: 'refresh-1',
          terminal: 'BROWSER_EXTENSION'
        },
        status: 'SUCCESS'
      })
    }
    const controller = new AuthSessionController({
      api: api as any,
      browserActivityRuntime,
      storage: new MemoryAuthStorage()
    })

    await controller.login({
      credential: 'secret-1',
      identifier: 'employee@example.com',
      method: 'EMAIL_PASSWORD'
    })

    expect(browserActivityRuntime.startFromSession).toHaveBeenCalledWith({
      accessToken: 'access-1',
      context: {
        account: { accountId: 'account-1' },
        tenant: { tenantId: 'tenant-1' },
        terminal: 'BROWSER_EXTENSION'
      },
      refreshToken: 'refresh-1'
    })
  })

  it('continues through account selection when login returns selectable extension accounts', async () => {
    const api = {
      login: vi.fn().mockResolvedValue({
        accountOptions: [{ accountId: 'account-1', displayName: 'Design Studio' }],
        nextStep: 'SELECT_ACCOUNT',
        operator: { userId: 'user-1' },
        session: null,
        status: 'ACCOUNT_SELECTION_REQUIRED'
      })
    }
    const controller = new AuthSessionController({
      api: api as any,
      storage: new MemoryAuthStorage()
    })

    await expect(
      controller.login({
        credential: 'secret-1',
        identifier: 'designer@example.com',
        method: 'EMAIL_PASSWORD'
      })
    ).resolves.toEqual({
      kind: 'account-selection',
      loginMethod: 'EMAIL_PASSWORD',
      message: undefined,
      options: [{ accountId: 'account-1', displayName: 'Design Studio' }],
      userId: 'user-1'
    })
  })

  it('keeps phone password login method through account selection', async () => {
    const api = {
      login: vi.fn().mockResolvedValue({
        accountOptions: [{ accountId: 'account-1', displayName: 'Phone Account' }],
        nextStep: 'SELECT_ACCOUNT',
        operator: { userId: 'user-1' },
        session: null,
        status: 'ACCOUNT_SELECTION_REQUIRED'
      })
    }
    const controller = new AuthSessionController({
      api: api as any,
      storage: new MemoryAuthStorage()
    })

    await expect(
      controller.login({
        credential: 'secret-1',
        identifier: '+8613900000108',
        method: 'PHONE_PASSWORD'
      })
    ).resolves.toEqual({
      kind: 'account-selection',
      loginMethod: 'PHONE_PASSWORD',
      message: undefined,
      options: [{ accountId: 'account-1', displayName: 'Phone Account' }],
      userId: 'user-1'
    })
  })

  it('refreshes a stored session when the saved access token no longer loads context', async () => {
    const storage = new MemoryAuthStorage()
    await storage.save({ accessToken: 'old-access', refreshToken: 'refresh-1' })
    const api = {
      getSessionContext: vi
        .fn()
        .mockRejectedValueOnce({ status: 401 })
        .mockResolvedValueOnce({
          operator: { displayName: 'Mira Tan' },
          terminal: 'BROWSER_EXTENSION'
        }),
      refreshSession: vi.fn().mockResolvedValue({
        accessToken: 'new-access',
        expiresIn: 3600,
        refreshToken: 'new-refresh',
        sessionId: 'session-2',
        terminal: 'BROWSER_EXTENSION'
      })
    }
    const controller = new AuthSessionController({ api: api as any, storage })

    await expect(controller.restore()).resolves.toEqual(
      expect.objectContaining({
        kind: 'authenticated',
        session: expect.objectContaining({
          accessToken: 'new-access',
          refreshToken: 'new-refresh'
        })
      })
    )
  })

  it('clears local session even when remote logout fails', async () => {
    const storage = new MemoryAuthStorage()
    await storage.save({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    const api = {
      logout: vi.fn().mockRejectedValue(new Error('expired'))
    }
    const controller = new AuthSessionController({ api: api as any, storage })

    await expect(controller.logout()).resolves.toEqual({ kind: 'login' })
    await expect(storage.load()).resolves.toBeNull()
  })

  it('stops browser activity runtime during logout before clearing local session', async () => {
    const browserActivityRuntime = {
      logout: vi.fn(),
      startFromSession: vi.fn()
    }
    const storage = new MemoryAuthStorage()
    await storage.save({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    const api = {
      logout: vi.fn().mockResolvedValue(undefined)
    }
    const controller = new AuthSessionController({
      api: api as any,
      browserActivityRuntime,
      storage
    })

    await controller.logout()

    expect(browserActivityRuntime.logout).toHaveBeenCalled()
    await expect(storage.load()).resolves.toBeNull()
  })
})
