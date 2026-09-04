import { createHash, createHmac } from 'node:crypto'
import { status } from '@grpc/grpc-js'
import { ArgumentsHost } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { ACCESS_DENIED, UNAUTHENTICATED, VALIDATION_FAILED } from '@oes/common/exceptions'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  CreateSiteRequest,
  GetSiteContentRequest,
  GetLatestPublishStateRequest,
  ListSiteCardsRequest,
  RegisterPageCapabilitiesRequest,
  ReportSyncResultRequest,
  UnpublishSiteContentRequest,
  UpdateSiteContentLocaleVersionRequest
} from '@oes/common/generated/site_service'
import { firstValueFrom } from 'rxjs'
import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import { SiteRuntimeApplicationService } from '../../src/application/services/site-runtime-application.service'
import * as previewTokenDomain from '../../src/domain/preview/preview-token'
import {
  buildCanonicalRequest,
  formatSignature
} from '../../src/domain/security/site-request-signing'
import { SiteCapabilityRegistrationError } from '../../src/domain/site-page/site-capability-registration'
import { SiteAdminGrpcController } from '../../src/interfaces/grpc/site-admin.grpc.controller'
import { SiteRuntimeGrpcController } from '../../src/interfaces/grpc/site-runtime.grpc.controller'
import { RPC_OPERATOR_CONTEXT_KEY } from '@oes/common/authorization'

const assetScope = { runWithInboundScope: async (_data: object, _metadata: unknown, callback: () => Promise<unknown>) => callback() }

function verifiedAdminRequest<T extends object>(request: T): T {
  return { ...request, [RPC_OPERATOR_CONTEXT_KEY]: { verifiedExecutionToken: { subject: 'operator_a', principalType: 'HUMAN', tenantId: 'tenant_a' } } } as T
}

/** serializeGrpcError passes one application error through the real common gRPC exception filter. */
async function serializeGrpcError(error: unknown, path: string) {
  const logger = { warn: jest.fn(), error: jest.fn() }
  const host = {
    switchToRpc: () => ({}),
    getArgByIndex: () => ({ handler: { path } })
  } as unknown as ArgumentsHost
  const descriptor = await firstValueFrom(
    new GrpcExceptionFilter(logger as never).catch(error, host)
  ).catch((caught) => caught as { code: number; details: string; message: string })

  return { descriptor, payload: JSON.parse(descriptor.details) }
}

const PREVIEW_NOW = new Date('2026-07-22T08:00:00.000Z')

/** signedRuntimePreviewContext creates a real signed Site Runtime request for filter-level preview tests. */
function signedRuntimePreviewContext(nonce: string, signedAt = PREVIEW_NOW) {
  const body = Buffer.from('{"preview_token":"bound-token"}')
  const timestamp = String(signedAt.getTime())
  const path = '/api/v1/site/preview/view'
  const canonical = buildCanonicalRequest({
    method: 'POST',
    path,
    query: {},
    body,
    siteId: 'site_a',
    clientId: 'client_a',
    credentialId: 'credential_a',
    timestamp,
    nonce
  })
  return {
    siteId: 'site_a',
    clientId: 'client_a',
    credentialId: 'credential_a',
    requestId: `request_${nonce}`,
    traceId: `trace_${nonce}`,
    timestamp,
    nonce,
    signature: formatSignature(
      createHmac('sha256', 'client_secret_a').update(canonical).digest('hex')
    ),
    method: 'POST',
    path,
    normalizedQuery: '',
    bodySha256: createHash('sha256').update(body).digest('hex')
  }
}

/** runtimePreviewToken creates a real resource-bound preview token without embedding draft content. */
function runtimePreviewToken(resourceId: string, now = PREVIEW_NOW): string {
  return previewTokenDomain.issuePreviewToken({
    secret: 'site-service-local-preview-secret',
    now,
    siteId: 'site_a',
    resourceType: 'blog',
    resourceId,
    locale: 'en-US',
    operatorId: 'operator_a'
  }).token
}

/** createRuntimePreviewFilterHarness supplies valid signed-call dependencies and an injectable draft result. */
function createRuntimePreviewFilterHarness(
  draftResult: unknown,
  options: {
    credential?: Record<string, unknown> | null
    nonceAccepted?: boolean
  } = {}
) {
  const repository = {
    findCredentialForVerification: jest.fn().mockResolvedValue(
      options.credential === undefined
        ? {
            siteId: 'site_a',
            clientId: 'client_a',
            credentialId: 'credential_a',
            clientSecret: 'client_secret_a',
            scopes: ['site:preview'],
            status: 'active',
            siteStatus: 'active'
          }
        : options.credential
    ),
    rememberCredentialNonce: jest.fn().mockResolvedValue(options.nonceAccepted ?? true),
    getPreviewContentVersionForPublicView: jest.fn().mockResolvedValue(draftResult)
  }
  return {
    application: new SiteRuntimeApplicationService(repository as never, {
      now: () => PREVIEW_NOW,
      previewTokenSecret: 'site-service-local-preview-secret'
    }),
    repository
  }
}

