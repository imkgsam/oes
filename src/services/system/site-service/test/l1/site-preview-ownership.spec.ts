import { createHash, createHmac } from 'node:crypto'
import { status } from '@grpc/grpc-js'
import { NotFoundException } from '@nestjs/common'
import { ACCESS_DENIED, UNAUTHENTICATED } from '@oes/common/exceptions'
import {
  SiteAdminApplicationRepository,
  SiteAdminApplicationService
} from '../../src/application/services/site-admin-application.service'
import {
  SiteRuntimeApplicationRepository,
  SiteRuntimeApplicationService
} from '../../src/application/services/site-runtime-application.service'
import * as previewToken from '../../src/domain/preview/preview-token'
import {
  buildCanonicalRequest,
  formatSignature
} from '../../src/domain/security/site-request-signing'

const NOW = new Date('2026-07-22T08:00:00.000Z')
const PREVIEW_SECRET = 'site-service-local-preview-secret'

/** createAdminHarness records every repository and signing call around Admin preview authorization. */
function createAdminHarness() {
  const calls: Record<string, jest.Mock> = {}
  const repository = new Proxy(calls, {
    get(target, property: string) {
      target[property] ??= jest.fn()
      return target[property]
    }
  }) as unknown as SiteAdminApplicationRepository
  const repositoryMock = repository as unknown as Record<string, jest.Mock>
  repositoryMock.findTenantIdForSite.mockResolvedValue('tenant_a')
  repositoryMock.findPreviewResourceOwnership.mockResolvedValue({
    siteId: 'site_a',
    resourceType: 'blog',
    localeMatched: true
  })

  return {
    application: new SiteAdminApplicationService(repository, {
      now: () => NOW,
      previewTokenSecret: PREVIEW_SECRET
    }),
    calls: repositoryMock
  }
}

/** createRuntimeHarness records scoped draft reads after signed request and token verification. */
function createRuntimeHarness() {
  const calls: Record<string, jest.Mock> = {}
  const repository = new Proxy(calls, {
    get(target, property: string) {
      target[property] ??= jest.fn()
      return target[property]
    }
  }) as unknown as SiteRuntimeApplicationRepository
  const repositoryMock = repository as unknown as Record<string, jest.Mock>
  repositoryMock.findCredentialForVerification.mockResolvedValue({
    siteId: 'site_a',
    clientId: 'client_a',
    credentialId: 'credential_a',
    clientSecret: 'client_secret_a',
    scopes: ['site:preview'],
    status: 'active',
    siteStatus: 'active'
  })
  repositoryMock.rememberCredentialNonce.mockResolvedValue(true)

  return {
    application: new SiteRuntimeApplicationService(repository, {
      now: () => NOW,
      previewTokenSecret: PREVIEW_SECRET
    }),
    calls: repositoryMock
  }
}

