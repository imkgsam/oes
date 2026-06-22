import { describe, expect, it, vi } from 'vitest'

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      defaultHomePath: '/dashboard'
    }
  }
}))

import { coreRoutes } from './core'

// Verifies anonymous BusinessCard routes stay outside authenticated admin route registration.
describe('tenant-web core routes', () => {
  it('registers the anonymous public BusinessCard page as a hidden core route', () => {
    const publicBusinessCardRoute = coreRoutes.find((route) => route.name === 'PublicBusinessCard')

    expect(publicBusinessCardRoute?.path).toBe('/public/business-cards/:businessCardId')
    expect(publicBusinessCardRoute?.meta?.hideInMenu).toBe(true)
    expect(publicBusinessCardRoute?.meta?.hideInTab).toBe(true)
    expect(publicBusinessCardRoute?.meta?.title).toBe('员工数字名片')
    expect(publicBusinessCardRoute?.component).toBeTypeOf('function')
  })

  it('registers a hidden ShortLink fallback route for dev-server SPA fallback navigations', () => {
    const publicShortLinkRoute = coreRoutes.find((route) => route.name === 'PublicShortLinkRedirect')

    expect(publicShortLinkRoute?.path).toBe('/c/:shortCode')
    expect(publicShortLinkRoute?.meta?.hideInMenu).toBe(true)
    expect(publicShortLinkRoute?.meta?.hideInTab).toBe(true)
    expect(publicShortLinkRoute?.component).toBeTypeOf('function')
  })
})