describe('site-service gRPC controllers Contract', () => {
  afterEach(() => jest.restoreAllMocks())

  it.each([
    {
      signedCase: 'AUTH_MISSING',
      signedContext: { ...signedRuntimePreviewContext('nonce_auth_missing'), signature: '' },
      credential: undefined,
      nonceAccepted: true,
      expectedStatus: status.UNAUTHENTICATED,
      expectedNonceCalls: 0
    },
    {
      signedCase: 'CREDENTIAL_REVOKED',
      signedContext: signedRuntimePreviewContext('nonce_credential_revoked'),
      credential: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'credential_a',
        clientSecret: 'client_secret_a',
        scopes: ['site:preview'],
        status: 'revoked',
        siteStatus: 'active'
      },
      nonceAccepted: true,
      expectedStatus: status.PERMISSION_DENIED,
      expectedNonceCalls: 0
    },
    {
      signedCase: 'NONCE_REPLAYED',
      signedContext: signedRuntimePreviewContext('nonce_replayed'),
      credential: undefined,
      nonceAccepted: false,
      expectedStatus: status.UNAUTHENTICATED,
      expectedNonceCalls: 1
    },
    {
      signedCase: 'SCOPE_INSUFFICIENT',
      signedContext: signedRuntimePreviewContext('nonce_scope_insufficient'),
      credential: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'credential_a',
        clientSecret: 'client_secret_a',
        scopes: ['site:read'],
        status: 'active',
        siteStatus: 'active'
      },
      nonceAccepted: true,
      expectedStatus: status.PERMISSION_DENIED,
      expectedNonceCalls: 0
    },
    {
      signedCase: 'SIGNATURE_INVALID',
      signedContext: {
        ...signedRuntimePreviewContext('nonce_signature_invalid'),
        signature: `v1=${'0'.repeat(64)}`
      },
      credential: undefined,
      nonceAccepted: true,
      expectedStatus: status.UNAUTHENTICATED,
      expectedNonceCalls: 0
    },
    {
      signedCase: 'SIGNATURE_INVALID nonactive Site',
      signedContext: {
        ...signedRuntimePreviewContext('nonce_signature_invalid_nonactive'),
        signature: `v1=${'f'.repeat(64)}`
      },
      credential: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'credential_a',
        clientSecret: 'client_secret_a',
        scopes: ['site:preview'],
        status: 'active',
        siteStatus: 'disabled'
      },
      nonceAccepted: true,
      expectedStatus: status.UNAUTHENTICATED,
      expectedNonceCalls: 0
    },
    {
      signedCase: 'SITE_DISABLED draft',
      signedContext: signedRuntimePreviewContext('nonce_site_draft'),
      credential: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'credential_a',
        clientSecret: 'client_secret_a',
        scopes: ['site:preview'],
        status: 'active',
        siteStatus: 'draft'
      },
      nonceAccepted: true,
      expectedStatus: status.PERMISSION_DENIED,
      expectedNonceCalls: 1
    },
    {
      signedCase: 'SITE_DISABLED disabled',
      signedContext: signedRuntimePreviewContext('nonce_site_disabled'),
      credential: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'credential_a',
        clientSecret: 'client_secret_a',
        scopes: ['site:preview'],
        status: 'active',
        siteStatus: 'disabled'
      },
      nonceAccepted: true,
      expectedStatus: status.PERMISSION_DENIED,
      expectedNonceCalls: 1
    },
    {
      signedCase: 'TIMESTAMP_EXPIRED',
      signedContext: signedRuntimePreviewContext(
        'nonce_timestamp_expired',
        new Date(PREVIEW_NOW.getTime() - 6 * 60 * 1000)
      ),
      credential: undefined,
      nonceAccepted: true,
      expectedStatus: status.UNAUTHENTICATED,
      expectedNonceCalls: 0
    }
  ])(
    'Runtime preview filter / maps signed request $signedCase without sensitive details',
    async ({
      signedCase,
      signedContext,
      credential,
      nonceAccepted,
      expectedStatus,
      expectedNonceCalls
    }) => {
      const harness = createRuntimePreviewFilterHarness(null, { credential, nonceAccepted })
      const controller = new SiteRuntimeGrpcController(harness.application)
      const applicationError = await controller
        .getPreviewView({
          signedContext,
          previewToken: runtimePreviewToken('signed_resource_secret'),
          resourceType: 'blog',
          resourceId: 'signed_resource_secret',
          locale: 'en-US'
        })
        .catch((caught: unknown) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteRuntime/GetPreviewView'
      )
      const expectedCode = signedCase.split(' ')[0]

      expect(descriptor.code).toBe(expectedStatus)
      expect(payload).toMatchObject({ grpcStatus: expectedStatus, code: expectedCode })
      expect(payload.details).toBeUndefined()
      expect(descriptor.details).not.toContain('"stack"')
      expect(descriptor.details).not.toContain('/Users/')
      expect(descriptor.details).not.toContain('site-runtime-application.service.ts')
      expect(descriptor.details).not.toContain('signed_resource_secret')
      expect(descriptor.details).not.toContain('client_secret_a')
      expect(harness.repository.rememberCredentialNonce).toHaveBeenCalledTimes(expectedNonceCalls)
      expect(harness.repository.getPreviewContentVersionForPublicView).not.toHaveBeenCalled()
    }
  )

  it.each([
    { inputCase: 'missing resourceType', patch: { resourceType: undefined } },
    { inputCase: 'blank resourceType', patch: { resourceType: '   ' } },
    {
      inputCase: 'unsupported resourceType',
      patch: { resourceType: 'unsupported_preview_kind_secret' }
    },
    { inputCase: 'missing resourceId', patch: { resourceId: undefined } },
    { inputCase: 'blank resourceId', patch: { resourceId: '   ' } },
    { inputCase: 'missing locale', patch: { locale: undefined } },
    { inputCase: 'blank locale', patch: { locale: '   ' } },
    { inputCase: 'missing previewToken', patch: { previewToken: undefined } },
    { inputCase: 'blank previewToken', patch: { previewToken: '   ' } }
  ])(
    'Runtime preview filter / maps $inputCase to typed validation without preview lookup leakage',
    async ({ inputCase, patch }) => {
      const harness = createRuntimePreviewFilterHarness(null)
      const controller = new SiteRuntimeGrpcController(harness.application)
      const tokenValidator = jest.spyOn(previewTokenDomain, 'validatePreviewToken')
      const applicationError = await controller
        .getPreviewView({
          signedContext: signedRuntimePreviewContext(
            `nonce_input_${inputCase.toLowerCase().replaceAll(/[^a-z0-9]+/g, '_')}`
          ),
          previewToken: runtimePreviewToken('input_resource_secret'),
          resourceType: 'blog',
          resourceId: 'input_resource_secret',
          locale: 'en-US',
          ...patch
        })
        .catch((caught: unknown) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteRuntime/GetPreviewView'
      )

      expect(descriptor.code).toBe(status.INVALID_ARGUMENT)
      expect(payload).toMatchObject({
        grpcStatus: status.INVALID_ARGUMENT,
        code: VALIDATION_FAILED.code,
        message: VALIDATION_FAILED.message
      })
      expect(payload.details).toBeUndefined()
      expect(descriptor.details).not.toContain('unsupported_preview_kind_secret')
      expect(descriptor.details).not.toContain('input_resource_secret')
      expect(descriptor.details).not.toContain('is required')
      expect(descriptor.details).not.toContain('is unsupported')
      expect(descriptor.details).not.toContain('"stack"')
      expect(descriptor.details).not.toContain('/Users/')
      expect(harness.repository.rememberCredentialNonce).toHaveBeenCalledTimes(1)
      expect(tokenValidator).not.toHaveBeenCalled()
      expect(harness.repository.getPreviewContentVersionForPublicView).not.toHaveBeenCalled()
    }
  )

  it.each([
    {
      previewCase: 'TOKEN_INVALID',
      previewToken: 'not-a-preview-token',
      resourceId: 'invalid_resource_secret',
      draftResult: null,
      expectedStatus: status.UNAUTHENTICATED,
      expectedMessage: 'Preview token is invalid'
    },
    {
      previewCase: 'TOKEN_EXPIRED',
      previewToken: runtimePreviewToken(
        'expired_resource_secret',
        new Date(PREVIEW_NOW.getTime() - 16 * 60 * 1000)
      ),
      resourceId: 'expired_resource_secret',
      draftResult: null,
      expectedStatus: status.UNAUTHENTICATED,
      expectedMessage: 'Preview token has expired'
    },
    {
      previewCase: 'TOKEN_RESOURCE_MISMATCH',
      previewToken: runtimePreviewToken('token_bound_other_secret'),
      resourceId: 'mismatch_resource_secret',
      draftResult: null,
      expectedStatus: status.PERMISSION_DENIED,
      expectedMessage: 'Preview token does not authorize the requested resource'
    },
    {
      previewCase: 'DRAFT_NOT_FOUND cross-Site scoped miss',
      previewToken: runtimePreviewToken('foreign_resource_secret'),
      resourceId: 'foreign_resource_secret',
      draftResult: null,
      expectedStatus: status.NOT_FOUND,
      expectedMessage: 'Preview draft was not found'
    },
    {
      previewCase: 'DRAFT_NOT_FOUND wrong content type',
      previewToken: runtimePreviewToken('wrong_type_resource_secret'),
      resourceId: 'wrong_type_resource_secret',
      draftResult: {
        contentId: 'wrong_type_resource_secret',
        contentType: 'news',
        locale: 'en-US',
        slug: 'wrong-type',
        title: 'Wrong type',
        bodyHtml: '<p>wrong type</p>',
        seoTitle: 'Wrong type',
        seoDescription: 'Wrong type'
      },
      expectedStatus: status.NOT_FOUND,
      expectedMessage: 'Preview draft was not found'
    },
    {
      previewCase: 'DRAFT_NOT_FOUND missing draft',
      previewToken: runtimePreviewToken('missing_resource_secret'),
      resourceId: 'missing_resource_secret',
      draftResult: null,
      expectedStatus: status.NOT_FOUND,
      expectedMessage: 'Preview draft was not found'
    }
  ])(
    'Runtime preview filter / maps $previewCase without stack, path, owner, or resource leakage',
    async ({
      previewCase,
      previewToken,
      resourceId,
      draftResult,
      expectedStatus,
      expectedMessage
    }) => {
      const harness = createRuntimePreviewFilterHarness(draftResult)
      const controller = new SiteRuntimeGrpcController(harness.application)
      const applicationError = await controller
        .getPreviewView({
          signedContext: signedRuntimePreviewContext(
            `nonce_${previewCase.toLowerCase().replaceAll(/[^a-z0-9]+/g, '_')}`
          ),
          previewToken,
          resourceType: 'blog',
          resourceId,
          locale: 'en-US'
        })
        .catch((caught: unknown) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteRuntime/GetPreviewView'
      )

      expect(descriptor.code).toBe(expectedStatus)
      expect(descriptor.message).toBe(expectedMessage)
      expect(payload).toMatchObject({
        grpcStatus: expectedStatus,
        code: previewCase.split(' ')[0],
        message: expectedMessage
      })
      expect(payload.details).toBeUndefined()
      expect(descriptor.details).not.toContain('"stack"')
      expect(descriptor.details).not.toContain('PREVIEW_RESOURCE_NOT_FOUND')
      expect(descriptor.details).not.toContain('/Users/')
      expect(descriptor.details).not.toContain('site-runtime-application.service.ts')
      expect(descriptor.details).not.toContain('site_foreign')
      expect(descriptor.details).not.toContain(resourceId)
      expect(descriptor.details).not.toContain('token_bound_other_secret')
      if (previewCase.startsWith('TOKEN_')) {
        expect(harness.repository.getPreviewContentVersionForPublicView).not.toHaveBeenCalled()
      }
    }
  )

  it.each([
    { inputCase: 'missing resourceType', patch: { resourceType: undefined } },
    { inputCase: 'blank resourceType', patch: { resourceType: '   ' } },
    {
      inputCase: 'unsupported resourceType',
      patch: { resourceType: 'unsupported_admin_preview_kind_secret' }
    },
    { inputCase: 'missing resourceId', patch: { resourceId: undefined } },
    { inputCase: 'blank resourceId', patch: { resourceId: '   ' } },
    { inputCase: 'missing locale', patch: { locale: undefined } },
    { inputCase: 'blank locale', patch: { locale: '   ' } }
  ])(
    'Admin preview filter / maps $inputCase to typed validation with no signer or audit side effect',
    async ({ patch }) => {
      const repository = {
        findTenantIdForSite: jest.fn().mockResolvedValue('tenant_a'),
        findPreviewResourceOwnership: jest.fn(),
        saveAuditEnvelope: jest.fn()
      }
      const application = new SiteAdminApplicationService(repository as never, {
        previewTokenSecret: 'site-service-local-preview-secret'
      })
      const controller = new SiteAdminGrpcController(application, assetScope as never)
      const signer = jest.spyOn(previewTokenDomain, 'issuePreviewToken')
      const applicationError = await controller
        .issuePreviewToken(verifiedAdminRequest({
          context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
          siteId: 'site_a',
          resourceType: 'blog',
          resourceId: 'admin_input_resource_secret',
          locale: 'en-US',
          ...patch
        }))
        .catch((caught: unknown) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteAdmin/IssuePreviewToken'
      )

      expect(descriptor.code).toBe(status.INVALID_ARGUMENT)
      expect(payload).toMatchObject({
        grpcStatus: status.INVALID_ARGUMENT,
        code: VALIDATION_FAILED.code,
        message: VALIDATION_FAILED.message
      })
      expect(payload.details).toBeUndefined()
      expect(descriptor.details).not.toContain('unsupported_admin_preview_kind_secret')
      expect(descriptor.details).not.toContain('admin_input_resource_secret')
      expect(descriptor.details).not.toContain('is required')
      expect(descriptor.details).not.toContain('is unsupported')
      expect(descriptor.details).not.toContain('"stack"')
      expect(descriptor.details).not.toContain('/Users/')
      expect(repository.findTenantIdForSite).toHaveBeenCalledTimes(1)
      expect(repository.findPreviewResourceOwnership).not.toHaveBeenCalled()
      expect(signer).not.toHaveBeenCalled()
      expect(repository.saveAuditEnvelope).not.toHaveBeenCalled()
    }
  )

  it('Admin gRPC / maps CreateSite and ListSiteCards to the application service', async () => {
    const app = {
      createSite: jest.fn().mockResolvedValue({
        siteId: 'site_a',
        status: 'draft',
        defaultLocale: 'en-US'
      }),
      listSiteCards: jest.fn().mockResolvedValue({
        cards: [
          {
            siteId: 'site_a',
            siteName: 'Brand US',
            status: 'draft',
            activeLocales: ['en-US'],
            pendingSyncCount: 0,
            latestPublishVersion: 0,
            runtimePublishVersion: 0,
            runtimeStatus: 'unknown'
          }
        ]
      })
    }
    const controller = new SiteAdminGrpcController(app as never, assetScope as never)
    const createRequest: CreateSiteRequest = {
      tenantId: 'tenant_a',
      operatorId: 'operator_a',
      traceId: 'trace_a',
      siteName: 'Brand US',
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: '',
      previewBaseUrl: ''
    }
    const listRequest: ListSiteCardsRequest = {
      tenantId: 'tenant_a',
      operatorId: 'operator_a',
      traceId: 'trace_a'
    }
    await expect(controller.createSite(verifiedAdminRequest(createRequest))).resolves.toEqual({
      siteId: 'site_a',
      status: 'draft',
      defaultLocale: 'en-US'
    })
    await expect(controller.listSiteCards(verifiedAdminRequest(listRequest))).resolves.toEqual({
      cards: [
        expect.objectContaining({
          siteId: 'site_a',
          siteName: 'Brand US'
        })
      ]
    })
    expect(app.createSite).toHaveBeenCalledWith(expect.objectContaining({ siteName: createRequest.siteName, context: expect.objectContaining({ tenantId: 'tenant_a', operatorId: 'operator_a' }) }))
    expect(app.listSiteCards).toHaveBeenCalledWith(expect.objectContaining({ context: expect.objectContaining({ tenantId: 'tenant_a', operatorId: 'operator_a' }) }))
  })

  it('Runtime gRPC / maps latest state and sync result reports to the application service', async () => {
    const app = {
      getLatestPublishState: jest.fn().mockResolvedValue({
        siteId: 'site_a',
        latestPublishVersion: 5,
        latestSyncId: 'sync_a',
        hasUpdates: true,
        serverTime: '2026-06-15T08:00:00.000Z'
      }),
      reportSyncResult: jest.fn().mockResolvedValue({
        accepted: true,
        serverTime: '2026-06-15T08:01:00.000Z'
      })
    }
    const controller = new SiteRuntimeGrpcController(app as never)
    const latestRequest: GetLatestPublishStateRequest = {
      signedContext: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'cred_a',
        requestId: 'request_a',
        traceId: 'trace_a'
      },
      localPublishVersion: 3
    }
    const reportRequest: ReportSyncResultRequest = {
      signedContext: latestRequest.signedContext,
      syncId: 'sync_a',
      localPublishVersion: 5,
      status: 'completed',
      startedAt: '2026-06-15T08:00:30.000Z',
      completedAt: '2026-06-15T08:00:45.000Z',
      errorCode: '',
      errorMessage: ''
    }

    await expect(controller.getLatestPublishState(latestRequest)).resolves.toEqual({
      siteId: 'site_a',
      latestPublishVersion: 5,
      latestSyncId: 'sync_a',
      hasUpdates: true,
      serverTime: '2026-06-15T08:00:00.000Z'
    })
    await expect(controller.reportSyncResult(reportRequest)).resolves.toEqual({
      accepted: true,
      serverTime: '2026-06-15T08:01:00.000Z'
    })
    expect(app.getLatestPublishState).toHaveBeenCalledWith(latestRequest)
    expect(app.reportSyncResult).toHaveBeenCalledWith(reportRequest)
  })

  it('Runtime gRPC / preserves registration generation fencing fields in both directions', async () => {
    const app = {
      registerPageCapabilities: jest.fn().mockResolvedValue({
        accepted: true,
        idempotentReplay: false,
        manifestHash: 'b8760cd0370e7c54852695c1fcfe895daa9f3d130a90ef1c58bdaa17d60ccacb',
        discoveredCount: 2,
        unavailablePageKeys: [],
        driftPageKeys: [],
        recoveredPageKeys: [],
        registrationGeneration: '8'
      })
    }
    const controller = new SiteRuntimeGrpcController(app as never)
    const request: RegisterPageCapabilitiesRequest = {
      signedContext: {
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'cred_a',
        requestId: 'request_a',
        traceId: 'trace_a'
      },
      idempotencyKey: 'deployment-8',
      expectedRegistrationGeneration: '7',
      capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }]
    }

    await expect(controller.registerPageCapabilities(request)).resolves.toEqual(
      expect.objectContaining({ accepted: true, registrationGeneration: '8' })
    )
    expect(app.registerPageCapabilities).toHaveBeenCalledWith(request)
  })

  it.each([
    ['SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED', status.INVALID_ARGUMENT],
    ['SITE_CAPABILITY_IDEMPOTENCY_CONFLICT', status.ALREADY_EXISTS],
    ['SITE_CAPABILITY_REGISTRATION_GENERATION_EXHAUSTED', status.RESOURCE_EXHAUSTED]
  ] as const)(
    'Runtime gRPC / maps stable registration error %s to status %s',
    async (code, grpcStatus) => {
      const app = {
        registerPageCapabilities: jest
          .fn()
          .mockRejectedValue(new SiteCapabilityRegistrationError(code, `failure: ${code}`))
      }
      const controller = new SiteRuntimeGrpcController(app as never)

      const error = await controller
        .registerPageCapabilities({
          idempotencyKey: 'deployment-1',
          expectedRegistrationGeneration: '0',
          runtimeVersion: '1.0.0',
          capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }]
        })
        .catch((caught) => caught)

      expect(error).toBeInstanceOf(RpcException)
      expect((error as RpcException).getError()).toMatchObject({ grpcStatus, code })

      const logger = { warn: jest.fn(), error: jest.fn() }
      const host = {
        switchToRpc: () => ({}),
        getArgByIndex: () => ({ handler: { path: '/site_service.SiteRuntimeSync/Register' } })
      } as unknown as ArgumentsHost
      const descriptor = await firstValueFrom(
        new GrpcExceptionFilter(logger as never).catch(error, host)
      ).catch((caught) => caught as { code: number; details: string; message: string })

      expect(descriptor.code).toBe(grpcStatus)
      expect(JSON.parse(descriptor.details)).toMatchObject({ grpcStatus, code })
    }
  )

  it.each([
    {
      contextCase: 'missing tenant context',
      context: { operatorId: 'operator_a', traceId: 'trace_a' },
      ownerTenantId: 'tenant_a',
      expectedStatus: status.UNAUTHENTICATED,
      expectedCode: UNAUTHENTICATED.code,
      expectedDetails: undefined,
      expectedLookupCount: 0
    },
    {
      contextCase: 'blank tenant context',
      context: { tenantId: '   ', operatorId: 'operator_a', traceId: 'trace_a' },
      ownerTenantId: 'tenant_a',
      expectedStatus: status.UNAUTHENTICATED,
      expectedCode: UNAUTHENTICATED.code,
      expectedDetails: undefined,
      expectedLookupCount: 0
    },
    {
      contextCase: 'missing Site',
      context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
      ownerTenantId: null,
      expectedStatus: status.NOT_FOUND,
      expectedCode: 'HTTP_NOT_FOUND',
      expectedDetails: {
        statusCode: 404,
        message: 'site not found',
        error: 'Not Found'
      },
      expectedLookupCount: 1
    },
    {
      contextCase: 'foreign tenant',
      context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
      ownerTenantId: 'tenant_foreign',
      expectedStatus: status.PERMISSION_DENIED,
      expectedCode: ACCESS_DENIED.code,
      expectedDetails: undefined,
      expectedLookupCount: 1
    }
  ])(
    'Admin ownership / serializes $contextCase without internal or tenant details',
    async ({
      context,
      ownerTenantId,
      expectedStatus,
      expectedCode,
      expectedDetails,
      expectedLookupCount
    }) => {
      const repository = {
        findTenantIdForSite: jest.fn().mockResolvedValue(ownerTenantId),
        listSiteContents: jest.fn()
      }
      const application = new SiteAdminApplicationService(repository as never, {
        previewTokenSecret: 'site-service-local-preview-secret'
      })
      const applicationError = await application
        .listSiteContents({ context, siteId: 'site_a', contentType: 'blog' })
        .catch((caught) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteAdmin/ListContents'
      )

      expect(descriptor.details).not.toContain('"stack"')
      expect(descriptor.details).not.toContain('tenantId is required')
      expect(descriptor.details).not.toContain('assertSiteOwnership')
      expect(descriptor.details).not.toContain('tenant_a')
      expect(descriptor.details).not.toContain('tenant_foreign')
      expect(descriptor.code).toBe(expectedStatus)
      expect(payload).toMatchObject({ grpcStatus: expectedStatus, code: expectedCode })
      expect(payload.details).toEqual(expectedDetails)
      expect(repository.findTenantIdForSite).toHaveBeenCalledTimes(expectedLookupCount)
      expect(repository.listSiteContents).not.toHaveBeenCalled()
    }
  )

  it.each([
    {
      contextCase: 'missing tenant before a blank Site target',
      invoke: (application: SiteAdminApplicationService) =>
        application.listSiteContents({
          context: { operatorId: 'operator_a', traceId: 'trace_a' },
          siteId: '   ',
          contentType: 'blog'
        })
    },
    {
      contextCase: 'missing tenant before a missing category payload',
      invoke: (application: SiteAdminApplicationService) =>
        application.updateSiteCategory({
          context: { operatorId: 'operator_a', traceId: 'trace_a' },
          siteId: 'site_a'
        } as never)
    },
    {
      contextCase: 'blank tenant before a missing content version payload',
      invoke: (application: SiteAdminApplicationService) =>
        application.updateSiteContentLocaleVersion({
          context: { tenantId: '   ', operatorId: 'operator_a', traceId: 'trace_a' },
          siteId: 'site_a'
        })
    },
    {
      contextCase: 'missing tenant before a missing Content Category version payload',
      invoke: (application: SiteAdminApplicationService) =>
        application.updateContentCategoryLocaleVersion({
          context: { operatorId: 'operator_a', traceId: 'trace_a' },
          siteId: 'site_a'
        })
    }
  ])('Admin ownership / authenticates $contextCase', async ({ invoke }) => {
    const repository = { findTenantIdForSite: jest.fn() }
    const application = new SiteAdminApplicationService(repository as never, {
      previewTokenSecret: 'site-service-local-preview-secret'
    })
    const applicationError = await invoke(application).catch((caught) => caught)
    const { descriptor, payload } = await serializeGrpcError(
      applicationError,
      '/site_service.SiteAdmin/MalformedRequest'
    )

    expect(descriptor.code).toBe(status.UNAUTHENTICATED)
    expect(payload).toMatchObject({
      grpcStatus: status.UNAUTHENTICATED,
      code: UNAUTHENTICATED.code
    })
    expect(payload.details).toBeUndefined()
    expect(descriptor.details).not.toContain('"stack"')
    expect(descriptor.details).not.toContain('tenantId is required')
    expect(descriptor.details).not.toContain('assertSiteOwnership')
    expect(repository.findTenantIdForSite).not.toHaveBeenCalled()
  })

  it.each([
    {
      descendantCase: 'foreign credential',
      expectedStatus: status.PERMISSION_DENIED,
      expectedCode: ACCESS_DENIED.code,
      repository: {
        findTenantIdForSite: jest.fn().mockResolvedValue('tenant_a'),
        findCredentialOwnership: jest.fn().mockResolvedValue({ siteId: 'site_foreign' }),
        revokeSiteCredential: jest.fn()
      },
      invoke: (application: SiteAdminApplicationService) =>
        application.revokeSiteCredential({
          context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
          siteId: 'site_a',
          credentialId: 'credential_secret'
        })
    },
    {
      descendantCase: 'missing credential',
      expectedStatus: status.NOT_FOUND,
      expectedCode: 'HTTP_NOT_FOUND',
      repository: {
        findTenantIdForSite: jest.fn().mockResolvedValue('tenant_a'),
        findCredentialOwnership: jest.fn().mockResolvedValue(null),
        revokeSiteCredential: jest.fn()
      },
      invoke: (application: SiteAdminApplicationService) =>
        application.revokeSiteCredential({
          context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
          siteId: 'site_a',
          credentialId: 'credential_secret'
        })
    },
    {
      descendantCase: 'foreign sync',
      expectedStatus: status.PERMISSION_DENIED,
      expectedCode: ACCESS_DENIED.code,
      repository: {
        findSyncOwnership: jest.fn().mockResolvedValue({
          syncId: 'sync_secret',
          siteId: 'site_foreign',
          tenantId: 'tenant_foreign'
        }),
        getSyncDetail: jest.fn()
      },
      invoke: (application: SiteAdminApplicationService) =>
        application.getSyncDetail({
          context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
          syncId: 'sync_secret'
        })
    },
    {
      descendantCase: 'missing sync',
      expectedStatus: status.NOT_FOUND,
      expectedCode: 'HTTP_NOT_FOUND',
      repository: {
        findSyncOwnership: jest.fn().mockResolvedValue(null),
        getSyncDetail: jest.fn()
      },
      invoke: (application: SiteAdminApplicationService) =>
        application.getSyncDetail({
          context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
          syncId: 'sync_secret'
        })
    },
    {
      descendantCase: 'missing tenant before malformed sync',
      expectedStatus: status.UNAUTHENTICATED,
      expectedCode: UNAUTHENTICATED.code,
      repository: { findSyncOwnership: jest.fn(), getSyncDetail: jest.fn() },
      invoke: (application: SiteAdminApplicationService) =>
        application.getSyncDetail({ context: { operatorId: 'operator_a' }, syncId: '   ' })
    }
  ])(
    'Admin descendant ownership / serializes $descendantCase without tenant, id, secret, or webhook details',
    async ({ expectedStatus, expectedCode, repository, invoke }) => {
      const application = new SiteAdminApplicationService(repository as never, {
        previewTokenSecret: 'site-service-local-preview-secret'
      })
      const applicationError = await invoke(application).catch((caught) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteAdmin/DescendantOwnership'
      )

      expect(descriptor.code).toBe(expectedStatus)
      expect(payload).toMatchObject({ grpcStatus: expectedStatus, code: expectedCode })
      expect(descriptor.details).not.toContain('tenant_a')
      expect(descriptor.details).not.toContain('tenant_foreign')
      expect(descriptor.details).not.toContain('credential_secret')
      expect(descriptor.details).not.toContain('sync_secret')
      expect(descriptor.details).not.toContain('webhook')
      expect(descriptor.details).not.toContain('"stack"')
    }
  )

  it.each([
    {
      previewCase: 'missing operator',
      context: { tenantId: 'tenant_a' },
      ownership: { siteId: 'site_a', resourceType: 'blog', localeMatched: true },
      expectedStatus: status.UNAUTHENTICATED,
      expectedCode: UNAUTHENTICATED.code,
      expectedSiteLookups: 0,
      expectedResourceLookups: 0
    },
    {
      previewCase: 'foreign Site resource',
      context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
      ownership: { siteId: 'site_foreign', resourceType: 'blog', localeMatched: true },
      expectedStatus: status.PERMISSION_DENIED,
      expectedCode: ACCESS_DENIED.code,
      expectedSiteLookups: 1,
      expectedResourceLookups: 1
    },
    {
      previewCase: 'missing resource',
      context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
      ownership: null,
      expectedStatus: status.NOT_FOUND,
      expectedCode: 'HTTP_NOT_FOUND',
      expectedSiteLookups: 1,
      expectedResourceLookups: 1
    },
    {
      previewCase: 'missing locale',
      context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
      ownership: { siteId: 'site_a', resourceType: 'blog', localeMatched: false },
      expectedStatus: status.NOT_FOUND,
      expectedCode: 'HTTP_NOT_FOUND',
      expectedSiteLookups: 1,
      expectedResourceLookups: 1
    },
    {
      previewCase: 'wrong Blog/News type',
      context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
      ownership: { siteId: 'site_a', resourceType: 'news', localeMatched: true },
      expectedStatus: status.NOT_FOUND,
      expectedCode: 'HTTP_NOT_FOUND',
      expectedSiteLookups: 1,
      expectedResourceLookups: 1
    }
  ])(
    'Admin preview ownership / maps $previewCase to stable $expectedStatus without owner or resource detail',
    async ({
      context,
      ownership,
      expectedStatus,
      expectedCode,
      expectedSiteLookups,
      expectedResourceLookups
    }) => {
      const repository = {
        findTenantIdForSite: jest.fn().mockResolvedValue('tenant_a'),
        findPreviewResourceOwnership: jest.fn().mockResolvedValue(ownership)
      }
      const application = new SiteAdminApplicationService(repository as never, {
        previewTokenSecret: 'site-service-local-preview-secret'
      })
      const applicationError = await application
        .issuePreviewToken({
          context,
          siteId: 'site_a',
          resourceType: 'blog',
          resourceId: 'preview_resource_secret',
          locale: 'en-US'
        })
        .catch((caught) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteAdmin/IssuePreviewToken'
      )

      expect(descriptor.code).toBe(expectedStatus)
      expect(payload).toMatchObject({ grpcStatus: expectedStatus, code: expectedCode })
      expect(descriptor.details).not.toContain('tenant_a')
      expect(descriptor.details).not.toContain('site_foreign')
      expect(descriptor.details).not.toContain('preview_resource_secret')
      expect(descriptor.details).not.toContain('operator_a')
      expect(descriptor.details).not.toContain('"stack"')
      expect(repository.findTenantIdForSite).toHaveBeenCalledTimes(expectedSiteLookups)
      expect(repository.findPreviewResourceOwnership).toHaveBeenCalledTimes(expectedResourceLookups)
    }
  )

  it.each(
    [
      { contextCase: 'missing', operatorId: undefined },
      { contextCase: 'blank', operatorId: '   ' }
    ].flatMap(({ contextCase, operatorId }) =>
      [
        {
          operation: 'RotateSiteCredential',
          invoke: (application: SiteAdminApplicationService, context: { tenantId: string }) =>
            application.rotateSiteCredential({
              context,
              siteId: 'site_a',
              credentialId: 'credential_secret'
            })
        },
        {
          operation: 'RevokeSiteCredential',
          invoke: (application: SiteAdminApplicationService, context: { tenantId: string }) =>
            application.revokeSiteCredential({
              context,
              siteId: 'site_a',
              credentialId: 'credential_secret'
            })
        },
        {
          operation: 'GetSyncDetail',
          invoke: (application: SiteAdminApplicationService, context: { tenantId: string }) =>
            application.getSyncDetail({ context, syncId: 'sync_secret' })
        },
        {
          operation: 'ResendWebhook',
          invoke: (application: SiteAdminApplicationService, context: { tenantId: string }) =>
            application.resendWebhook({ context, syncId: 'sync_secret' })
        }
      ].map((operation) => ({ ...operation, contextCase, operatorId }))
    )
  )(
    'Admin descendant ownership / rejects $contextCase operator before $operation lookup or effects',
    async ({ invoke, operatorId }) => {
      const repository = {
        runInTransaction: jest.fn().mockImplementation(async (callback) => callback()),
        findTenantIdForSite: jest.fn().mockResolvedValue('tenant_a'),
        findCredentialOwnership: jest.fn().mockResolvedValue({ siteId: 'site_a' }),
        findSyncOwnership: jest.fn().mockResolvedValue({
          syncId: 'sync_secret',
          siteId: 'site_a',
          tenantId: 'tenant_a'
        }),
        saveCredentialMetadata: jest.fn(),
        revokeSiteCredential: jest.fn().mockResolvedValue(true),
        getSyncDetail: jest.fn().mockResolvedValue({
          syncId: 'sync_secret',
          siteId: 'site_a',
          publishVersion: 7
        }),
        getWebhookDispatchConfig: jest.fn().mockResolvedValue(null),
        recordWebhookDelivery: jest.fn(),
        saveAuditEnvelope: jest.fn()
      }
      const application = new SiteAdminApplicationService(repository as never, {
        previewTokenSecret: 'site-service-local-preview-secret'
      })
      const applicationError = await invoke(application, {
        tenantId: 'tenant_a',
        operatorId
      } as never).catch((caught) => caught)
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        '/site_service.SiteAdmin/CompleteContext'
      )

      expect(descriptor.code).toBe(status.UNAUTHENTICATED)
      expect(payload).toMatchObject({
        grpcStatus: status.UNAUTHENTICATED,
        code: UNAUTHENTICATED.code
      })
      expect(payload.details).toBeUndefined()
      expect(descriptor.details).not.toContain('tenant_a')
      expect(descriptor.details).not.toContain('credential_secret')
      expect(descriptor.details).not.toContain('sync_secret')
      expect(descriptor.details).not.toContain('"stack"')
      for (const call of Object.values(repository)) {
        expect(call).not.toHaveBeenCalled()
      }
    }
  )
})

