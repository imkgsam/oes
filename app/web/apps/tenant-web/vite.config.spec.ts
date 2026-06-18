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

    expect(proxy['/c']).toMatchObject({
      changeOrigin: true,
      target: 'http://localhost:9101/api/v1'
    })
    expect(proxy['/public-entry/public']).toMatchObject({
      changeOrigin: true,
      target: 'http://localhost:9101/api/v1'
    })
    expect(proxy['/public-entry']).toBeUndefined()
  })
})
