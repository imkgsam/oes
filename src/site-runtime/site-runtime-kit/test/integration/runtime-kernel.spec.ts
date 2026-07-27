import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

import {
  createSiteRuntime,
  createSiteRuntimeFromEnv,
  hashSiteCapabilityManifest,
  NodeSqlitePublishedStore,
  parseSiteCredential,
  type SiteCapabilityManifest,
  type SiteCapabilityRegistrationResponse,
  SiteRuntimeError,
  signCanonicalRequest
} from '../../src'

function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

// credentialForClient creates one signed Runtime identity for a distinct server registration stream.
function credentialForClient(
  clientId: string,
  baseUrl = 'https://oes.example.test/site-api'
): string {
  return encodeCredential({
    site_id: 'brand-us',
    client_id: clientId,
    credential_id: 'cred_123',
    client_secret: 'client_secret',
    webhook_signing_secret: 'webhook_secret',
    oes_base_url: baseUrl,
    environment: 'local'
  })
}

function credential(baseUrl = 'https://oes.example.test/site-api'): string {
  return credentialForClient('client_123', baseUrl)
}

function signedWebhook(nonce: string): { body: string; headers: Record<string, string> } {
  const body = JSON.stringify({
    event_id: 'evt_1',
    site_id: 'brand-us',
    event_type: 'site.publish.available',
    publish_version: 2,
    occurred_at: '2026-06-15T00:00:00.000Z'
  })
  const timestamp = '1781488327000'
  const canonical = [
    'POST',
    '/api/oes/webhook',
    '',
    createHash('sha256').update(body).digest('hex'),
    'x-oes-site-id:brand-us',
    'x-oes-event-id:evt_1',
    `x-oes-timestamp:${timestamp}`,
    `x-oes-nonce:${nonce}`
  ].join('\n')
  return {
    body,
    headers: {
      'x-oes-site-id': 'brand-us',
      'x-oes-timestamp': timestamp,
      'x-oes-nonce': nonce,
      'x-oes-event-id': 'evt_1',
      'x-oes-signature': signCanonicalRequest(canonical, 'webhook_secret')
    }
  }
}

interface RegistrationBackendCall {
  manifestHash: string
  idempotencyKey: string
  expectedGeneration: string
}

// RegistrationCasBackend models the frozen generation CAS and idempotent replay semantics in memory.
class RegistrationCasBackend {
  readonly calls: RegistrationBackendCall[] = []
  generation = 0n
  manifestHash: string | null = null

  private readonly responsesByKey = new Map<
    string,
    {
      manifestHash: string
      expectedGeneration: string
      response: SiteCapabilityRegistrationResponse
    }
  >()
  private readonly dropResponseOnceKeys = new Set<string>()

  // dropResponseOnceAfterCommit injects one transport loss after the backend has durably accepted a key.
  dropResponseOnceAfterCommit(idempotencyKey: string): void {
    this.dropResponseOnceKeys.add(idempotencyKey)
  }

  // register applies one backend-compatible generation CAS or returns the key's original result.
  async register(
    manifest: SiteCapabilityManifest,
    _runtimeVersion: string,
    idempotencyKey: string,
    expectedGeneration: string
  ): Promise<SiteCapabilityRegistrationResponse> {
    const manifestHash = hashSiteCapabilityManifest(manifest)
    this.calls.push({ manifestHash, idempotencyKey, expectedGeneration })
    const replay = this.responsesByKey.get(idempotencyKey)
    if (replay) {
      if (
        replay.manifestHash !== manifestHash ||
        replay.expectedGeneration !== expectedGeneration
      ) {
        throw new SiteRuntimeError({
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'Registration idempotency key was rebound'
        })
      }
      return Object.freeze({ ...replay.response, idempotent_replay: true })
    }

    const accepted = BigInt(expectedGeneration) === this.generation
    if (accepted) {
      this.generation += 1n
      this.manifestHash = manifestHash
    }
    const response = Object.freeze({
      accepted,
      idempotent_replay: false,
      manifest_hash: manifestHash,
      discovered_count: manifest.pages.length,
      unavailable_page_keys: Object.freeze([]),
      drift_page_keys: Object.freeze([]),
      recovered_page_keys: Object.freeze([]),
      registration_generation: this.generation.toString()
    }) satisfies SiteCapabilityRegistrationResponse
    this.responsesByKey.set(idempotencyKey, {
      manifestHash,
      expectedGeneration,
      response
    })
    if (accepted && this.dropResponseOnceKeys.delete(idempotencyKey)) {
      throw new SiteRuntimeError({
        code: 'NETWORK_ERROR',
        message: 'Registration response was lost after backend commit'
      })
    }
    return response
  }
}

