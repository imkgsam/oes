import { MODULE_METADATA } from '@nestjs/common/constants'
import { NATS_JETSTREAM_RUNTIME_OPTIONS } from '@oes/common/events'
import { SiteAdminApplicationService } from '../application/services/site-admin-application.service'
import { SiteRuntimeApplicationService } from '../application/services/site-runtime-application.service'
import { SiteServiceModule } from '../modules/site-service.module'

type FactoryProvider = {
  provide: unknown
  inject?: unknown[]
  useFactory?: (...args: never[]) => unknown
}

/** siteServiceProviders returns factory providers from the SiteService Nest composition root. */
function siteServiceProviders(): FactoryProvider[] {
  return (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, SiteServiceModule) ?? []).filter(
    (provider: unknown): provider is FactoryProvider =>
      typeof provider === 'object' && provider !== null && 'provide' in provider
  )
}

// Verifies production composition injects one explicit preview secret into both application services.
describe('SiteServiceModule preview secret composition', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalPreviewSecret = process.env.SITE_PREVIEW_TOKEN_SECRET
  const originalNats = { url: process.env.NATS_URL, user: process.env.NATS_USER, password: process.env.NATS_PASSWORD }

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
    if (originalPreviewSecret === undefined) {
      delete process.env.SITE_PREVIEW_TOKEN_SECRET
    } else {
      process.env.SITE_PREVIEW_TOKEN_SECRET = originalPreviewSecret
    }
    if (originalNats.url === undefined) delete process.env.NATS_URL; else process.env.NATS_URL = originalNats.url
    if (originalNats.user === undefined) delete process.env.NATS_USER; else process.env.NATS_USER = originalNats.user
    if (originalNats.password === undefined) delete process.env.NATS_PASSWORD; else process.env.NATS_PASSWORD = originalNats.password
  })

  it.each([
    { secretCase: 'missing', value: undefined },
    { secretCase: 'blank', value: '   ' }
  ])('fails fast in production when SITE_PREVIEW_TOKEN_SECRET is $secretCase', ({ value }) => {
    process.env.NODE_ENV = 'production'
    if (value === undefined) {
      delete process.env.SITE_PREVIEW_TOKEN_SECRET
    } else {
      process.env.SITE_PREVIEW_TOKEN_SECRET = value
    }
    const secretProvider = siteServiceProviders().find(
      (provider) => String(provider.provide) === 'Symbol(SITE_PREVIEW_TOKEN_SECRET)'
    )

    expect(secretProvider).toBeDefined()
    expect(() => secretProvider?.useFactory?.()).toThrow('SITE_PREVIEW_TOKEN_SECRET is required')
  })

  it('injects the same explicit secret provider into Admin and Runtime application factories', () => {
    process.env.NODE_ENV = 'production'
    process.env.SITE_PREVIEW_TOKEN_SECRET = 'module_preview_secret'
    const providers = siteServiceProviders()
    const secretProvider = providers.find(
      (provider) => String(provider.provide) === 'Symbol(SITE_PREVIEW_TOKEN_SECRET)'
    )
    const adminProvider = providers.find(
      (provider) => provider.provide === SiteAdminApplicationService
    )
    const runtimeProvider = providers.find(
      (provider) => provider.provide === SiteRuntimeApplicationService
    )

    expect(secretProvider?.useFactory?.()).toBe('module_preview_secret')
    expect(adminProvider?.inject).toContain(secretProvider?.provide)
    expect(runtimeProvider?.inject).toContain(secretProvider?.provide)
  })

  it('keeps module metadata deterministic while resolving missing NATS configuration only as the broker runtime starts', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, SiteServiceModule) as Array<{ module?: unknown; providers?: FactoryProvider[] }>
    const nats = imports.find((entry) => String(entry?.module).includes('NatsJetStreamModule'))
    const options = nats?.providers?.find((provider) => provider.provide === NATS_JETSTREAM_RUNTIME_OPTIONS)?.useFactory
    expect(options).toBeUndefined()
    const value = nats?.providers?.find((provider) => provider.provide === NATS_JETSTREAM_RUNTIME_OPTIONS) as { useValue?: object }
    const descriptor = Object.getOwnPropertyDescriptor(value.useValue ?? {}, 'servers')
    expect(descriptor?.get).toEqual(expect.any(Function))
    delete process.env.NATS_URL; delete process.env.NATS_USER; delete process.env.NATS_PASSWORD
    expect(() => descriptor?.get?.()).toThrow('NATS_URL_REQUIRED')
  })
})
