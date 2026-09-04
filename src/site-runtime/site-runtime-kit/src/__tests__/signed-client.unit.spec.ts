import { createHash } from 'node:crypto'

import {
  hashSiteCapabilityManifest,
  parseSiteCredential,
  signCanonicalRequest,
  SignedOesClient,
  SiteRuntimeError
} from '../../src'

function encodeCredential(payload: Record<string, unknown>): string {
  return `oes_site_cred_v1.${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`
}

// clientForPayload builds a signed client whose next response is the supplied contract payload.
function clientForPayload(
  payload: Record<string, unknown>,
  limits: { requestTimeoutMs?: number; maxResponseBytes?: number } = {}
): SignedOesClient {
  return new SignedOesClient({
    credential: parseSiteCredential(
      encodeCredential({
        site_id: 'brand-us',
        client_id: 'client_123',
        credential_id: 'cred_123',
        client_secret: 'client_secret',
        oes_base_url: 'https://oes.example.test/site-api',
        environment: 'local'
      })
    ),
    fetch: jest.fn(async () =>
      new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } })
    ),
    ...limits
  })
}

// exposurePayload supplies one valid Site Exposure Publication for strict client tests.
function exposurePayload(publishVersion = 3): Record<string, unknown> {
  return {
    siteId: 'brand-us',
    publishVersion,
    defaultLocale: 'en-US',
    activeLocales: ['en-US'],
    pages: [],
    publishedAt: '2026-06-15T00:00:00.000Z'
  }
}

// deltaPayload supplies one otherwise-valid changed-resource response for strict scalar tests.
function deltaPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    siteId: 'brand-us',
    fromPublishVersion: 3,
    toPublishVersion: 4,
    requiresSnapshot: false,
    changedResources: [],
    ...overrides
  }
}

// snapshotPayload supplies one otherwise-valid snapshot response for strict scalar tests.
function snapshotPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    siteId: 'brand-us',
    snapshotPublishVersion: 4,
    publicViews: [],
    nextPageToken: null,
    isComplete: true,
    exposurePublication: exposurePayload(4),
    ...overrides
  }
}

// latestPayload supplies one otherwise-valid latest-state response for strict scalar tests.
function latestPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    siteId: 'brand-us',
    latestPublishVersion: 4,
    latestSyncId: 'sync_4',
    hasUpdates: true,
    serverTime: '2026-06-15T00:00:00.000Z',
    ...overrides
  }
}

// registrationPayload supplies one otherwise-valid capability response for strict codec tests.
function registrationPayload(
  manifestHash: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    accepted: true,
    idempotentReplay: false,
    manifestHash,
    discoveredCount: 1,
    unavailablePageKeys: [],
    driftPageKeys: [],
    recoveredPageKeys: [],
    registrationGeneration: '1',
    ...overrides
  }
}