/** signedPreviewContext builds a real HMAC-authenticated Site Runtime request context. */
function signedPreviewContext(nonce: string) {
  const body = Buffer.from('{"preview_token":"bound-token"}')
  const timestamp = String(NOW.getTime())
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

/** boundPreviewToken creates a real signed preview token for one Site/resource tuple. */
function boundPreviewToken(resourceType: 'product' | 'blog' | 'news', resourceId: string) {
  return previewToken.issuePreviewToken({
    secret: PREVIEW_SECRET,
    now: NOW,
    siteId: 'site_a',
    resourceType,
    resourceId,
    locale: 'en-US',
    operatorId: 'operator_a'
  }).token
}

/** expectTypedPreviewError verifies one runtime rejection remains a detail-free OES application exception. */
function expectTypedPreviewError(error: unknown, code: string, rpcStatus: status): void {
  expect(error).toMatchObject({
    definition: expect.objectContaining({ code, rpcStatus }),
    additionalDetails: undefined
  })
}

/** previewContent returns a complete saved locale payload that exposes an unscoped preview leak. */
function previewContent(contentId: string, contentType: 'blog' | 'news') {
  return {
    contentId,
    contentType,
    locale: 'en-US',
    slug: contentId,
    title: contentId,
    bodyHtml: '<p>foreign draft</p>',
    summary: 'foreign draft',
    coverImage: null,
    author: 'OES',
    tags: [],
    seoTitle: contentId,
    seoDescription: contentId,
    seoImage: null,
    publishedAt: null
  }
}

// Verifies Admin preview issuance fails before signing when caller or saved ownership facts do not match.
describe('Site Admin preview resource ownership', () => {
  let signer: jest.SpyInstance

  beforeEach(() => {
    signer = jest.spyOn(previewToken, 'issuePreviewToken')
  })

  afterEach(() => {
    signer.mockRestore()
  })

  it.each([
    { operatorCase: 'missing', operatorId: undefined },
    { operatorCase: 'blank', operatorId: '   ' }
  ])(
    'authenticates $operatorCase operator before target or resource lookup',
    async ({ operatorId }) => {
      const harness = createAdminHarness()

      const denial = await harness.application
        .issuePreviewToken({
          context: { tenantId: 'tenant_a', operatorId },
          siteId: 'site_a',
          resourceType: 'blog',
          resourceId: 'content_a',
          locale: 'en-US'
        })
        .catch((error: unknown) => error)

      expect(denial).toMatchObject({
        definition: expect.objectContaining({
          code: UNAUTHENTICATED.code,
          rpcStatus: UNAUTHENTICATED.rpcStatus
        }),
        additionalDetails: undefined
      })
      expect(harness.calls.findTenantIdForSite).not.toHaveBeenCalled()
      expect(harness.calls.findPreviewResourceOwnership).not.toHaveBeenCalled()
      expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
      expect(signer).not.toHaveBeenCalled()
    }
  )

  it('denies a Blog draft owned by another Site without signing or exposing owner detail', async () => {
    const harness = createAdminHarness()
    harness.calls.findPreviewResourceOwnership.mockResolvedValue({
      siteId: 'site_b',
      resourceType: 'blog',
      localeMatched: true
    })

    const denial = await harness.application
      .issuePreviewToken({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        siteId: 'site_a',
        resourceType: 'blog',
        resourceId: 'content_b',
        locale: 'en-US'
      })
      .catch((error: unknown) => error)

    expect(denial).toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code,
        rpcStatus: ACCESS_DENIED.rpcStatus
      }),
      additionalDetails: undefined
    })
    expect(JSON.stringify(denial)).not.toContain('site_b')
    expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
    expect(signer).not.toHaveBeenCalled()
  })

  it.each([
    { resourceCase: 'missing resource', fact: null },
    {
      resourceCase: 'missing locale',
      fact: { siteId: 'site_a', resourceType: 'blog', localeMatched: false }
    },
    {
      resourceCase: 'wrong Blog/News type',
      fact: { siteId: 'site_a', resourceType: 'news', localeMatched: true }
    }
  ])('returns NOT_FOUND for $resourceCase without signing', async ({ fact }) => {
    const harness = createAdminHarness()
    harness.calls.findPreviewResourceOwnership.mockResolvedValue(fact)

    await expect(
      harness.application.issuePreviewToken({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        siteId: 'site_a',
        resourceType: 'blog',
        resourceId: 'content_a',
        locale: 'en-US'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(signer).not.toHaveBeenCalled()
    expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
  })

  it.each([
    { resourceType: 'blog' as const, resourceId: 'content_a' },
    { resourceType: 'news' as const, resourceId: 'content_news' },
    { resourceType: 'product' as const, resourceId: 'product_a' }
  ])(
    'signs an existing owned $resourceType locale only after its ownership fact',
    async (input) => {
      const harness = createAdminHarness()
      harness.calls.findPreviewResourceOwnership.mockResolvedValue({
        siteId: 'site_a',
        resourceType: input.resourceType,
        localeMatched: true
      })

      await expect(
        harness.application.issuePreviewToken({
          context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
          siteId: 'site_a',
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          locale: 'en-US'
        })
      ).resolves.toEqual(
        expect.objectContaining({ previewToken: expect.stringMatching(/^oes_preview_v1\./) })
      )

      expect(harness.calls.findPreviewResourceOwnership).toHaveBeenCalledWith({
        siteId: 'site_a',
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        locale: 'en-US'
      })
      expect(signer).toHaveBeenCalledTimes(1)
      expect(harness.calls.findPreviewResourceOwnership.mock.invocationCallOrder[0]).toBeLessThan(
        signer.mock.invocationCallOrder[0]
      )
      if (input.resourceType === 'product') {
        expect(harness.calls.saveAuditEnvelope).not.toHaveBeenCalled()
      } else {
        expect(harness.calls.saveAuditEnvelope).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'content.preview_token_issued',
            operatorId: 'operator_a',
            resourceType: 'site_content',
            resourceId: input.resourceId,
            details: {
              siteId: 'site_a',
              contentType: input.resourceType,
              contentId: input.resourceId,
              locale: 'en-US',
              expiresAt: '2026-07-22T08:15:00.000Z'
            }
          })
        )
        const auditInput = JSON.stringify(harness.calls.saveAuditEnvelope.mock.calls[0][0])
        expect(auditInput).not.toContain('oes_preview_v1')
        expect(auditInput).not.toContain('preview.local')
        expect(auditInput).not.toContain(PREVIEW_SECRET)
        expect(signer.mock.invocationCallOrder[0]).toBeLessThan(
          harness.calls.saveAuditEnvelope.mock.invocationCallOrder[0]
        )
      }
    }
  )
})

