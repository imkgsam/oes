import { describe, expect, it, vi } from 'vitest'

vi.mock('@vben/vite-config', () => ({
  defineConfig: (factory: () => unknown) => factory
}))

// Verifies tenant-web does not claim ShortLink edge routes during local development.
describe('tenant-web vite config', () => {
  it('proxies local API requests to the trusted-runtime Gateway by default', async () => {
    const previous = process.env.OES_GATEWAY_HTTP_BASE_URL
    delete process.env.OES_GATEWAY_HTTP_BASE_URL

    try {
      vi.resetModules()
      const { default: createConfig } = await import('../vite.config')
      const config = await createConfig()

      expect(config.vite.server.proxy['/api'].target).toBe(
        'http://127.0.0.1:52101/api/v1'
      )
      expect(config.vite.server.proxy['/public-entry/public'].target).toBe(
        'http://127.0.0.1:52101/api/v1'
      )
    } finally {
      if (previous === undefined) delete process.env.OES_GATEWAY_HTTP_BASE_URL
      else process.env.OES_GATEWAY_HTTP_BASE_URL = previous
    }
  })

  it('allows one explicit Gateway base URL override for local proxying', async () => {
    const previous = process.env.OES_GATEWAY_HTTP_BASE_URL
    process.env.OES_GATEWAY_HTTP_BASE_URL = 'http://127.0.0.1:53101/api/v1'

    try {
      vi.resetModules()
      const { default: createConfig } = await import('../vite.config')
      const config = await createConfig()

      expect(config.vite.server.proxy['/api'].target).toBe(
        'http://127.0.0.1:53101/api/v1'
      )
      expect(config.vite.server.proxy['/public-entry/public'].target).toBe(
        'http://127.0.0.1:53101/api/v1'
      )
    } finally {
      if (previous === undefined) delete process.env.OES_GATEWAY_HTTP_BASE_URL
      else process.env.OES_GATEWAY_HTTP_BASE_URL = previous
    }
  })

  it('keeps ShortLink public edge routing out of tenant-web while preserving anonymous public APIs', async () => {
    const { default: createConfig } = await import('../vite.config')
    const config = await createConfig()
    const proxy = config.vite.server.proxy

    const shortLinkProxyPattern = '^/c(?:/|$)'

    expect(proxy[shortLinkProxyPattern]).toBeUndefined()
    expect(new RegExp(shortLinkProxyPattern).test('/c')).toBe(true)
    expect(new RegExp(shortLinkProxyPattern).test('/c/abc123')).toBe(true)
    expect(new RegExp(shortLinkProxyPattern).test('/crm/accounts')).toBe(false)
    expect(proxy['/public-entry/public']).toMatchObject({
      changeOrigin: true,
      target: 'http://127.0.0.1:52101/api/v1'
    })
    expect(proxy['/public-entry']).toBeUndefined()
  })

  it('does not install a ShortLink HTML navigation fallback plugin', async () => {
    const { default: createConfig } = await import('../vite.config')
    const config = await createConfig()
    const plugins = config.vite.plugins ?? []

    expect(plugins).not.toContainEqual(
      expect.objectContaining({
        name: 'oes-public-short-link-html-proxy'
      })
    )
  })
})