describe('SignedOesClient', () => {
  it.each([
    ['missing idempotentReplay', { idempotentReplay: undefined }],
    ['non-boolean idempotentReplay', { idempotentReplay: 'false' }],
    ['empty manifestHash', { manifestHash: '' }],
    ['mismatched manifestHash', { manifestHash: 'wrong-manifest-hash' }],
    ['non-number discoveredCount', { discoveredCount: '1' }],
    ['negative discoveredCount', { discoveredCount: -1 }],
    ['fractional discoveredCount', { discoveredCount: 1.5 }],
    ['unsafe discoveredCount', { discoveredCount: Number.MAX_SAFE_INTEGER + 1 }],
    ['missing unavailablePageKeys', { unavailablePageKeys: undefined }],
    ['non-array driftPageKeys', { driftPageKeys: {} }],
    ['malformed recoveredPageKeys member', { recoveredPageKeys: [123] }],
    ['duplicate unavailablePageKeys', { unavailablePageKeys: ['HOME', 'HOME'] }],
    ['invalid pageKey', { driftPageKeys: [' bad-page-key '] }],
    ['missing registrationGeneration', { registrationGeneration: undefined }],
    ['numeric registrationGeneration', { registrationGeneration: 1 }],
    ['negative registrationGeneration', { registrationGeneration: '-1' }],
    ['leading-zero registrationGeneration', { registrationGeneration: '01' }],
    ['overflow registrationGeneration', { registrationGeneration: '18446744073709551616' }],
    ['unknown field', { unexpected: true }]
  ])('rejects an accepted registration response with %s', async (_label, overrides) => {
    const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
    const manifestHash = hashSiteCapabilityManifest(manifest)

    await expect(
      clientForPayload(registrationPayload(manifestHash, overrides)).registerPageCapabilities(
        manifest,
        '0.2.0',
        'registration-1',
        '0'
      )
    ).rejects.toThrow(/capability registration response/i)
  })

  it.each(['0', '18446744073709551615'])(
    'accepts canonical uint64 registration generation %s',
    async (registrationGeneration) => {
      const manifest = { pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }] }
      const manifestHash = hashSiteCapabilityManifest(manifest)

      await expect(
        clientForPayload(
          registrationPayload(manifestHash, { registrationGeneration })
        ).registerPageCapabilities(manifest, '0.2.0', 'registration-boundary', '0')
      ).resolves.toMatchObject({ registration_generation: registrationGeneration })
    }
  )

  it('aborts a signed OES request when its configured deadline expires', async () => {
    let requestSignal: AbortSignal | null = null
    const fetchMock = jest.fn(async (_url: string, init?: RequestInit): Promise<Response> => {
      requestSignal = init?.signal ?? null
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
        setTimeout(() => reject(new Error('test guard: request was not aborted')), 100)
      })
    })
    const client = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: fetchMock,
      retry: { maxAttempts: 1 },
      requestTimeoutMs: 5
    })

    await expect(client.getLatestPublishState(3)).rejects.toMatchObject({
      code: 'REQUEST_TIMEOUT'
    })
    expect(requestSignal?.aborted).toBe(true)
  })

  it('rejects a response body that exceeds the configured byte limit before JSON parsing', async () => {
    await expect(
      clientForPayload(
        latestPayload({ padding: 'x'.repeat(512) }),
        { maxResponseBytes: 128 }
      ).getLatestPublishState(3)
    ).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' })
  })

  it.each([
    ['accepted false', { accepted: false, serverTime: '2026-06-15T00:00:00.000Z' }],
    ['accepted string', { accepted: 'true', serverTime: '2026-06-15T00:00:00.000Z' }],
    ['missing accepted', { serverTime: '2026-06-15T00:00:00.000Z' }],
    ['missing server time', { accepted: true }],
    ['invalid server time', { accepted: true, serverTime: 'not-a-time' }],
    [
      'unknown field',
      { accepted: true, serverTime: '2026-06-15T00:00:00.000Z', unexpected: true }
    ]
  ])('rejects a sync report response with %s', async (_label, response) => {
    await expect(
      clientForPayload(response).reportSyncResult({
        local_publish_version: 4,
        status: 'completed'
      })
    ).rejects.toThrow(/sync report response/i)
  })

  it.each([
    ['string true', 'true'],
    ['missing', undefined],
    ['numeric zero', 0]
  ])('rejects %s delta requires_snapshot', async (_label, requiresSnapshot) => {
    await expect(
      clientForPayload(deltaPayload({ requiresSnapshot })).listChangedResources({
        from_publish_version: 3,
        to_publish_version: 4
      })
    ).rejects.toThrow(/requires_snapshot.*(boolean|required)/i)
  })

  it.each([
    ['numeric string', '4'],
    ['missing', undefined],
    ['negative', -1],
    ['fractional', 4.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1]
  ])('rejects %s delta to_publish_version', async (_label, toPublishVersion) => {
    await expect(
      clientForPayload(deltaPayload({ toPublishVersion })).listChangedResources({
        from_publish_version: 3,
        to_publish_version: 4
      })
    ).rejects.toThrow(/to_publish_version.*(non-negative integer|required)/i)
  })

  it.each([
    ['numeric string', '3'],
    ['missing', undefined],
    ['negative', -1],
    ['fractional', 3.5],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1]
  ])('rejects %s delta from_publish_version', async (_label, fromPublishVersion) => {
    await expect(
      clientForPayload(deltaPayload({ fromPublishVersion })).listChangedResources({
        from_publish_version: 3,
        to_publish_version: 4
      })
    ).rejects.toThrow(/from_publish_version.*(non-negative integer|required)/i)
  })

  it.each([
    ['numeric string', '4'],
    ['missing', undefined],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1]
  ])('rejects %s batch server_publish_version', async (_label, serverPublishVersion) => {
    await expect(
      clientForPayload({
        publicViews: [],
        missingResources: [],
        serverPublishVersion,
        exposurePublication: exposurePayload(4)
      }).batchGetPublicViews([], 4)
    ).rejects.toThrow(/server_publish_version.*(non-negative integer|required)/i)
  })

  it.each([
    ['numeric string', '4'],
    ['missing', undefined],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1]
  ])('rejects %s snapshot_publish_version', async (_label, snapshotPublishVersion) => {
    await expect(
      clientForPayload(snapshotPayload({ snapshotPublishVersion })).getSnapshot()
    ).rejects.toThrow(/snapshot_publish_version.*(non-negative integer|required)/i)
  })

  it.each([
    ['string true', 'true'],
    ['missing', undefined]
  ])('rejects %s snapshot is_complete', async (_label, isComplete) => {
    await expect(
      clientForPayload(snapshotPayload({ isComplete })).getSnapshot()
    ).rejects.toThrow(/is_complete.*(boolean|required)/i)
  })

  it.each([
    ['numeric string', '4'],
    ['missing', undefined],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1]
  ])('rejects %s latest_publish_version', async (_label, latestPublishVersion) => {
    await expect(
      clientForPayload(latestPayload({ latestPublishVersion })).getLatestPublishState(3)
    ).rejects.toThrow(/latest_publish_version.*(non-negative integer|required)/i)
  })

  it.each([
    ['string true', 'true'],
    ['missing', undefined],
    ['numeric zero', 0]
  ])('rejects %s latest has_updates', async (_label, hasUpdates) => {
    await expect(
      clientForPayload(latestPayload({ hasUpdates })).getLatestPublishState(3)
    ).rejects.toThrow(/has_updates.*(boolean|required)/i)
  })

  it.each([
    ['missing', undefined],
    ['numeric', 123],
    ['empty', '']
  ])('rejects %s latest site_id', async (_label, siteId) => {
    await expect(
      clientForPayload(latestPayload({ siteId })).getLatestPublishState(3)
    ).rejects.toThrow(/site_id.*(non-empty string|required)/i)
  })

  it.each([
    ['numeric', 123],
    ['empty', ''],
    ['whitespace', ' sync_4 ']
  ])('rejects invalid optional latest_sync_id: %s', async (_label, latestSyncId) => {
    await expect(
      clientForPayload(latestPayload({ latestSyncId })).getLatestPublishState(3)
    ).rejects.toThrow(/latest_sync_id.*string/i)
  })

  it('rejects an invalid delta site_id', async () => {
    await expect(
      clientForPayload(deltaPayload({ siteId: 123 })).listChangedResources({
        from_publish_version: 3,
        to_publish_version: 4
      })
    ).rejects.toThrow(/site_id.*non-empty string/i)
  })

  it('rejects an invalid snapshot site_id', async () => {
    await expect(
      clientForPayload(snapshotPayload({ siteId: 123 })).getSnapshot()
    ).rejects.toThrow(/site_id.*non-empty string/i)
  })

  it('rejects a whitespace snapshot next_page_token', async () => {
    await expect(
      clientForPayload(snapshotPayload({ nextPageToken: ' next ' })).getSnapshot()
    ).rejects.toThrow(/next_page_token.*string/i)
  })

  it.each([
    ['missing', undefined],
    ['non-array', { resource: 'not-an-array' }]
  ])('rejects %s snapshot public_views instead of normalizing it to an empty snapshot', async (_label, publicViews) => {
    const payload: Record<string, unknown> = {
      siteId: 'brand-us',
      snapshotPublishVersion: 3,
      nextPageToken: '',
      isComplete: true,
      exposurePublication: exposurePayload(3)
    }
    if (publicViews !== undefined) {
      payload.publicViews = publicViews
    }

    await expect(clientForPayload(payload).getSnapshot()).rejects.toThrow(/public_views.*array/i)
  })

  it('rejects malformed snapshot public_views members', async () => {
    const client = clientForPayload({
      siteId: 'brand-us',
      snapshotPublishVersion: 3,
      publicViews: [{}],
      nextPageToken: '',
      isComplete: true,
      exposurePublication: exposurePayload(3)
    })

    await expect(client.getSnapshot()).rejects.toThrow(/public view/i)
  })

  it('rejects malformed changed_resources members', async () => {
    const client = clientForPayload({
      siteId: 'brand-us',
      fromPublishVersion: 2,
      toPublishVersion: 3,
      requiresSnapshot: false,
      changedResources: [{}]
    })

    await expect(
      client.listChangedResources({ from_publish_version: 2, to_publish_version: 3 })
    ).rejects.toThrow(/changed_resources.*member/i)
  })

  it.each([
    ['public_views', { publicViews: {}, missingResources: [] }],
    ['missing_resources', { publicViews: [], missingResources: {} }],
    ['missing public_views', { missingResources: [] }],
    ['missing missing_resources', { publicViews: [] }],
    ['public_views member', { publicViews: [{}], missingResources: [] }],
    ['missing_resources member', { publicViews: [], missingResources: [{}] }]
  ])('rejects malformed batch %s required arrays', async (_label, arrays) => {
    const client = clientForPayload({
      ...arrays,
      serverPublishVersion: 3,
      exposurePublication: exposurePayload(3)
    })

    await expect(
      client.batchGetPublicViews([
        { resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }
      ], 3)
    ).rejects.toThrow(/public[ _]view|missing_resources/i)
  })

  it('registers a complete capability manifest with a deterministic idempotency key', async () => {
    const requestBodies: string[] = []
    const manifest = {
      pages: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }]
    }
    const manifestHash = hashSiteCapabilityManifest(manifest)
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://oes.example.test/site-api/capabilities/pages:register')
      requestBodies.push(String(init?.body ?? ''))
      return new Response(
        JSON.stringify({
          accepted: true,
          idempotentReplay: requestBodies.length > 1,
          manifestHash,
          discoveredCount: 1,
          unavailablePageKeys: requestBodies.length > 1 ? ['OLD_PAGE'] : [],
          driftPageKeys: requestBodies.length > 1 ? ['OLD_PAGE'] : [],
          recoveredPageKeys: [],
          registrationGeneration: '8'
        }),
        { headers: { 'content-type': 'application/json' } }
      )
    })
    const client = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: fetchMock
    })
    await expect(client.registerPageCapabilities(manifest, '0.2.0', 'deployment-1', '7')).resolves.toEqual({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: manifestHash,
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '8'
    })
    await expect(client.registerPageCapabilities(manifest, '0.2.0', 'deployment-1', '7')).resolves.toMatchObject({
      idempotent_replay: true,
      unavailable_page_keys: ['OLD_PAGE'],
      drift_page_keys: ['OLD_PAGE']
    })

    expect(JSON.parse(requestBodies[0]!)).toEqual({
      idempotency_key: 'deployment-1',
      capabilities: [{ page_key: 'HOME', supported_locales: ['en-US'] }],
      runtime_version: '0.2.0',
      expected_registration_generation: '7'
    })
    expect(JSON.parse(requestBodies[1]!).idempotency_key).toBe(
      JSON.parse(requestBodies[0]!).idempotency_key
    )
  })

  it('sends frozen signed headers for Site-facing API calls', async () => {
    const baseUrl = 'https://oes.example.test/site-api'
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      const body = String(init?.body ?? '')
      expect(init?.method).toBe('POST')
      expect(url).toBe('https://oes.example.test/site-api/sync/latest')
      expect(headers.get('x-oes-site-id')).toBe('brand-us')
      expect(headers.get('x-oes-client-id')).toBe('client_123')
      expect(headers.get('x-oes-credential-id')).toBe('cred_123')
      expect(headers.get('x-oes-request-id')).toBe('request_1')
      expect(headers.get('x-oes-trace-id')).toBe('trace_1')
      const bodyHash = createHash('sha256').update(body).digest('hex')
      const canonical = [
        init?.method ?? 'POST',
        '/site-api/sync/latest',
        '',
        bodyHash,
        'x-oes-site-id:brand-us',
        'x-oes-client-id:client_123',
        'x-oes-credential-id:cred_123',
        `x-oes-timestamp:${String(headers.get('x-oes-timestamp'))}`,
        `x-oes-nonce:${String(headers.get('x-oes-nonce'))}`
      ].join('\n')
      expect(headers.get('x-oes-signature')).toBe(signCanonicalRequest(canonical, 'client_secret'))
      return new Response(
          JSON.stringify({
            site_id: 'brand-us',
            latest_publish_version: 3,
            latest_sync_id: 'sync_3',
            has_updates: true,
            server_time: '2026-06-15T00:00:00.000Z'
          }),
          { headers: { 'content-type': 'application/json' } }
        )
    })
    const credential = parseSiteCredential(
      encodeCredential({
        site_id: 'brand-us',
        client_id: 'client_123',
        credential_id: 'cred_123',
        client_secret: 'client_secret',
        oes_base_url: baseUrl,
        environment: 'local'
      })
    )
    const client = new SignedOesClient({
      credential,
      fetch: fetchMock,
      requestIdFactory: () => 'request_1',
      traceIdFactory: () => 'trace_1',
      nonceFactory: () => 'nonce_1',
      now: () => 1781488327000
    })

    await expect(client.getLatestPublishState(1)).resolves.toEqual({
      site_id: 'brand-us',
      latest_publish_version: 3,
      latest_sync_id: 'sync_3',
      has_updates: true,
      server_time: '2026-06-15T00:00:00.000Z'
    })
  })

  it('normalizes api-gateway response envelopes and generated camelCase DTO fields', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          code: 0,
          data: {
            siteId: 'brand-us',
            latestPublishVersion: 4,
            latestSyncId: 'sync_4',
            hasUpdates: true,
            serverTime: '2026-06-15T01:00:00.000Z'
          },
          meta: {}
        }),
        { headers: { 'content-type': 'application/json' } }
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({
          code: 0,
          data: {
            publicViews: [
              {
                siteId: 'brand-us',
                resourceType: 'product',
                resourceId: 'product_1',
                locale: 'en-US',
                slug: 'basin',
                status: 'published',
                publishVersion: 4,
                updatedAt: '2026-06-15T01:00:00.000Z',
                payloadJson: '{"display_title":"Basin"}'
              }
            ],
            missingResources: [],
            serverPublishVersion: 4,
            exposurePublication: {
              siteId: 'brand-us',
              publishVersion: 4,
              defaultLocale: 'en-US',
              activeLocales: ['en-US'],
              pages: [
                {
                  pageKey: 'PRODUCT_DETAIL',
                  enabled: true,
                  indexable: true,
                  supportedLocales: ['en-US']
                }
              ],
              publishedAt: '2026-06-15T01:00:00.000Z'
            }
          },
          meta: {}
        }),
        { headers: { 'content-type': 'application/json' } }
      ))
    const client = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: fetchMock
    })

    await expect(client.getLatestPublishState(3)).resolves.toEqual({
      site_id: 'brand-us',
      latest_publish_version: 4,
      latest_sync_id: 'sync_4',
      has_updates: true,
      server_time: '2026-06-15T01:00:00.000Z'
    })
    await expect(
      client.batchGetPublicViews([{ resource_type: 'product', resource_id: 'product_1', locale: 'en-US' }], 4)
    ).resolves.toEqual({
      public_views: [
        expect.objectContaining({
          siteId: 'brand-us',
          resourceType: 'product',
          resourceId: 'product_1',
          payload: { display_title: 'Basin' }
        })
      ],
      missing_resources: [],
      server_publish_version: 4,
      exposure_publication: {
        siteId: 'brand-us',
        publishVersion: 4,
        defaultLocale: 'en-US',
        activeLocales: ['en-US'],
        pages: [
          {
            pageKey: 'PRODUCT_DETAIL',
            enabled: true,
            indexable: true,
            supportedLocales: ['en-US']
          }
        ],
        publishedAt: '2026-06-15T01:00:00.000Z'
      }
    })
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      target_publish_version: 4
    })
  })

  it('retries temporary failures but never retries blocked authentication failures', async () => {
    let attempts = 0
    const retryFetch = jest.fn(async () => {
        attempts += 1
        if (attempts < 3) {
        return new Response(JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'temporary' } }), {
          status: 503,
          headers: { 'content-type': 'application/json' }
        })
        }
      return new Response(
          JSON.stringify({
            site_id: 'brand-us',
            latest_publish_version: 1,
            latest_sync_id: 'sync_1',
            has_updates: false,
            server_time: '2026-06-15T00:00:00.000Z'
          }),
        { headers: { 'content-type': 'application/json' } }
        )
    })
    const client = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: retryFetch,
      retry: { maxAttempts: 3, baseDelayMs: 0 }
    })

    await client.getLatestPublishState(0)
    expect(attempts).toBe(3)

    let blockedAttempts = 0
    const blockedFetch = jest.fn(async () => {
      blockedAttempts += 1
      return new Response(
        JSON.stringify({
          error: { code: 'SITE_DISABLED', message: 'site disabled' },
          request_id: 'request_1',
          trace_id: 'trace_1'
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      )
    })
    const blockedClient = new SignedOesClient({
      credential: parseSiteCredential(
        encodeCredential({
          site_id: 'brand-us',
          client_id: 'client_123',
          credential_id: 'cred_123',
          client_secret: 'client_secret',
          oes_base_url: 'https://oes.example.test/site-api',
          environment: 'local'
        })
      ),
      fetch: blockedFetch,
      retry: { maxAttempts: 3, baseDelayMs: 0 }
    })

    await expect(blockedClient.getLatestPublishState(0)).rejects.toMatchObject({
      code: 'SITE_DISABLED',
      runtimeStatus: 'blocked'
    } satisfies Partial<SiteRuntimeError>)
    expect(blockedAttempts).toBe(1)
  })
})