// Verifies Runtime preview lookup remains bound to the signed Site and exact token resource tuple.
describe('Site Runtime preview resource ownership', () => {
  it.each(['draft', 'disabled'] as const)(
    'returns typed SITE_DISABLED for a signed %s Site before token or draft lookup',
    async (siteStatus) => {
      const harness = createRuntimeHarness()
      harness.calls.findCredentialForVerification.mockResolvedValue({
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'credential_a',
        clientSecret: 'client_secret_a',
        scopes: ['site:preview'],
        status: 'active',
        siteStatus
      })
      const tokenValidator = jest.spyOn(previewToken, 'validatePreviewToken')

      try {
        const error = await harness.application
          .getPreviewView({
            signedContext: signedPreviewContext(`nonce_site_${siteStatus}`),
            previewToken: boundPreviewToken('blog', 'content_a'),
            resourceType: 'blog',
            resourceId: 'content_a',
            locale: 'en-US'
          })
          .catch((caught: unknown) => caught)

        expectTypedPreviewError(error, 'SITE_DISABLED', status.PERMISSION_DENIED)
        expect(harness.calls.rememberCredentialNonce).toHaveBeenCalledTimes(1)
        expect(tokenValidator).not.toHaveBeenCalled()
        expect(harness.calls.getPreviewContentVersionForPublicView).not.toHaveBeenCalled()
      } finally {
        tokenValidator.mockRestore()
      }
    }
  )

  it.each([
    {
      tokenCase: 'invalid',
      previewToken: 'not-a-preview-token',
      resourceId: 'content_a',
      expectedCode: 'TOKEN_INVALID',
      expectedStatus: status.UNAUTHENTICATED
    },
    {
      tokenCase: 'expired',
      previewToken: previewToken.issuePreviewToken({
        secret: PREVIEW_SECRET,
        now: new Date(NOW.getTime() - 16 * 60 * 1000),
        siteId: 'site_a',
        resourceType: 'blog',
        resourceId: 'content_a',
        locale: 'en-US',
        operatorId: 'operator_a'
      }).token,
      resourceId: 'content_a',
      expectedCode: 'TOKEN_EXPIRED',
      expectedStatus: status.UNAUTHENTICATED
    },
    {
      tokenCase: 'resource mismatch',
      previewToken: boundPreviewToken('blog', 'content_other'),
      resourceId: 'content_a',
      expectedCode: 'TOKEN_RESOURCE_MISMATCH',
      expectedStatus: status.PERMISSION_DENIED
    }
  ])('returns a typed $tokenCase preview token error before draft lookup', async (input) => {
    const harness = createRuntimeHarness()

    const error = await harness.application
      .getPreviewView({
        signedContext: signedPreviewContext(`nonce_token_${input.tokenCase.replaceAll(' ', '_')}`),
        previewToken: input.previewToken,
        resourceType: 'blog',
        resourceId: input.resourceId,
        locale: 'en-US'
      })
      .catch((caught: unknown) => caught)

    expectTypedPreviewError(error, input.expectedCode, input.expectedStatus)
    expect(harness.calls.getPreviewContentVersionForPublicView).not.toHaveBeenCalled()
  })

  it('fails closed when a Site A token names a Site B Blog id', async () => {
    const harness = createRuntimeHarness()
    harness.calls.getContentVersionForPublicView.mockResolvedValue(
      previewContent('content_b', 'blog')
    )
    harness.calls.getPreviewContentVersionForPublicView.mockResolvedValue(null)

    const error = await harness.application
      .getPreviewView({
        signedContext: signedPreviewContext('nonce_cross_site'),
        previewToken: boundPreviewToken('blog', 'content_b'),
        resourceType: 'blog',
        resourceId: 'content_b',
        locale: 'en-US'
      })
      .catch((caught: unknown) => caught)

    expectTypedPreviewError(error, 'DRAFT_NOT_FOUND', status.NOT_FOUND)
    expect(harness.calls.getPreviewContentVersionForPublicView).toHaveBeenCalledWith({
      siteId: 'site_a',
      resourceType: 'blog',
      contentId: 'content_b',
      locale: 'en-US'
    })
    expect(harness.calls.getContentVersionForPublicView).not.toHaveBeenCalled()
  })

  it('fails closed when a Blog token names a saved News entry', async () => {
    const harness = createRuntimeHarness()
    harness.calls.getContentVersionForPublicView.mockResolvedValue(
      previewContent('content_news', 'news')
    )
    harness.calls.getPreviewContentVersionForPublicView.mockResolvedValue(null)

    const error = await harness.application
      .getPreviewView({
        signedContext: signedPreviewContext('nonce_wrong_type'),
        previewToken: boundPreviewToken('blog', 'content_news'),
        resourceType: 'blog',
        resourceId: 'content_news',
        locale: 'en-US'
      })
      .catch((caught: unknown) => caught)

    expectTypedPreviewError(error, 'DRAFT_NOT_FOUND', status.NOT_FOUND)
    expect(harness.calls.getPreviewContentVersionForPublicView).toHaveBeenCalledWith({
      siteId: 'site_a',
      resourceType: 'blog',
      contentId: 'content_news',
      locale: 'en-US'
    })
    expect(harness.calls.getContentVersionForPublicView).not.toHaveBeenCalled()
  })

  it('returns typed DRAFT_NOT_FOUND when the exact saved locale draft is missing', async () => {
    const harness = createRuntimeHarness()
    harness.calls.getPreviewContentVersionForPublicView.mockResolvedValue(null)

    const error = await harness.application
      .getPreviewView({
        signedContext: signedPreviewContext('nonce_missing_draft'),
        previewToken: boundPreviewToken('blog', 'content_missing'),
        resourceType: 'blog',
        resourceId: 'content_missing',
        locale: 'en-US'
      })
      .catch((caught: unknown) => caught)

    expectTypedPreviewError(error, 'DRAFT_NOT_FOUND', status.NOT_FOUND)
  })

  it('keeps Product preview lookup scoped by verified Site, product id, and locale', async () => {
    const harness = createRuntimeHarness()
    harness.calls.getProductPublicationForPublicView.mockResolvedValue({
      productId: 'product_a',
      locale: 'en-US',
      slug: 'product-a',
      displayTitle: 'Product A',
      displayDescription: 'Product A draft',
      seoTitle: 'Product A',
      seoDescription: 'Product A draft',
      seoImage: null,
      imageOverride: null,
      publishStatus: 'draft'
    })

    await expect(
      harness.application.getPreviewView({
        signedContext: signedPreviewContext('nonce_product'),
        previewToken: boundPreviewToken('product', 'product_a'),
        resourceType: 'product',
        resourceId: 'product_a',
        locale: 'en-US'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        previewView: expect.objectContaining({
          siteId: 'site_a',
          resourceType: 'product',
          resourceId: 'product_a',
          status: 'draft_preview',
          publishVersion: 0
        }),
        noindex: true,
        cachePolicy: 'no-store'
      })
    )

    expect(harness.calls.getProductPublicationForPublicView).toHaveBeenCalledWith({
      siteId: 'site_a',
      productId: 'product_a',
      locale: 'en-US'
    })
  })
})