// Verifies the real Admin controller plus common gRPC filter never leaks Content ownership details.
describe('site-service Content descendant ownership gRPC Contract', () => {
  type Operation = 'get' | 'update' | 'unpublish'

  function invokeRequest(
    operation: Operation,
    locale = 'en-US'
  ): {
    request:
      | GetSiteContentRequest
      | UpdateSiteContentLocaleVersionRequest
      | UnpublishSiteContentRequest
    method: 'getSiteContent' | 'updateSiteContentLocaleVersion' | 'unpublishSiteContent'
  } {
    if (operation === 'get') {
      return {
        request: {
          context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
          siteId: 'site_a',
          contentId: 'content_secret'
        },
        method: 'getSiteContent'
      }
    }
    if (operation === 'update') {
      return {
        request: {
          context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
          siteId: 'site_a',
          version: {
            contentId: 'content_secret',
            locale,
            slug: 'secret-slug',
            title: 'secret title',
            bodyHtml: '<p>secret body</p>',
            categoryIds: [],
            seoTitle: 'secret SEO title',
            seoDescription: 'secret SEO description'
          }
        },
        method: 'updateSiteContentLocaleVersion'
      }
    }
    return {
      request: {
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        contentId: 'content_secret',
        locale
      },
      method: 'unpublishSiteContent'
    }
  }

  it.each(
    (['get', 'update', 'unpublish'] as Operation[]).flatMap((operation) => [
      {
        operation,
        contextCase: 'missing operator',
        context: { tenantId: 'tenant_a', traceId: 'trace_a' },
        owner: { siteId: 'site_a', contentType: 'blog' } as {
          siteId: string
          contentType: string
        } | null,
        ownerTenantId: 'tenant_a',
        locale: undefined,
        expectedStatus: status.UNAUTHENTICATED,
        expectedCode: UNAUTHENTICATED.code
      },
      {
        operation,
        contextCase: 'same-tenant other Site Content',
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        owner: { siteId: 'site_b', contentType: 'blog' },
        ownerTenantId: 'tenant_a',
        locale: undefined,
        expectedStatus: status.PERMISSION_DENIED,
        expectedCode: ACCESS_DENIED.code
      },
      {
        operation,
        contextCase: 'missing Content',
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        owner: null,
        ownerTenantId: 'tenant_a',
        locale: undefined,
        expectedStatus: status.NOT_FOUND,
        expectedCode: 'HTTP_NOT_FOUND'
      },
      {
        operation,
        contextCase: 'same-tenant other Site with blank locale',
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        owner: { siteId: 'site_b', contentType: 'blog' },
        ownerTenantId: 'tenant_a',
        locale: '   ',
        expectedStatus: status.PERMISSION_DENIED,
        expectedCode: ACCESS_DENIED.code
      },
      {
        operation,
        contextCase: 'missing Content with blank locale',
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        owner: null,
        ownerTenantId: 'tenant_a',
        locale: '   ',
        expectedStatus: status.NOT_FOUND,
        expectedCode: 'HTTP_NOT_FOUND'
      }
    ])
  )(
    'Admin gRPC $operation maps $contextCase without tenant, Content, body, slug, or SEO leakage',
    async ({ operation, context, owner, ownerTenantId, locale, expectedStatus, expectedCode }) => {
      const calls = {
        findTenantIdForSite: jest.fn().mockResolvedValue(ownerTenantId),
        findContentOwnership: jest.fn().mockResolvedValue(owner),
        getSiteContent: jest.fn().mockResolvedValue({
          contentId: 'content_secret',
          siteId: 'site_a',
          contentType: 'blog',
          status: 'draft',
          versions: [{ bodyHtml: '<p>secret body</p>', slug: 'secret-slug' }]
        }),
        runInTransaction: jest
          .fn()
          .mockImplementation(async (callback: () => Promise<unknown>) => callback()),
        getLocaleStatus: jest.fn().mockResolvedValue('active'),
        listContentCategories: jest.fn().mockResolvedValue([]),
        updateContentLocaleVersion: jest.fn().mockResolvedValue({
          contentId: 'content_secret',
          slug: 'secret-slug'
        }),
        unpublishSiteContent: jest.fn().mockResolvedValue(true),
        saveAuditEnvelope: jest.fn().mockResolvedValue(undefined)
      }
      const application = new SiteAdminApplicationService(calls as never, {
        previewTokenSecret: 'site-service-local-preview-secret'
      })
      const controller = new SiteAdminGrpcController(application, assetScope as never)
      const selected = invokeRequest(operation, locale)
      const request = (context.operatorId ? verifiedAdminRequest({
        ...selected.request,
        context
      } as never) : { ...selected.request, context } as never)

      const applicationError = await controller[selected.method](request).catch(
        (caught: unknown) => caught
      )
      const { descriptor, payload } = await serializeGrpcError(
        applicationError,
        `/site_service.SiteAdmin/${selected.method}`
      )

      expect(descriptor.code).toBe(expectedStatus)
      expect(payload).toMatchObject({ grpcStatus: expectedStatus, code: expectedCode })
      expect(descriptor.details).not.toContain('tenant_a')
      expect(descriptor.details).not.toContain('site_b')
      expect(descriptor.details).not.toContain('content_secret')
      expect(descriptor.details).not.toContain('secret body')
      expect(descriptor.details).not.toContain('secret-slug')
      expect(descriptor.details).not.toContain('secret SEO')
      expect(descriptor.details).not.toContain('"stack"')
      if (expectedStatus === status.UNAUTHENTICATED) {
        expect(calls.findTenantIdForSite).not.toHaveBeenCalled()
      } else {
        expect(calls.findTenantIdForSite).toHaveBeenCalledWith('site_a')
        expect(calls.findContentOwnership).toHaveBeenCalledWith('content_secret')
      }
      expect(calls.getSiteContent).not.toHaveBeenCalled()
      expect(calls.updateContentLocaleVersion).not.toHaveBeenCalled()
      expect(calls.unpublishSiteContent).not.toHaveBeenCalled()
      expect(calls.saveAuditEnvelope).not.toHaveBeenCalled()
    }
  )
})