describe('SiteRuntime kernel', () => {
  it('exposes a deeply frozen capability manifest snapshot instead of mutable runtime state', async () => {
    const inputManifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-readonly-manifest-')), 'runtime.sqlite'),
      capabilityManifest: inputManifest,
      client: { getLatestPublishState: jest.fn() },
      pullIntervalMs: 0
    })
    const exposedManifest = runtime.capabilities.manifest

    expect(Object.isFrozen(runtime.capabilities)).toBe(true)
    expect(Object.isFrozen(exposedManifest)).toBe(true)
    expect(Object.isFrozen(exposedManifest?.pages)).toBe(true)
    expect(Object.isFrozen(exposedManifest?.pages[0])).toBe(true)
    expect(Object.isFrozen(exposedManifest?.pages[0]?.supportedLocales)).toBe(true)
    inputManifest.pages[0]!.supportedLocales.push('zh-CN')
    expect(exposedManifest).toEqual({
      pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }]
    })
  })

  it('runs concurrent start calls as one lifecycle flight with one init, registration, sync, and timer', async () => {
    jest.useFakeTimers()
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-start-flight-')), 'runtime.sqlite')
    })
    const init = jest.spyOn(store, 'init')
    const timer = jest.spyOn(globalThis, 'setInterval')
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const registerPageCapabilities = jest.fn(async () => ({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: hashSiteCapabilityManifest(manifest),
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '1'
    }))
    const syncToLatest = jest.fn(async () => ({
      status: 'completed' as const,
      localPublishVersion: 0
    }))
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: manifest,
      client: { registerPageCapabilities, getLatestPublishState: jest.fn() },
      sync: { syncToLatest },
      pullIntervalMs: 1_000
    })

    try {
      await Promise.all([runtime.start(), runtime.start(), runtime.start()])

      expect(init).toHaveBeenCalledTimes(1)
      expect(registerPageCapabilities).toHaveBeenCalledTimes(1)
      expect(syncToLatest).toHaveBeenCalledTimes(1)
      expect(timer).toHaveBeenCalledTimes(1)
      await runtime.stop()
    } finally {
      timer.mockRestore()
      jest.useRealTimers()
    }
  })

  it('keeps a shared store open until the last runtime owner stops', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-shared-store-')), 'runtime.sqlite')
    })
    await store.init()
    await store.replaceSnapshot({
      siteId: 'brand-us',
      publishVersion: 1,
      resources: [
        {
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          slug: 'basin',
          locale: 'en-US',
          status: 'published',
          publishVersion: 1,
          payloadJson: JSON.stringify({ display_title: 'Basin' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ]
    })
    const init = jest.spyOn(store, 'init')
    const close = jest.spyOn(store, 'close')
    const firstSync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 1 }))
    const secondSync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 1 }))
    const first = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      client: { getLatestPublishState: jest.fn() },
      sync: { syncToLatest: firstSync },
      pullIntervalMs: 0
    })
    const second = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      client: { getLatestPublishState: jest.fn() },
      sync: { syncToLatest: secondSync },
      pullIntervalMs: 0
    })

    await Promise.all([first.start(), second.start()])
    expect(init).toHaveBeenCalledTimes(1)

    await first.stop()

    expect(close).not.toHaveBeenCalled()
    await expect(second.publicViews.products.getBySlug('basin', 'en-US')).resolves.toMatchObject({
      publishVersion: 1,
      payload: { display_title: 'Basin' }
    })
    await expect(second.sync.syncToLatest('manual')).resolves.toMatchObject({
      status: 'completed',
      localPublishVersion: 1
    })

    await second.stop()
    expect(close).toHaveBeenCalledTimes(1)
    await expect(second.publicViews.products.getBySlug('basin', 'en-US')).rejects.toThrow()
  })

  it('serializes stop behind an in-flight start before releasing the store', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-start-stop-')), 'runtime.sqlite')
    })
    const originalInit = store.init.bind(store)
    let releaseInit: (() => void) | undefined
    const initGate = new Promise<void>((resolve) => {
      releaseInit = resolve
    })
    const init = jest.spyOn(store, 'init').mockImplementation(async () => {
      await initGate
      await originalInit()
    })
    const close = jest.spyOn(store, 'close')
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      client: { getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })

    const start = runtime.start()
    const stop = runtime.stop()
    releaseInit?.()
    await Promise.all([start, stop])

    expect(init).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
    await expect(runtime.health.ready()).resolves.toEqual({ ready: false, status: 'failed' })
  })

  it('rolls back shared store ownership when acquisition fails and permits a clean retry', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-acquire-retry-')), 'runtime.sqlite')
    })
    const originalInit = store.init.bind(store)
    const init = jest
      .spyOn(store, 'init')
      .mockRejectedValueOnce(new Error('init unavailable'))
      .mockImplementation(originalInit)
    const close = jest.spyOn(store, 'close')
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      client: { getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })

    await expect(runtime.start()).rejects.toThrow(/init unavailable/)
    await expect(runtime.health.ready()).resolves.toEqual({ ready: false, status: 'failed' })

    await runtime.start()
    await runtime.stop()

    expect(init).toHaveBeenCalledTimes(2)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('releases acquired store ownership when a later start side effect fails', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-start-rollback-')), 'runtime.sqlite')
    })
    const init = jest.spyOn(store, 'init')
    const close = jest.spyOn(store, 'close')
    const timer = jest.spyOn(globalThis, 'setInterval').mockImplementationOnce(() => {
      throw new Error('timer unavailable')
    })
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      client: { getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 1_000
    })

    try {
      await expect(runtime.start()).rejects.toThrow(/timer unavailable/)
      expect(init).toHaveBeenCalledTimes(1)
      expect(close).toHaveBeenCalledTimes(1)
      await expect(runtime.health.ready()).resolves.toEqual({ ready: false, status: 'failed' })

      timer.mockRestore()
      await runtime.start()
      await runtime.stop()
      expect(init).toHaveBeenCalledTimes(2)
      expect(close).toHaveBeenCalledTimes(2)
    } finally {
      timer.mockRestore()
    }
  })

  it('retains ownership for a stop retry when start rollback cannot close the store', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-rollback-close-retry-')), 'runtime.sqlite')
    })
    const originalClose = store.close.bind(store)
    const close = jest
      .spyOn(store, 'close')
      .mockRejectedValueOnce(new Error('close unavailable'))
      .mockImplementation(originalClose)
    const timer = jest.spyOn(globalThis, 'setInterval').mockImplementationOnce(() => {
      throw new Error('timer unavailable')
    })
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      client: { getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 1_000
    })

    try {
      await expect(runtime.start()).rejects.toThrow()
      expect(close).toHaveBeenCalledTimes(1)

      await runtime.stop()

      expect(close).toHaveBeenCalledTimes(2)
      await expect(runtime.health.ready()).resolves.toEqual({ ready: false, status: 'failed' })
    } finally {
      timer.mockRestore()
      await originalClose().catch(() => undefined)
    }
  })

  it('surfaces a committed-but-reporting-degraded sync result without reporting publication failure', async () => {
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-degraded-reporting-')), 'runtime.sqlite'),
      client: { getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({
          status: 'degraded' as const,
          localPublishVersion: 2
        }))
      },
      pullIntervalMs: 0
    })

    await runtime.start()

    await expect(runtime.getStatus()).resolves.toMatchObject({
      status: 'degraded',
      last_sync_status: 'degraded',
      last_error_code: undefined,
      last_error_message: undefined
    })
    await runtime.stop()
  })

  it('single-flights the same manifest registration across runtime instances sharing one store', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-flight-')), 'runtime.sqlite')
    })
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const manifestHash = hashSiteCapabilityManifest(manifest)
    let releaseRegistration: (() => void) | undefined
    let markRegistrationStarted: (() => void) | undefined
    const registrationStarted = new Promise<void>((resolve) => {
      markRegistrationStarted = resolve
    })
    const registrationGate = new Promise<void>((resolve) => {
      releaseRegistration = resolve
    })
    const registerA = jest.fn(async () => {
      markRegistrationStarted?.()
      await registrationGate
      return {
        accepted: true,
        idempotent_replay: false,
        manifest_hash: manifestHash,
        discovered_count: 1,
        unavailable_page_keys: [],
        drift_page_keys: [],
        recovered_page_keys: [],
        registration_generation: '1'
      }
    })
    const registerB = jest.fn(async () => ({
      accepted: true,
      idempotent_replay: true,
      manifest_hash: manifestHash,
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '1'
    }))
    const first = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-A',
      client: { registerPageCapabilities: registerA, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 })) },
      pullIntervalMs: 0
    })
    const second = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-B',
      client: { registerPageCapabilities: registerB, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 })) },
      pullIntervalMs: 0
    })

    const firstStart = first.start()
    await registrationStarted
    const secondStart = second.start()
    releaseRegistration?.()
    await Promise.all([firstStart, secondStart])

    expect(registerA.mock.calls.length + registerB.mock.calls.length).toBe(1)
    await expect(store.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      manifestHash,
      idempotencyKey: 'registration-A'
    })
    await first.stop()
    await second.stop()
  })

  it('serializes different manifests so the latest generation wins locally and at the backend', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-fence-')), 'runtime.sqlite')
    })
    const homeManifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const emptyManifest = { pages: [] }
    const homeHash = hashSiteCapabilityManifest(homeManifest)
    const emptyHash = hashSiteCapabilityManifest(emptyManifest)
    const remoteOrder: string[] = []
    let backendManifestHash: string | null = null
    let releaseHome: (() => void) | undefined
    let markHomeStarted: (() => void) | undefined
    const homeStarted = new Promise<void>((resolve) => {
      markHomeStarted = resolve
    })
    const homeGate = new Promise<void>((resolve) => {
      releaseHome = resolve
    })
    const homeSync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const emptySync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const home = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: homeManifest,
      capabilityRegistrationIdFactory: () => 'registration-home',
      client: {
        registerPageCapabilities: jest.fn(async () => {
          remoteOrder.push('home:start')
          markHomeStarted?.()
          await homeGate
          backendManifestHash = homeHash
          remoteOrder.push('home:complete')
          return {
            accepted: true,
            idempotent_replay: false,
            manifest_hash: homeHash,
            discovered_count: 1,
            unavailable_page_keys: [],
            drift_page_keys: [],
            recovered_page_keys: [],
            registration_generation: '1'
          }
        }),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: homeSync },
      pullIntervalMs: 0
    })
    const emptyRegister = jest.fn(async () => {
      remoteOrder.push('empty:start')
      backendManifestHash = emptyHash
      remoteOrder.push('empty:complete')
      return {
        accepted: true,
        idempotent_replay: false,
        manifest_hash: emptyHash,
        discovered_count: 0,
        unavailable_page_keys: ['HOME'],
        drift_page_keys: [],
        recovered_page_keys: [],
        registration_generation: '2'
      }
    })
    const empty = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: emptyManifest,
      capabilityRegistrationIdFactory: () => 'registration-empty',
      client: {
        registerPageCapabilities: emptyRegister,
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: emptySync },
      pullIntervalMs: 0
    })

    const homeStart = home.start()
    await homeStarted
    const emptyStart = empty.start()
    await Promise.resolve()
    expect(emptyRegister).not.toHaveBeenCalled()
    releaseHome?.()
    await Promise.all([homeStart, emptyStart])

    await expect(store.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      manifestHash: emptyHash,
      idempotencyKey: 'registration-empty',
      responseJson: expect.stringContaining(emptyHash)
    })
    expect(remoteOrder).toEqual(['home:start', 'home:complete', 'empty:start', 'empty:complete'])
    expect(backendManifestHash).toBe(emptyHash)
    expect(homeSync).toHaveBeenCalledWith('startup')
    expect(emptySync).toHaveBeenCalledWith('startup')
    await home.stop()
    await empty.stop()
  })

  it('serializes different manifests across SQLite connections before the newer runtime takes over', async () => {
    const storePath = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-connections-')), 'runtime.sqlite')
    const firstStore = new NodeSqlitePublishedStore({ path: storePath })
    const secondStore = new NodeSqlitePublishedStore({ path: storePath })
    const homeManifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const emptyManifest = { pages: [] }
    const homeHash = hashSiteCapabilityManifest(homeManifest)
    const emptyHash = hashSiteCapabilityManifest(emptyManifest)
    const remoteOrder: string[] = []
    let releaseHome: (() => void) | undefined
    let markHomeStarted: (() => void) | undefined
    const homeStarted = new Promise<void>((resolve) => {
      markHomeStarted = resolve
    })
    const homeGate = new Promise<void>((resolve) => {
      releaseHome = resolve
    })
    const homeSync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const emptySync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const home = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store: firstStore,
      capabilityManifest: homeManifest,
      capabilityRegistrationIdFactory: () => 'registration-home',
      client: {
        registerPageCapabilities: jest.fn(async () => {
          remoteOrder.push('home:start')
          markHomeStarted?.()
          await homeGate
          remoteOrder.push('home:complete')
          return {
            accepted: true,
            idempotent_replay: false,
            manifest_hash: homeHash,
            discovered_count: 1,
            unavailable_page_keys: [],
            drift_page_keys: [],
            recovered_page_keys: [],
            registration_generation: '1'
          }
        }),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: homeSync },
      pullIntervalMs: 0
    })
    const emptyRegister = jest.fn(async () => {
      remoteOrder.push('empty:start')
      remoteOrder.push('empty:complete')
      return {
        accepted: true,
        idempotent_replay: false,
        manifest_hash: emptyHash,
        discovered_count: 0,
        unavailable_page_keys: ['HOME'],
        drift_page_keys: [],
        recovered_page_keys: [],
        registration_generation: '2'
      }
    })
    const empty = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store: secondStore,
      capabilityManifest: emptyManifest,
      capabilityRegistrationIdFactory: () => 'registration-empty',
      client: { registerPageCapabilities: emptyRegister, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: emptySync },
      pullIntervalMs: 0
    })

    const homeStart = home.start()
    await homeStarted
    const emptyStart = empty.start()
    await Promise.resolve()
    expect(emptyRegister).not.toHaveBeenCalled()
    releaseHome?.()
    await Promise.all([homeStart, emptyStart])

    await expect(secondStore.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      manifestHash: emptyHash,
      idempotencyKey: 'registration-empty',
      responseJson: expect.stringContaining(emptyHash)
    })
    expect(remoteOrder).toEqual(['home:start', 'home:complete', 'empty:start', 'empty:complete'])
    expect(homeSync).toHaveBeenCalledWith('startup')
    expect(emptySync).toHaveBeenCalledWith('startup')
    await home.stop()
    await empty.stop()
  })

  it('persists the confirmed remote generation and replays the original expected generation after restart', async () => {
    const storePath = join(
      mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-generation-restart-')),
      'runtime.sqlite'
    )
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const backend = new RegistrationCasBackend()
    const first = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-restart',
      client: {
        registerPageCapabilities: backend.register.bind(backend),
        getLatestPublishState: jest.fn()
      },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })

    await first.start()
    await first.stop()

    const restartedStore = new NodeSqlitePublishedStore({ path: storePath })
    const restarted = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store: restartedStore,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'must-not-replace-replay-key',
      client: {
        registerPageCapabilities: backend.register.bind(backend),
        getLatestPublishState: jest.fn()
      },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })

    await restarted.start()

    expect(backend.calls).toEqual([
      {
        manifestHash: hashSiteCapabilityManifest(manifest),
        idempotencyKey: 'registration-restart',
        expectedGeneration: '0'
      },
      {
        manifestHash: hashSiteCapabilityManifest(manifest),
        idempotencyKey: 'registration-restart',
        expectedGeneration: '0'
      }
    ])
    await expect(restartedStore.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      idempotencyKey: 'registration-restart',
      remoteRegistrationGeneration: '1',
      expectedRegistrationGeneration: '0',
      idempotencyKeyTerminal: false,
      responseJson: expect.stringContaining('registration_generation')
    })
    await restarted.stop()
  })

  it('starts a fresh registration stream after client credential rotation without inheriting generation', async () => {
    const storePath = join(
      mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-client-rotation-')),
      'runtime.sqlite'
    )
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const manifestHash = hashSiteCapabilityManifest(manifest)
    const storeA = new NodeSqlitePublishedStore({ path: storePath })
    const runtimeA = await createSiteRuntime({
      credential: parseSiteCredential(credentialForClient('client-A')),
      store: storeA,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-A',
      client: {
        registerPageCapabilities: jest.fn(async () => ({
          accepted: true,
          idempotent_replay: false,
          manifest_hash: manifestHash,
          discovered_count: 1,
          unavailable_page_keys: [],
          drift_page_keys: [],
          recovered_page_keys: [],
          registration_generation: '1'
        })),
        getLatestPublishState: jest.fn()
      },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })
    await runtimeA.start()
    await runtimeA.stop()

    const bCalls: Array<{ idempotencyKey: string; expectedGeneration: string }> = []
    const registerB = jest.fn(async (
      _manifest: SiteCapabilityManifest,
      _runtimeVersion: string,
      idempotencyKey: string,
      expectedGeneration: string
    ) => {
      bCalls.push({ idempotencyKey, expectedGeneration })
      return {
        accepted: true,
        idempotent_replay: false,
        manifest_hash: manifestHash,
        discovered_count: 1,
        unavailable_page_keys: [],
        drift_page_keys: [],
        recovered_page_keys: [],
        registration_generation: '1'
      }
    })
    const storeB = new NodeSqlitePublishedStore({ path: storePath })
    const runtimeB = await createSiteRuntime({
      credential: parseSiteCredential(credentialForClient('client-B')),
      store: storeB,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-B-1',
      client: { registerPageCapabilities: registerB, getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })

    await runtimeB.start()

    expect(bCalls).toEqual([
      { idempotencyKey: 'registration-B-1', expectedGeneration: '0' }
    ])
    await expect(
      storeB.getCapabilityRegistrationState('brand-us', 'client-A')
    ).resolves.toMatchObject({
      clientId: 'client-A',
      idempotencyKey: 'registration-A',
      remoteRegistrationGeneration: '1'
    })
    await expect(
      storeB.getCapabilityRegistrationState('brand-us', 'client-B')
    ).resolves.toMatchObject({
      clientId: 'client-B',
      idempotencyKey: 'registration-B-1',
      expectedRegistrationGeneration: '0',
      remoteRegistrationGeneration: '1'
    })
    await runtimeB.stop()
  })

  it('does not single-flight or lease-block registration streams for different clients', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-client-concurrency-')), 'runtime.sqlite')
    })
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const manifestHash = hashSiteCapabilityManifest(manifest)
    let markAStarted: (() => void) | undefined
    let releaseA: (() => void) | undefined
    let releaseB: (() => void) | undefined
    const aStarted = new Promise<void>((resolve) => {
      markAStarted = resolve
    })
    const gateA = new Promise<void>((resolve) => {
      releaseA = resolve
    })
    const gateB = new Promise<void>((resolve) => {
      releaseB = resolve
    })
    const response = {
      accepted: true,
      idempotent_replay: false,
      manifest_hash: manifestHash,
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '1'
    }
    const registerA = jest.fn(async () => {
      markAStarted?.()
      await gateA
      return response
    })
    const registerB = jest.fn(async () => {
      await gateB
      return response
    })
    const runtimeA = await createSiteRuntime({
      credential: parseSiteCredential(credentialForClient('client-A')),
      store,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-A',
      client: { registerPageCapabilities: registerA, getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })
    const runtimeB = await createSiteRuntime({
      credential: parseSiteCredential(credentialForClient('client-B')),
      store,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-B',
      client: { registerPageCapabilities: registerB, getLatestPublishState: jest.fn() },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })

    const startA = runtimeA.start()
    await aStarted
    const startB = runtimeB.start()
    await new Promise<void>((resolve) => setImmediate(resolve))
    const bCallsBeforeAReleased = registerB.mock.calls.length
    releaseA?.()
    releaseB?.()
    await Promise.all([startA, startB])

    expect(bCallsBeforeAReleased).toBe(1)
    expect(registerA).toHaveBeenCalledTimes(1)
    expect(registerB).toHaveBeenCalledTimes(1)
    await expect(
      store.getCapabilityRegistrationState('brand-us', 'client-A')
    ).resolves.toMatchObject({ clientId: 'client-A', idempotencyKey: 'registration-A' })
    await expect(
      store.getCapabilityRegistrationState('brand-us', 'client-B')
    ).resolves.toMatchObject({ clientId: 'client-B', idempotencyKey: 'registration-B' })
    await runtimeA.stop()
    await runtimeB.stop()
  })

  it('fences a delayed stale A response after B has become the accepted desired manifest', async () => {
    const storePath = join(
      mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-delayed-stale-')),
      'runtime.sqlite'
    )
    const storeA = new NodeSqlitePublishedStore({ path: storePath })
    const storeB = new NodeSqlitePublishedStore({ path: storePath })
    const manifestA = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const manifestB = { pages: [] }
    const backend = new RegistrationCasBackend()
    let releaseA: (() => void) | undefined
    let markAStarted: (() => void) | undefined
    const aGate = new Promise<void>((resolve) => {
      releaseA = resolve
    })
    const aStarted = new Promise<void>((resolve) => {
      markAStarted = resolve
    })
    const syncA = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const syncB = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const runtimeA = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store: storeA,
      capabilityManifest: manifestA,
      capabilityRegistrationIdFactory: () => 'registration-A',
      capabilityRegistrationClaimLeaseMs: 50,
      now: () => 1_000,
      client: {
        registerPageCapabilities: async (...args) => {
          markAStarted?.()
          await aGate
          return backend.register(...args)
        },
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: syncA },
      pullIntervalMs: 0
    })
    const runtimeB = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store: storeB,
      capabilityManifest: manifestB,
      capabilityRegistrationIdFactory: () => 'registration-B',
      capabilityRegistrationClaimLeaseMs: 50,
      now: () => 1_100,
      client: {
        registerPageCapabilities: backend.register.bind(backend),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: syncB },
      pullIntervalMs: 0
    })

    const startA = runtimeA.start()
    await aStarted
    await runtimeB.start()
    releaseA?.()
    await startA

    expect(backend.generation).toBe(1n)
    expect(backend.manifestHash).toBe(hashSiteCapabilityManifest(manifestB))
    expect(syncA).not.toHaveBeenCalled()
    expect(syncB).toHaveBeenCalledWith('startup')
    await expect(storeB.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      manifestHash: hashSiteCapabilityManifest(manifestB),
      idempotencyKey: 'registration-B',
      remoteRegistrationGeneration: '1',
      expectedRegistrationGeneration: '0'
    })
    await runtimeA.stop()
    await runtimeB.stop()
  })

  it('keeps an independent-host stale manifest fenced across pull fallback and restart', async () => {
    jest.useFakeTimers()
    const storePathA = join(
      mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-stale-host-A-')),
      'runtime.sqlite'
    )
    const storePathB = join(
      mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-stale-host-B-')),
      'runtime.sqlite'
    )
    const storeA = new NodeSqlitePublishedStore({ path: storePathA })
    await storeA.init()
    await storeA.replaceSnapshot({
      siteId: 'brand-us',
      publishVersion: 3,
      resources: [
        {
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          slug: 'old-basin',
          locale: 'en-US',
          status: 'published',
          publishVersion: 3,
          payloadJson: JSON.stringify({ display_title: 'Old Basin' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ]
    })
    await storeA.close()

    const oldManifestA = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const newManifestB = { pages: [] }
    const backend = new RegistrationCasBackend()
    let releaseA: (() => void) | undefined
    let markAStarted: (() => void) | undefined
    const aGate = new Promise<void>((resolve) => {
      releaseA = resolve
    })
    const aStarted = new Promise<void>((resolve) => {
      markAStarted = resolve
    })
    const aKeys = ['registration-old-A-1', 'registration-old-A-2']
    const aIdFactory = jest.fn(() => {
      const key = aKeys.shift()
      if (!key) {
        throw new Error('Unexpected extra old-A registration claim')
      }
      return key
    })
    const registerA = jest.fn(async (...args: Parameters<RegistrationCasBackend['register']>) => {
      markAStarted?.()
      await aGate
      return backend.register(...args)
    })
    const syncA = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 4 }))
    const runtimeA = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store: storeA,
      capabilityManifest: oldManifestA,
      capabilityRegistrationIdFactory: aIdFactory,
      client: { registerPageCapabilities: registerA, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: syncA },
      pullIntervalMs: 1_000
    })
    const runtimeB = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: storePathB,
      capabilityManifest: newManifestB,
      capabilityRegistrationIdFactory: () => 'registration-new-B',
      client: {
        registerPageCapabilities: backend.register.bind(backend),
        getLatestPublishState: jest.fn()
      },
      sync: {
        syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
      },
      pullIntervalMs: 0
    })

    const startA = runtimeA.start()
    await aStarted
    await runtimeB.start()
    await runtimeB.stop()
    releaseA?.()
    await startA
    await jest.advanceTimersByTimeAsync(3_000)

    const staleState = await storeA.getCapabilityRegistrationState('brand-us', 'client_123')
    const staleStatus = await runtimeA.getStatus()
    const staleResource = await runtimeA.publicViews.products.getBySlug('old-basin', 'en-US')
    await runtimeA.stop()

    const restartedRegister = jest.fn(
      async (...args: Parameters<RegistrationCasBackend['register']>) =>
        backend.register(...args)
    )
    const restartedSync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 4 }))
    const restarted = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: storePathA,
      capabilityManifest: oldManifestA,
      capabilityRegistrationIdFactory: () => 'registration-old-A-restart',
      client: {
        registerPageCapabilities: restartedRegister,
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: restartedSync },
      pullIntervalMs: 0
    })
    await restarted.start()
    const restartedStatus = await restarted.getStatus()
    const restartedResource = await restarted.publicViews.products.getBySlug('old-basin', 'en-US')
    await restarted.stop()
    jest.useRealTimers()

    expect(registerA).toHaveBeenCalledTimes(1)
    expect(aIdFactory).toHaveBeenCalledTimes(1)
    expect(restartedRegister).not.toHaveBeenCalled()
    expect(syncA).not.toHaveBeenCalled()
    expect(restartedSync).not.toHaveBeenCalled()
    expect(backend.generation).toBe(1n)
    expect(backend.manifestHash).toBe(hashSiteCapabilityManifest(newManifestB))
    expect(backend.calls).toEqual([
      {
        manifestHash: hashSiteCapabilityManifest(newManifestB),
        idempotencyKey: 'registration-new-B',
        expectedGeneration: '0'
      },
      {
        manifestHash: hashSiteCapabilityManifest(oldManifestA),
        idempotencyKey: 'registration-old-A-1',
        expectedGeneration: '0'
      }
    ])
    expect(staleState).toMatchObject({
      manifestHash: hashSiteCapabilityManifest(oldManifestA),
      idempotencyKey: 'registration-old-A-1',
      remoteRegistrationGeneration: '1',
      idempotencyKeyTerminal: true,
      responseJson: expect.stringContaining('"accepted":false')
    })
    expect(staleStatus).toMatchObject({
      status: 'degraded',
      local_publish_version: 3,
      last_error_code: 'CAPABILITY_REGISTRATION_FENCED'
    })
    expect(restartedStatus).toMatchObject({
      status: 'degraded',
      local_publish_version: 3,
      last_error_code: 'CAPABILITY_REGISTRATION_FENCED'
    })
    expect(staleResource).toMatchObject({ publishVersion: 3, slug: 'old-basin' })
    expect(restartedResource).toMatchObject({ publishVersion: 3, slug: 'old-basin' })
  })

  it('allows a new manifest to claim the observed generation after a stale terminal', async () => {
    const storePath = join(
      mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-new-manifest-after-stale-')),
      'runtime.sqlite'
    )
    const oldManifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const newManifest = { pages: [] }
    const oldHash = hashSiteCapabilityManifest(oldManifest)
    const newHash = hashSiteCapabilityManifest(newManifest)
    const seedStore = new NodeSqlitePublishedStore({ path: storePath })
    await seedStore.init()
    const staleClaim = await seedStore.claimCapabilityRegistration({
      siteId: 'brand-us',
      clientId: 'client_123',
      manifestHash: oldHash,
      proposedIdempotencyKey: 'registration-old-terminal',
      claimToken: 'claim-old-terminal',
      claimedAtMs: 1_000,
      leaseDurationMs: 100,
      updatedAt: '2026-06-15T00:00:00.000Z'
    })
    await seedStore.completeCapabilityRegistrationClaim({
      siteId: 'brand-us',
      clientId: 'client_123',
      manifestHash: oldHash,
      generation: staleClaim.state.generation,
      claimToken: 'claim-old-terminal',
      responseJson: JSON.stringify({
        accepted: false,
        idempotent_replay: false,
        manifest_hash: oldHash,
        discovered_count: 1,
        unavailable_page_keys: [],
        drift_page_keys: [],
        recovered_page_keys: [],
        registration_generation: '1'
      }),
      remoteRegistrationGeneration: '1',
      idempotencyKeyTerminal: true,
      updatedAt: '2026-06-15T00:00:01.000Z'
    })
    await seedStore.close()

    const registerNewManifest = jest.fn(async () => ({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: newHash,
      discovered_count: 0,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '2'
    }))
    const syncToLatest = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: newManifest,
      capabilityRegistrationIdFactory: () => 'registration-new-manifest',
      client: {
        registerPageCapabilities: registerNewManifest,
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      pullIntervalMs: 0
    })

    await runtime.start()

    expect(registerNewManifest).toHaveBeenCalledWith(
      newManifest,
      '0.1.0',
      'registration-new-manifest',
      '1'
    )
    expect(syncToLatest).toHaveBeenCalledWith('startup')
    await runtime.stop()
  })

  it('recovers a backend commit with the original key and expected generation after response loss', async () => {
    const storePath = join(
      mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-response-loss-')),
      'runtime.sqlite'
    )
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const backend = new RegistrationCasBackend()
    backend.dropResponseOnceAfterCommit('registration-response-lost')
    const failedSync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const first = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-response-lost',
      client: {
        registerPageCapabilities: backend.register.bind(backend),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: failedSync },
      pullIntervalMs: 0
    })

    await first.start()
    expect(failedSync).not.toHaveBeenCalled()
    await first.stop()

    const recoveredStore = new NodeSqlitePublishedStore({ path: storePath })
    const recoveredSync = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const recovered = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store: recoveredStore,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'must-not-replace-lost-response-key',
      client: {
        registerPageCapabilities: backend.register.bind(backend),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest: recoveredSync },
      pullIntervalMs: 0
    })

    await recovered.start()

    expect(backend.generation).toBe(1n)
    expect(backend.calls.map(({ idempotencyKey, expectedGeneration }) => ({
      idempotencyKey,
      expectedGeneration
    }))).toEqual([
      { idempotencyKey: 'registration-response-lost', expectedGeneration: '0' },
      { idempotencyKey: 'registration-response-lost', expectedGeneration: '0' }
    ])
    expect(recoveredSync).toHaveBeenCalledWith('startup')
    await expect(recoveredStore.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      idempotencyKey: 'registration-response-lost',
      remoteRegistrationGeneration: '1',
      expectedRegistrationGeneration: '0',
      responseJson: expect.stringContaining('registration_generation')
    })
    await recovered.stop()
  })

  it('does not persist or synchronize an accepted registration response for the wrong manifest hash', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-invalid-')), 'runtime.sqlite')
    })
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const syncToLatest = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: manifest,
      capabilityRegistrationIdFactory: () => 'registration-invalid',
      client: {
        registerPageCapabilities: jest.fn(async () => ({
          accepted: true,
          idempotent_replay: false,
          manifest_hash: 'wrong-manifest-hash',
          discovered_count: 1,
          unavailable_page_keys: [],
          drift_page_keys: [],
          recovered_page_keys: [],
          registration_generation: '1'
        })),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      pullIntervalMs: 0
    })

    await runtime.start()

    await expect(store.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      manifestHash: hashSiteCapabilityManifest(manifest),
      responseJson: null,
      claimToken: null
    })
    expect(syncToLatest).not.toHaveBeenCalled()
    await expect(runtime.getStatus()).resolves.toMatchObject({ status: 'degraded' })
    await runtime.stop()
  })

  it('rejects malformed custom-client registration fields before persistence or synchronization', async () => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-custom-invalid-')), 'runtime.sqlite')
    })
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const syncToLatest = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: manifest,
      client: {
        registerPageCapabilities: jest.fn(async () => ({
          accepted: true,
          idempotent_replay: false,
          manifest_hash: hashSiteCapabilityManifest(manifest),
          discovered_count: 1,
          unavailable_page_keys: [],
          drift_page_keys: [],
          recovered_page_keys: [],
          registration_generation: '1',
          unexpected: true
        })),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      pullIntervalMs: 0
    })

    await runtime.start()

    await expect(store.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      responseJson: null,
      claimToken: null
    })
    expect(runtime.capabilities.getLastRegistration()).toBeNull()
    expect(syncToLatest).not.toHaveBeenCalled()
    await runtime.stop()
  })

  it.each([
    ['missing', undefined],
    ['native number', 1],
    ['leading zero', '01'],
    ['overflow', '18446744073709551616']
  ])('rejects a custom-client registration response with %s generation', async (_label, generation) => {
    const store = new NodeSqlitePublishedStore({
      path: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-custom-generation-')), 'runtime.sqlite')
    })
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const manifestHash = hashSiteCapabilityManifest(manifest)
    const syncToLatest = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 }))
    const malformedResponse = {
      accepted: true,
      idempotent_replay: false,
      manifest_hash: manifestHash,
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: generation
    } as unknown as SiteCapabilityRegistrationResponse
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      store,
      capabilityManifest: manifest,
      client: {
        registerPageCapabilities: jest.fn(async () => malformedResponse),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      pullIntervalMs: 0
    })

    await runtime.start()

    await expect(store.getCapabilityRegistrationState('brand-us', 'client_123')).resolves.toMatchObject({
      responseJson: null,
      remoteRegistrationGeneration: '0',
      claimToken: null
    })
    expect(runtime.capabilities.getLastRegistration()).toBeNull()
    expect(syncToLatest).not.toHaveBeenCalled()
    await runtime.stop()
  })

  it.each(['overflow generation', 'manifest hash mismatch'])(
    'rejects a persisted registration response with %s during restart recovery',
    async (failureKind) => {
      const storePath = join(
        mkdtempSync(join(tmpdir(), 'oes-site-runtime-registration-persisted-invalid-')),
        'runtime.sqlite'
      )
      const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
      const manifestHash = hashSiteCapabilityManifest(manifest)
      const seedStore = new NodeSqlitePublishedStore({ path: storePath })
      await seedStore.init()
      await seedStore.saveCapabilityRegistrationState({
        siteId: 'brand-us',
        clientId: 'client_123',
        manifestHash,
        idempotencyKey: 'registration-persisted',
        responseJson: JSON.stringify({
          accepted: true,
          idempotent_replay: false,
          manifest_hash:
            failureKind === 'manifest hash mismatch' ? 'wrong-manifest-hash' : manifestHash,
          discovered_count: 1,
          unavailable_page_keys: [],
          drift_page_keys: [],
          recovered_page_keys: [],
          registration_generation:
            failureKind === 'overflow generation' ? '18446744073709551616' : '1'
        }),
        generation: 1,
        claimToken: null,
        claimExpiresAtMs: null,
        remoteRegistrationGeneration: '1',
        expectedRegistrationGeneration: '0',
        idempotencyKeyTerminal: false,
        updatedAt: '2026-06-15T00:00:00.000Z'
      })
      await seedStore.close()
      const syncToLatest = jest.fn(async () => ({
        status: 'completed' as const,
        localPublishVersion: 0
      }))
      const runtime = await createSiteRuntime({
        credential: parseSiteCredential(credential()),
        storePath,
        capabilityManifest: manifest,
        client: {
          registerPageCapabilities: jest.fn(async () => {
            throw new SiteRuntimeError({
              code: 'NETWORK_ERROR',
              message: 'registration unavailable'
            })
          }),
          getLatestPublishState: jest.fn()
        },
        sync: { syncToLatest },
        pullIntervalMs: 0
      })

      await runtime.start()

      expect(runtime.capabilities.getLastRegistration()).toBeNull()
      expect(syncToLatest).not.toHaveBeenCalled()
      await expect(runtime.getStatus()).resolves.toMatchObject({ status: 'degraded' })
      await runtime.stop()
    }
  )

  it('registers the complete capability manifest before the startup pull', async () => {
    const calls: string[] = []
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const registerPageCapabilities = jest.fn(async (
      _manifest: { pages: Array<{ pageKey: string; supportedLocales: string[] }> },
      _runtimeVersion: string,
      _idempotencyKey: string,
      _expectedRegistrationGeneration: string
    ) => {
      calls.push('register')
      return {
        accepted: true,
        idempotent_replay: false,
        manifest_hash: hashSiteCapabilityManifest(manifest),
        discovered_count: 1,
        unavailable_page_keys: [],
        drift_page_keys: [],
        recovered_page_keys: [],
        registration_generation: '1'
      }
    })
    const syncToLatest = jest.fn(async (trigger?: string) => {
      calls.push(`sync:${trigger}`)
      return { status: 'completed' as const, localPublishVersion: 2 }
    })
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-capabilities-')), 'runtime.sqlite'),
      capabilityManifest: manifest,
      client: {
        registerPageCapabilities,
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      kitVersion: '0.2.0',
      pullIntervalMs: 0
    })

    await runtime.start()

    expect(registerPageCapabilities).toHaveBeenCalledWith(
      { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] },
      '0.2.0',
      expect.stringMatching(/^site-capabilities:/),
      '0'
    )
    expect(syncToLatest).toHaveBeenCalledWith('startup')
    expect(calls).toEqual(['register', 'sync:startup'])
    const firstIdempotencyKey = registerPageCapabilities.mock.calls[0]![2]
    await runtime.stop()
    await runtime.start()
    expect(registerPageCapabilities).toHaveBeenCalledTimes(2)
    expect(registerPageCapabilities.mock.calls[1]![2]).toBe(firstIdempotencyKey)
    await runtime.stop()
  })

  it('reuses registration idempotency only while the complete manifest is unchanged', async () => {
    const storePath = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-capability-recovery-')), 'runtime.sqlite')
    const homeManifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const emptyManifest = { pages: [] }
    const homeHash = hashSiteCapabilityManifest(homeManifest)
    const emptyHash = hashSiteCapabilityManifest(emptyManifest)

    const firstRegister = jest.fn(async () => ({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: homeHash,
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '1'
    }))
    const first = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: homeManifest,
      capabilityRegistrationIdFactory: () => 'registration-home-first',
      client: { registerPageCapabilities: firstRegister, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 })) },
      pullIntervalMs: 0
    })
    await first.start()
    await first.stop()

    const duplicateRegister = jest.fn(async () => {
      throw new SiteRuntimeError({ code: 'NETWORK_ERROR', message: 'registration unavailable' })
    })
    const duplicate = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: homeManifest,
      capabilityRegistrationIdFactory: () => 'must-not-be-used',
      client: { registerPageCapabilities: duplicateRegister, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 })) },
      pullIntervalMs: 0
    })
    await duplicate.start()
    expect(duplicate.capabilities.getLastRegistration()).toMatchObject({
      manifest_hash: homeHash,
      discovered_count: 1
    })
    await duplicate.stop()

    const disappearedRegister = jest.fn(async () => ({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: emptyHash,
      discovered_count: 0,
      unavailable_page_keys: ['HOME'],
      drift_page_keys: ['HOME'],
      recovered_page_keys: [],
      registration_generation: '2'
    }))
    const disappeared = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: emptyManifest,
      capabilityRegistrationIdFactory: () => 'registration-empty',
      client: { registerPageCapabilities: disappearedRegister, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 })) },
      pullIntervalMs: 0
    })
    await disappeared.start()
    expect(disappeared.capabilities.getLastRegistration()).toMatchObject({
      unavailable_page_keys: ['HOME'],
      drift_page_keys: ['HOME']
    })
    await disappeared.stop()

    const recoveredRegister = jest.fn(async () => ({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: homeHash,
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: ['HOME'],
      registration_generation: '3'
    }))
    const recovered = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: homeManifest,
      capabilityRegistrationIdFactory: () => 'registration-home-recovered',
      client: { registerPageCapabilities: recoveredRegister, getLatestPublishState: jest.fn() },
      sync: { syncToLatest: jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 0 })) },
      pullIntervalMs: 0
    })
    await recovered.start()

    expect(firstRegister).toHaveBeenCalledWith(homeManifest, '0.1.0', 'registration-home-first', '0')
    expect(duplicateRegister).toHaveBeenCalledWith(homeManifest, '0.1.0', 'registration-home-first', '0')
    expect(disappearedRegister).toHaveBeenCalledWith(emptyManifest, '0.1.0', 'registration-empty', '1')
    expect(recoveredRegister).toHaveBeenCalledWith(homeManifest, '0.1.0', 'registration-home-recovered', '2')
    expect(recovered.capabilities.getLastRegistration()).toMatchObject({ recovered_page_keys: ['HOME'] })
    await recovered.stop()
  })

  it('keeps the last committed publication readable when startup registration fails', async () => {
    const storePath = join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-capability-failure-')), 'runtime.sqlite')
    const seedStore = new NodeSqlitePublishedStore({ path: storePath })
    await seedStore.init()
    await seedStore.replaceSnapshot({
      siteId: 'brand-us',
      publishVersion: 3,
      resources: [
        {
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          slug: 'old-basin',
          locale: 'en-US',
          status: 'published',
          publishVersion: 3,
          payloadJson: JSON.stringify({ display_title: 'Old Basin' }),
          updatedAt: '2026-06-15T00:00:00.000Z'
        }
      ]
    })
    await seedStore.close()
    const syncToLatest = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 4 }))
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath,
      capabilityManifest: {
        pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }]
      },
      client: {
        registerPageCapabilities: jest.fn(async () => {
          throw new SiteRuntimeError({
            code: 'NETWORK_ERROR',
            message: 'registration unavailable'
          })
        }),
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      now: () => 1781488327000,
      pullIntervalMs: 0
    })

    await expect(runtime.start()).resolves.toBeUndefined()

    await expect(runtime.publicViews.products.getBySlug('old-basin', 'en-US')).resolves.toMatchObject({
      publishVersion: 3,
      payload: { display_title: 'Old Basin' }
    })
    await expect(runtime.getStatus()).resolves.toMatchObject({
      status: 'degraded',
      local_publish_version: 3,
      last_error_code: 'NETWORK_ERROR'
    })
    expect(syncToLatest).not.toHaveBeenCalled()

    const webhook = signedWebhook('capability_registration_pending_nonce')
    await expect(
      runtime.handleWebhook({
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        headers: webhook.headers,
        body: webhook.body
      })
    ).rejects.toMatchObject({ code: 'CAPABILITY_REGISTRATION_PENDING' })
    expect(syncToLatest).not.toHaveBeenCalled()
    await expect(runtime.getStatus()).resolves.toMatchObject({ status: 'degraded' })
    await runtime.stop()
  })

  it('creates a runtime from env, starts the SQLite store, and reports safe health', async () => {
    const runtime = await createSiteRuntimeFromEnv(
      {
        OES_SITE_CREDENTIAL: credential(),
        OES_SITE_STORE_PATH: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-env-')), 'runtime.sqlite'),
        OES_SITE_PULL_INTERVAL_MS: '0'
      },
      {
        client: {
          getLatestPublishState: jest.fn(async () => ({
            site_id: 'brand-us',
            latest_publish_version: 0,
            latest_sync_id: null,
            has_updates: false,
            server_time: '2026-06-15T00:00:00.000Z'
          }))
        }
      }
    )

    await runtime.start()
    await expect(runtime.health.ready()).resolves.toEqual({ ready: true, status: 'healthy' })
    await expect(runtime.getStatus()).resolves.toEqual(
      expect.not.objectContaining({
        clientSecret: expect.anything(),
        webhookSigningSecret: expect.anything()
      })
    )
    await runtime.stop()
  })

  it('verifies webhooks, records duplicate event ids as success, and avoids duplicate sync', async () => {
    const syncToLatest = jest.fn(async () => ({ status: 'completed' as const, localPublishVersion: 2 }))
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-webhook-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      now: () => 1781488327000
    })
    await runtime.start()
    syncToLatest.mockClear()

    const first = signedWebhook('nonce_1')
    await expect(
      runtime.handleWebhook({
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        headers: first.headers,
        body: first.body
      })
    ).resolves.toEqual({ accepted: true, duplicate: false, eventId: 'evt_1' })

    const second = signedWebhook('nonce_2')
    await expect(
      runtime.handleWebhook({
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        headers: second.headers,
        body: second.body
      })
    ).resolves.toEqual({ accepted: true, duplicate: true, eventId: 'evt_1' })

    expect(syncToLatest).toHaveBeenCalledTimes(1)
    await runtime.stop()
  })

  it('rejects invalid webhook signatures without triggering sync', async () => {
    const syncToLatest = jest.fn()
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-webhook-bad-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn()
      },
      sync: { syncToLatest },
      now: () => 1781488327000
    })
    await runtime.start()
    syncToLatest.mockClear()
    const webhook = signedWebhook('nonce_1')

    await expect(
      runtime.handleWebhook({
        method: 'POST',
        url: 'https://site.example.test/api/oes/webhook',
        headers: { ...webhook.headers, 'x-oes-signature': 'v1=bad' },
        body: webhook.body
      })
    ).rejects.toThrow(/SIGNATURE_INVALID/)
    expect(syncToLatest).not.toHaveBeenCalled()
    await runtime.stop()
  })

  it('fetches preview views through the signed client without writing published resources', async () => {
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-preview-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn(),
        getPreviewView: jest.fn(async () => ({
          preview_view: {
            site_id: 'brand-us',
            resource_type: 'product',
            resource_id: 'product_1',
            slug: 'draft-basin',
            locale: 'en-US',
            status: 'draft_preview',
            publish_version: 0,
            updated_at: '2026-06-15T00:00:00.000Z',
            payload: { display_title: 'Draft Basin' }
          },
          expires_at: '2026-06-15T00:15:00.000Z',
          noindex: true,
          cache_policy: 'no-store'
        }))
      }
    })
    await runtime.start()

    await expect(
      runtime.getPreviewView({
        preview_token: 'preview_token',
        resource_type: 'product',
        resource_id: 'product_1',
        locale: 'en-US'
      })
    ).resolves.toMatchObject({
      preview_view: {
        status: 'draft_preview',
        payload: { display_title: 'Draft Basin' }
      },
      noindex: true,
      cache_policy: 'no-store'
    })
    await expect(runtime.publicViews.products.getBySlug('draft-basin', 'en-US')).resolves.toBeNull()
    await runtime.stop()
  })

  it('moves runtime status to blocked when sync fails with site disabled', async () => {
    const runtime = await createSiteRuntime({
      credential: parseSiteCredential(credential()),
      storePath: join(mkdtempSync(join(tmpdir(), 'oes-site-runtime-blocked-')), 'runtime.sqlite'),
      client: {
        getLatestPublishState: jest.fn()
      },
      sync: {
        syncToLatest: jest.fn(async () => {
          throw new SiteRuntimeError({
            code: 'SITE_DISABLED',
            message: 'site disabled',
            httpStatus: 403
          })
        })
      }
    })
    await runtime.start()

    await expect(runtime.sync.syncToLatest('pull')).rejects.toMatchObject({
      runtimeStatus: 'blocked'
    })
    await expect(runtime.getStatus()).resolves.toMatchObject({
      status: 'blocked',
      last_sync_status: 'blocked',
      last_error_code: 'SITE_DISABLED'
    })
    await runtime.stop()
  })
})
