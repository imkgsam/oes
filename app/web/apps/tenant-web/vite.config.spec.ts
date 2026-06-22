import { describe, expect, it, vi } from 'vitest'

vi.mock('@vben/vite-config', () => ({
  defineConfig: (factory: () => unknown) => factory
}))

// Verifies tenant-web proxies anonymous public-entry URLs to the API Gateway during local development.
describe('tenant-web vite config', () => {
  it('proxies public ShortLink and public BusinessCard anonymous endpoints without hijacking admin pages', async () => {
    const { default: createConfig } = await import('./vite.config')
    const config = await createConfig()
    const proxy = config.vite.server.proxy

    const shortLinkProxyPattern = '^/c(?:/|$)'

    expect(proxy[shortLinkProxyPattern]).toMatchObject({
      changeOrigin: true,
      target: 'http://localhost:9101'
    })
    expect(new RegExp(shortLinkProxyPattern).test('/c')).toBe(true)
    expect(new RegExp(shortLinkProxyPattern).test('/c/abc123')).toBe(true)
    expect(new RegExp(shortLinkProxyPattern).test('/crm/accounts')).toBe(false)
    expect(proxy['/public-entry/public']).toMatchObject({
      changeOrigin: true,
      target: 'http://localhost:9101/api/v1'
    })
    expect(proxy['/public-entry']).toBeUndefined()
  })

  it('installs a pre middleware for browser HTML navigation to public ShortLinks', async () => {
    const { default: createConfig, shouldProxyPublicShortLinkHtmlRequest } = await import('./vite.config')
    const config = await createConfig()
    const plugins = config.vite.plugins

    expect(plugins).toContainEqual(
      expect.objectContaining({
        enforce: 'pre',
        name: 'oes-public-short-link-html-proxy',
        configureServer: expect.any(Function)
      })
    )
    expect(shouldProxyPublicShortLinkHtmlRequest({
      headers: { accept: 'text/html,application/xhtml+xml' },
      url: '/c/sctGfcF'
    })).toBe(true)
    expect(shouldProxyPublicShortLinkHtmlRequest({
      headers: { accept: '*/*' },
      url: '/c/sctGfcF'
    })).toBe(false)
    expect(shouldProxyPublicShortLinkHtmlRequest({
      headers: { accept: 'text/html' },
      url: '/public-entry/business-cards'
    })).toBe(false)
  })
})
