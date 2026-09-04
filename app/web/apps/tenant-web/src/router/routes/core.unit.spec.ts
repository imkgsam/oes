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

  it('does not register ShortLink public edge routes in the tenant-web SPA', () => {
    const publicShortLinkRoute = coreRoutes.find((route) => route.name === 'PublicShortLinkRedirect')
    const shortLinkPathRoute = coreRoutes.find((route) => route.path === '/c/:shortCode')

    expect(publicShortLinkRoute).toBeUndefined()
    expect(shortLinkPathRoute).toBeUndefined()
  })
})
