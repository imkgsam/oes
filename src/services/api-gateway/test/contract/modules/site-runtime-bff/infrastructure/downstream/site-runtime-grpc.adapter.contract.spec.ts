import { createHash } from 'node:crypto'
import { status } from '@grpc/grpc-js'
import { loadSync, MessageTypeDefinition } from '@grpc/proto-loader'
import { ArgumentsHost, BadRequestException } from '@nestjs/common'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { RpcException } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { RpcExceptionPayload } from '@oes/common/exceptions'
import { GRPC_MODULE_OPTIONS, GrpcTransportModule } from '@oes/common/transport'
import { of, throwError } from 'rxjs'
import * as appModule from '../../../../../../src/app.module'
import { GatewayExceptionFilter } from '../../../../../../src/common/filters/gateway-exception.filter'
import { SiteRuntimeGrpcAdapter } from '../../../../../../src/modules/site-runtime-bff/infrastructure/downstream/site-runtime-grpc.adapter'

const MAX_UINT64 = '18446744073709551615'
const MANIFEST_HASH = 'a'.repeat(64)

// Verifies the Site-facing downstream adapter preserves signed request material for site-service verification.
describe('SiteRuntimeGrpcAdapter', () => {
  const runtimeService = {
    registerPageCapabilities: jest.fn(),
    getLatestPublishState: jest.fn(),
    listChangedResources: jest.fn(),
    batchGetPublicViews: jest.fn(),
    getSnapshot: jest.fn(),
    reportSyncResult: jest.fn(),
    getPreviewView: jest.fn()
  }
  const client = {
    getService: jest.fn().mockReturnValue(runtimeService)
  }
  const metadata = { metadata: 'internal' }
  const machineExecution = {
    forInternalCall: jest.fn((_audience: string, _code: string, _trace: unknown, callback: (value: unknown) => unknown) =>
      callback(metadata)
    )
  }
  const adapter = new SiteRuntimeGrpcAdapter(client as never, machineExecution as never)
  const rawBody = Buffer.from('{"site_id":"malicious_body_site","local_publish_version":7}')
  const signedRequest = {
    method: 'POST',
    path: '/api/v1/site/sync/latest',
    normalizedQuery: '',
    signedHeaders: {
      'x-oes-site-id': 'site_header',
      'x-oes-client-id': 'client_a',
      'x-oes-credential-id': 'cred_a',
      'x-oes-timestamp': '1781481600000',
      'x-oes-nonce': 'nonce_a',
      'x-oes-signature': 'v1=abc',
      'x-oes-request-id': 'request_runtime',
      'x-oes-trace-id': 'trace_runtime',
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
    },
    body: { site_id: 'malicious_body_site', local_publish_version: 7 },
    rawBody
  }

  /** registrationBody builds one fully valid strict-codec body before a test replaces one boundary value. */
  function registrationBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      idempotency_key: 'deployment-1',
      expected_registration_generation: '0',
      capabilities: [{ page_key: 'HOME', supported_locales: ['en-US'] }],
      runtime_version: '1.0.0',
      ...overrides
    }
  }

  /** registrationRequest preserves the exact body bytes used by the signed downstream context. */
  function registrationRequest(body: Record<string, unknown>) {
    return {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      body,
      rawBody: Buffer.from(JSON.stringify(body))
    }
  }

  /** registrationResponse mirrors all required proto response fields for strict response-codec tests. */
  function registrationResponse(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      accepted: true,
      idempotentReplay: false,
      manifestHash: MANIFEST_HASH,
      discoveredCount: 1,
      unavailablePageKeys: [],
      driftPageKeys: [],
      recoveredPageKeys: [],
      registrationGeneration: '1',
      ...overrides
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    adapter.onModuleInit()
  })

  it('uses the machine producer with the frozen audience and exact internal codes', async () => {
    runtimeService.registerPageCapabilities.mockReturnValue(of(registrationResponse()))
    runtimeService.getLatestPublishState.mockReturnValue(of({}))
    runtimeService.reportSyncResult.mockReturnValue(of({}))
    runtimeService.getPreviewView.mockReturnValue(of({}))

    await adapter.registerPageCapabilities(registrationRequest(registrationBody()))
    await adapter.getLatestPublishState(signedRequest)
    await adapter.reportSyncResult({
      ...signedRequest,
      path: '/api/v1/site/sync/report',
      body: {},
      rawBody: Buffer.from('{}')
    })
    await adapter.getPreviewView({
      ...signedRequest,
      path: '/api/v1/site/preview',
      body: {},
      rawBody: Buffer.from('{}')
    })

    expect(machineExecution.forInternalCall).toHaveBeenNthCalledWith(
      1,
      'urn:oes:service:site-service',
      'site.internal.runtime.capability.register',
      expect.objectContaining({ requestId: 'request_runtime', traceparent: expect.any(String) }),
      expect.any(Function)
    )
    expect(machineExecution.forInternalCall).toHaveBeenNthCalledWith(
      2,
      'urn:oes:service:site-service',
      'site.internal.runtime.publication.read',
      expect.objectContaining({ requestId: 'request_runtime', traceparent: expect.any(String) }),
      expect.any(Function)
    )
    expect(machineExecution.forInternalCall).toHaveBeenNthCalledWith(
      3,
      'urn:oes:service:site-service',
      'site.internal.runtime.sync.report',
      expect.objectContaining({ requestId: 'request_runtime', traceparent: expect.any(String) }),
      expect.any(Function)
    )
    expect(machineExecution.forInternalCall).toHaveBeenNthCalledWith(
      4,
      'urn:oes:service:site-service',
      'site.internal.runtime.preview.read',
      expect.objectContaining({ requestId: 'request_runtime', traceparent: expect.any(String) }),
      expect.any(Function)
    )
    expect(runtimeService.registerPageCapabilities.mock.calls[0][0]).toEqual(
      expect.objectContaining({ signedContext: expect.any(Object) })
    )
  })

  it('maps latest-state requests without trusting body site_id', async () => {
    runtimeService.getLatestPublishState.mockReturnValue(of({ siteId: 'site_header' }))

    await adapter.getLatestPublishState(signedRequest)

    expect(runtimeService.getLatestPublishState).toHaveBeenCalledWith(
      {
        signedContext: {
          siteId: 'site_header',
          clientId: 'client_a',
          credentialId: 'cred_a',
          requestId: 'request_runtime',
          traceId: 'trace_runtime',
          timestamp: '1781481600000',
          nonce: 'nonce_a',
          signature: 'v1=abc',
          method: 'POST',
          path: '/api/v1/site/sync/latest',
          normalizedQuery: '',
          bodySha256: createHash('sha256').update(rawBody).digest('hex')
        },
        localPublishVersion: 7
      },
      metadata
    )
  })

  it('maps signed capability registration with idempotency and supported locales only', async () => {
    const body = {
      idempotency_key: 'deployment-1',
      expected_registration_generation: '41',
      capabilities: [{ page_key: 'PRODUCT_DETAIL', supported_locales: ['en-US', 'zh-CN'] }],
      runtime_version: '1.0.0'
    }
    const request = {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      signedHeaders: { ...signedRequest.signedHeaders, 'x-oes-idempotency-key': 'deployment-1' },
      body,
      rawBody: Buffer.from(JSON.stringify(body))
    }
    runtimeService.registerPageCapabilities.mockReturnValue(
      of(registrationResponse({ registrationGeneration: '42' }))
    )

    await expect((adapter as any).registerPageCapabilities(request)).resolves.toEqual({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: MANIFEST_HASH,
      discovered_count: 1,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: '42'
    })

    expect(runtimeService.registerPageCapabilities).toHaveBeenCalledWith(
      {
        signedContext: expect.objectContaining({
          siteId: 'site_header',
          idempotencyKey: 'deployment-1',
          path: '/api/v1/site/capabilities/pages:register',
          bodySha256: createHash('sha256').update(request.rawBody).digest('hex')
        }),
        idempotencyKey: 'deployment-1',
        expectedRegistrationGeneration: '41',
        capabilities: [{ pageKey: 'PRODUCT_DETAIL', supportedLocales: ['en-US', 'zh-CN'] }],
        runtimeVersion: '1.0.0'
      },
      metadata
    )
  })

  it.each(['0', MAX_UINT64])(
    'preserves canonical expected registration generation %s through the gRPC request',
    async (expectedRegistrationGeneration) => {
      const body = {
        idempotency_key: 'deployment-boundary',
        expected_registration_generation: expectedRegistrationGeneration,
        capabilities: [],
        runtime_version: '1.0.0'
      }
      const request = {
        ...signedRequest,
        path: '/api/v1/site/capabilities/pages:register',
        body,
        rawBody: Buffer.from(JSON.stringify(body))
      }
      runtimeService.registerPageCapabilities.mockReturnValue(
        of(registrationResponse({ registrationGeneration: expectedRegistrationGeneration }))
      )

      await adapter.registerPageCapabilities(request)

      expect(runtimeService.registerPageCapabilities).toHaveBeenCalledWith(
        expect.objectContaining({ expectedRegistrationGeneration }),
        metadata
      )
    }
  )

  it.each([
    ['trimmed', ' 1'],
    ['trailing whitespace', '1 '],
    ['number', 1],
    ['leading zero', '01'],
    ['negative', '-1'],
    ['overflow', '18446744073709551616'],
    ['empty', ''],
    ['fraction', '1.0'],
    ['object', { low: 1, high: 0, unsigned: true }],
    ['null', null],
    ['missing', undefined]
  ])('rejects %s expected registration generation at the HTTP boundary', async (_case, value) => {
    const body = {
      idempotency_key: 'deployment-invalid',
      expected_registration_generation: value,
      capabilities: [],
      runtime_version: '1.0.0'
    }
    const request = {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      body,
      rawBody: Buffer.from(JSON.stringify(body))
    }

    await expect(adapter.registerPageCapabilities(request)).rejects.toThrow(
      'expected_registration_generation must be a canonical uint64 decimal string'
    )
    expect(runtimeService.registerPageCapabilities).not.toHaveBeenCalled()
  })

  it.each([
    ['missing capabilities', () => registrationBody({ capabilities: undefined })],
    ['string capabilities', () => registrationBody({ capabilities: 'HOME' })],
    ['sparse capabilities', () => registrationBody({ capabilities: Array(1) })],
    ['non-plain capability', () => registrationBody({ capabilities: [new Date()] })],
    ['unknown body field', () => registrationBody({ unexpected: true })],
    [
      'unknown capability field',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', supported_locales: ['en-US'], route: '/' }]
        })
    ],
    [
      'mixed pageKey aliases',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', pageKey: 'HOME', supported_locales: ['en-US'] }]
        })
    ],
    [
      'mixed supportedLocales aliases',
      () =>
        registrationBody({
          capabilities: [
            {
              page_key: 'HOME',
              supported_locales: ['en-US'],
              supportedLocales: ['en-US']
            }
          ]
        })
    ],
    ['mixed idempotency aliases', () => registrationBody({ idempotencyKey: 'deployment-1' })],
    [
      'mixed expected generation aliases',
      () => registrationBody({ expectedRegistrationGeneration: '0' })
    ],
    ['mixed runtimeVersion aliases', () => registrationBody({ runtimeVersion: '1.0.0' })],
    [
      'non-string pageKey',
      () => registrationBody({ capabilities: [{ page_key: 1, supported_locales: ['en-US'] }] })
    ],
    [
      'whitespace pageKey',
      () =>
        registrationBody({
          capabilities: [{ page_key: ' HOME', supported_locales: ['en-US'] }]
        })
    ],
    [
      'empty pageKey',
      () => registrationBody({ capabilities: [{ page_key: '', supported_locales: ['en-US'] }] })
    ],
    [
      'pageKey outside Runtime pattern',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'PRODUCT DETAIL', supported_locales: ['en-US'] }]
        })
    ],
    [
      'empty supportedLocales',
      () => registrationBody({ capabilities: [{ page_key: 'HOME', supported_locales: [] }] })
    ],
    [
      'non-array supportedLocales',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', supported_locales: 'en-US' }]
        })
    ],
    [
      'sparse supportedLocales',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', supported_locales: Array(1) }]
        })
    ],
    [
      'non-string locale',
      () => registrationBody({ capabilities: [{ page_key: 'HOME', supported_locales: [1] }] })
    ],
    [
      'whitespace locale',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', supported_locales: [' en-US'] }]
        })
    ],
    [
      'empty locale',
      () => registrationBody({ capabilities: [{ page_key: 'HOME', supported_locales: [''] }] })
    ],
    [
      'invalid BCP47 locale',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', supported_locales: ['en_US'] }]
        })
    ],
    [
      'duplicate canonical locale',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', supported_locales: ['en-US', 'en-us'] }]
        })
    ],
    [
      'duplicate pageKey',
      () =>
        registrationBody({
          capabilities: [
            { page_key: 'HOME', supported_locales: ['en-US'] },
            { page_key: 'HOME', supported_locales: ['zh-CN'] }
          ]
        })
    ],
    ['empty idempotency', () => registrationBody({ idempotency_key: '' })],
    ['trimmed idempotency', () => registrationBody({ idempotency_key: ' deployment-1' })],
    ['non-string idempotency', () => registrationBody({ idempotency_key: 1 })],
    ['empty runtimeVersion', () => registrationBody({ runtime_version: '' })],
    ['trimmed runtimeVersion', () => registrationBody({ runtime_version: '1.0.0 ' })],
    ['non-string runtimeVersion', () => registrationBody({ runtime_version: 1 })],
    [
      'pageKey over limit',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'P'.repeat(129), supported_locales: ['en-US'] }]
        })
    ],
    [
      'locale over limit',
      () =>
        registrationBody({
          capabilities: [{ page_key: 'HOME', supported_locales: [`en-${'a'.repeat(30)}`] }]
        })
    ],
    ['idempotency over limit', () => registrationBody({ idempotency_key: 'i'.repeat(256) })],
    ['runtimeVersion over limit', () => registrationBody({ runtime_version: 'v'.repeat(129) })],
    [
      'manifest page count over limit',
      () =>
        registrationBody({
          capabilities: Array.from({ length: 257 }, (_, index) => ({
            page_key: `PAGE_${index}`,
            supported_locales: ['en-US']
          }))
        })
    ],
    [
      'page locale count over limit',
      () =>
        registrationBody({
          capabilities: [
            {
              page_key: 'HOME',
              supported_locales: Array.from({ length: 33 }, (_, index) => `x-${index}`)
            }
          ]
        })
    ]
  ])('rejects malformed registration input: %s', async (_case, makeBody) => {
    const request = registrationRequest(makeBody())
    let error: unknown
    try {
      await adapter.registerPageCapabilities(request)
    } catch (caught) {
      error = caught
    }

    expect(error).toBeInstanceOf(BadRequestException)
    expect((error as BadRequestException).getStatus()).toBe(400)
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: 'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED'
    })
    expect(runtimeService.registerPageCapabilities).not.toHaveBeenCalled()
  })

  it('preserves original valid locale bytes without trimming or canonical rewriting', async () => {
    const body = registrationBody({
      capabilities: [{ page_key: 'HOME', supported_locales: ['en-us'] }]
    })
    runtimeService.registerPageCapabilities.mockReturnValue(of(registrationResponse()))

    await adapter.registerPageCapabilities(registrationRequest(body))

    expect(runtimeService.registerPageCapabilities).toHaveBeenCalledWith(
      expect.objectContaining({
        capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-us'] }]
      }),
      metadata
    )
  })

  it.each(['0', MAX_UINT64])(
    'preserves registration generation %s and empty repeated fields through the configured SITE client',
    async (registrationGeneration) => {
      const moduleImports = Reflect.getMetadata(
        MODULE_METADATA.IMPORTS,
        appModule.AppModule
      ) as Array<{
        module?: unknown
        global?: boolean
        providers?: Array<{ provide?: unknown; useValue?: unknown } | unknown>
      }>
      const grpcRoot = moduleImports.find(
        (moduleImport) =>
          moduleImport.module === GrpcTransportModule && moduleImport.global === true
      )
      const optionsProvider = grpcRoot?.providers?.find(
        (provider): provider is { provide: unknown; useValue: unknown } =>
          !!provider &&
          typeof provider === 'object' &&
          'provide' in provider &&
          provider.provide === GRPC_MODULE_OPTIONS
      )
      const grpcOptions = optionsProvider?.useValue as {
        services: Record<
          string,
          { protoPath: string | string[]; loader?: Parameters<typeof loadSync>[1] }
        >
      }
      const siteConfig = grpcOptions.services[SERVICE_NAMES.SITE]
      const definition = loadSync(siteConfig.protoPath, siteConfig.loader)
      const responseCodec = definition[
        'site_service.RegisterPageCapabilitiesResponse'
      ] as MessageTypeDefinition<Record<string, unknown>, Record<string, unknown>>

      const decoded = responseCodec.deserialize(
        responseCodec.serialize({
          accepted: true,
          idempotentReplay: false,
          manifestHash: MANIFEST_HASH,
          discoveredCount: 0,
          unavailablePageKeys: [],
          driftPageKeys: [],
          recoveredPageKeys: [],
          registrationGeneration
        })
      ) as Record<string, unknown>

      expect(decoded.registrationGeneration).toBe(registrationGeneration)
      expect(typeof decoded.registrationGeneration).toBe('string')
      expect(decoded).toEqual(
        expect.objectContaining({
          unavailablePageKeys: [],
          driftPageKeys: [],
          recoveredPageKeys: []
        })
      )
      expect(
        Object.entries(grpcOptions.services)
          .filter(([serviceName]) => serviceName !== SERVICE_NAMES.SITE)
          .some(
            ([, config]) =>
              config.loader?.longs !== undefined || config.loader?.arrays !== undefined
          )
      ).toBe(false)

      const body = {
        idempotency_key: 'deployment-configured-loader',
        expected_registration_generation: registrationGeneration,
        capabilities: [],
        runtime_version: '1.0.0'
      }
      const request = {
        ...signedRequest,
        path: '/api/v1/site/capabilities/pages:register',
        body,
        rawBody: Buffer.from(JSON.stringify(body))
      }
      runtimeService.registerPageCapabilities.mockReturnValue(of(decoded))

      await expect(adapter.registerPageCapabilities(request)).resolves.toEqual(
        expect.objectContaining({
          unavailable_page_keys: [],
          drift_page_keys: [],
          recovered_page_keys: [],
          registration_generation: registrationGeneration
        })
      )
    }
  )

  it('maps a real proto-loader Long response to a canonical max uint64 HTTP value', async () => {
    const definition = loadSync(resolveCommonProtoPath('site_service/site.proto'))
    const responseCodec = definition[
      'site_service.RegisterPageCapabilitiesResponse'
    ] as MessageTypeDefinition<Record<string, unknown>, Record<string, unknown>>
    const decoded = responseCodec.deserialize(
      responseCodec.serialize({
        accepted: true,
        idempotentReplay: false,
        manifestHash: MANIFEST_HASH,
        discoveredCount: 0,
        unavailablePageKeys: [],
        driftPageKeys: [],
        recoveredPageKeys: [],
        registrationGeneration: MAX_UINT64
      })
    ) as Record<string, unknown>
    const body = {
      idempotency_key: 'deployment-max',
      expected_registration_generation: MAX_UINT64,
      capabilities: [],
      runtime_version: '1.0.0'
    }
    const request = {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      body,
      rawBody: Buffer.from(JSON.stringify(body))
    }
    runtimeService.registerPageCapabilities.mockReturnValue(of(decoded))

    await expect(adapter.registerPageCapabilities(request)).resolves.toEqual({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: MANIFEST_HASH,
      discovered_count: 0,
      unavailable_page_keys: [],
      drift_page_keys: [],
      recovered_page_keys: [],
      registration_generation: MAX_UINT64
    })
  })

  it('preserves non-empty repeated registration fields under their snake_case HTTP names', async () => {
    const definition = loadSync(resolveCommonProtoPath('site_service/site.proto'), {
      longs: String,
      arrays: true
    })
    const responseCodec = definition[
      'site_service.RegisterPageCapabilitiesResponse'
    ] as MessageTypeDefinition<Record<string, unknown>, Record<string, unknown>>
    const decoded = responseCodec.deserialize(
      responseCodec.serialize({
        accepted: true,
        idempotentReplay: false,
        manifestHash: MANIFEST_HASH,
        discoveredCount: 3,
        unavailablePageKeys: ['CHECKOUT'],
        driftPageKeys: ['PRODUCT_DETAIL'],
        recoveredPageKeys: ['HOME'],
        registrationGeneration: '9'
      })
    ) as Record<string, unknown>
    const body = {
      idempotency_key: 'deployment-drift',
      expected_registration_generation: '8',
      capabilities: [],
      runtime_version: '1.0.0'
    }
    const request = {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      body,
      rawBody: Buffer.from(JSON.stringify(body))
    }
    runtimeService.registerPageCapabilities.mockReturnValue(of(decoded))

    await expect(adapter.registerPageCapabilities(request)).resolves.toEqual({
      accepted: true,
      idempotent_replay: false,
      manifest_hash: MANIFEST_HASH,
      discovered_count: 3,
      unavailable_page_keys: ['CHECKOUT'],
      drift_page_keys: ['PRODUCT_DETAIL'],
      recovered_page_keys: ['HOME'],
      registration_generation: '9'
    })
  })

  it.each([
    ['non-array value', 'unavailablePageKeys', 'CHECKOUT'],
    ['non-string element', 'driftPageKeys', [1]],
    ['null element', 'recoveredPageKeys', [null]],
    ['sparse element', 'driftPageKeys', Array(1)]
  ])('rejects a %s in %s', async (_case, field, value) => {
    const body = {
      idempotency_key: 'deployment-invalid-array',
      expected_registration_generation: '0',
      capabilities: [],
      runtime_version: '1.0.0'
    }
    const request = {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      body,
      rawBody: Buffer.from(JSON.stringify(body))
    }
    runtimeService.registerPageCapabilities.mockReturnValue(
      of(registrationResponse({ [field]: value }))
    )

    await expect(adapter.registerPageCapabilities(request)).rejects.toThrow(
      `site-service returned an invalid ${field}`
    )
  })

  it.each([
    ['number', 1],
    ['plain object', { low: 1, high: 0, unsigned: true }]
  ])('rejects a registration generation response represented as a %s', async (_case, value) => {
    const body = {
      idempotency_key: 'deployment-invalid-response',
      expected_registration_generation: '0',
      capabilities: [],
      runtime_version: '1.0.0'
    }
    const request = {
      ...signedRequest,
      path: '/api/v1/site/capabilities/pages:register',
      body,
      rawBody: Buffer.from(JSON.stringify(body))
    }
    runtimeService.registerPageCapabilities.mockReturnValue(
      of(registrationResponse({ registrationGeneration: value }))
    )

    await expect(adapter.registerPageCapabilities(request)).rejects.toThrow(
      'site-service returned an invalid registration_generation'
    )
  })

  it.each([
    ['accepted', 'accepted'],
    ['idempotentReplay', 'idempotentReplay'],
    ['manifestHash', 'manifestHash'],
    ['discoveredCount', 'discoveredCount'],
    ['registrationGeneration', 'registration_generation']
  ])(
    'rejects a downstream registration response missing required %s',
    async (field, errorField) => {
      const response = registrationResponse()
      delete response[field]
      runtimeService.registerPageCapabilities.mockReturnValue(of(response))

      await expect(
        adapter.registerPageCapabilities(registrationRequest(registrationBody()))
      ).rejects.toThrow(`site-service returned an invalid ${errorField}`)
    }
  )

  it.each([
    ['accepted', 'true'],
    ['idempotentReplay', 0],
    ['manifestHash', ''],
    ['manifestHash', 'A'.repeat(64)],
    ['discoveredCount', -1]
  ])('rejects an invalid downstream registration scalar %s', async (field, value) => {
    runtimeService.registerPageCapabilities.mockReturnValue(
      of(registrationResponse({ [field]: value }))
    )

    await expect(
      adapter.registerPageCapabilities(registrationRequest(registrationBody()))
    ).rejects.toThrow(`site-service returned an invalid ${field}`)
  })

  it.each([
    ['SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED', status.INVALID_ARGUMENT, 400],
    ['SITE_CAPABILITY_IDEMPOTENCY_CONFLICT', status.ALREADY_EXISTS, 409],
    ['SITE_CAPABILITY_REGISTRATION_GENERATION_EXHAUSTED', status.RESOURCE_EXHAUSTED, 429]
  ] as const)(
    'preserves public transport payload %s through safeGrpcCall and HTTP mapping',
    async (code, grpcStatus, httpStatus) => {
      const payload: RpcExceptionPayload = {
        grpcStatus,
        code,
        message: `failure: ${code}`,
        details: { operation: 'registerPageCapabilities' }
      }
      const grpcNativeError = Object.assign(new Error(payload.message), {
        code: grpcStatus,
        details: JSON.stringify(payload)
      })
      runtimeService.registerPageCapabilities.mockReturnValue(throwError(() => grpcNativeError))

      const gatewayError = await adapter
        .registerPageCapabilities(registrationRequest(registrationBody()))
        .catch((caught) => caught)

      expect(gatewayError).toBeInstanceOf(RpcException)
      expect((gatewayError as RpcException).getError()).toEqual(payload)

      const logger = { warn: jest.fn(), error: jest.fn() }
      const json = jest.fn()
      const response = { status: jest.fn(() => ({ json })) }
      const request = {
        header: jest.fn(() => 'request-1'),
        method: 'POST',
        originalUrl: '/api/v1/site/capabilities/pages:register'
      }
      const httpHost = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => response
        })
      } as unknown as ArgumentsHost

      new GatewayExceptionFilter(logger as never).catch(gatewayError, httpHost)

      expect(response.status).toHaveBeenCalledWith(httpStatus)
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ code }))
    }
  )

  it('maps snapshot requests while preserving signed site identity and raw body hash', async () => {
    const snapshotRawBody = Buffer.from(
      '{"site_id":"malicious_body_site","resource_types":["product","blog"],"locales":["en-US"],"page_token":"50","page_size":100,"target_publish_version":7}'
    )
    const snapshotRequest = {
      ...signedRequest,
      path: '/api/v1/site/sync/snapshot',
      body: {
        site_id: 'malicious_body_site',
        resource_types: ['product', 'blog'],
        locales: ['en-US'],
        page_token: '50',
        page_size: 100,
        target_publish_version: 7
      },
      rawBody: snapshotRawBody
    }
    runtimeService.getSnapshot.mockReturnValue(
      of({ siteId: 'site_header', snapshotPublishVersion: 7 })
    )

    await adapter.getSnapshot(snapshotRequest)

    expect(runtimeService.getSnapshot).toHaveBeenCalledWith(
      {
        signedContext: {
          siteId: 'site_header',
          clientId: 'client_a',
          credentialId: 'cred_a',
          requestId: 'request_runtime',
          traceId: 'trace_runtime',
          timestamp: '1781481600000',
          nonce: 'nonce_a',
          signature: 'v1=abc',
          method: 'POST',
          path: '/api/v1/site/sync/snapshot',
          normalizedQuery: '',
          bodySha256: createHash('sha256').update(snapshotRawBody).digest('hex')
        },
        resourceTypes: ['product', 'blog'],
        locales: ['en-US'],
        pageToken: '50',
        pageSize: 100,
        targetPublishVersion: 7
      },
      metadata
    )
  })

  it.each([
    ['canonical snake case', { target_publish_version: 7 }, 7],
    ['camel case compatibility', { targetPublishVersion: 7 }, 7],
    ['zero target remains producer-visible', { target_publish_version: 0 }, 0],
    ['missing target remains producer-defaulted', {}, undefined],
    ['invalid target remains producer-defaulted', { target_publish_version: '7' }, undefined]
  ])('forwards batch target %s without inferring a version', async (_case, targetBody, targetPublishVersion) => {
    const body = { resources: [{ resource_type: 'faq', resource_id: 'site_a:faq-directory', locale: 'en-US' }], ...targetBody }
    const request = { ...signedRequest, path: '/api/v1/site/sync/public-views:batchGet', body, rawBody: Buffer.from(JSON.stringify(body)) }
    runtimeService.batchGetPublicViews.mockReturnValue(of({ serverPublishVersion: targetPublishVersion ?? 0, publicViews: [], missingResources: [] }))

    await adapter.batchGetPublicViews(request)

    expect(runtimeService.batchGetPublicViews).toHaveBeenCalledWith(expect.objectContaining({ targetPublishVersion }), metadata)
  })
})
