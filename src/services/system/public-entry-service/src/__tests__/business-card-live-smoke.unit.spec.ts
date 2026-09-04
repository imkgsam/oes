import {
  BusinessCardStatus,
  ContactActionTargetRefType,
  PublicRedirectResultType,
  ShortLinkStatus
} from '@oes/common/generated/public_entry_service'
import {
  BusinessCardLiveSmokeClient,
  buildBusinessCardLiveSmokeInputFromEnv,
  runBusinessCardLiveSmokeFlow
} from '../../scripts/business-card-live-smoke'
import { createPublicEntryBusinessCardLiveSmokeClient } from '../../scripts/business-card-live-smoke'

// Verifies the live smoke orchestrates the real BusinessCard gRPC contract without accepting arbitrary self-view targets.
describe('BusinessCard live smoke flow', () => {
  it('drives the full Phase 1 flow through the public-entry-service BusinessCard and ShortLink gRPC clients', async () => {
    const calls: string[] = []
    const client: BusinessCardLiveSmokeClient = {
      ensurePrimaryBusinessCard: jest.fn(async (request) => {
        calls.push('ensurePrimaryBusinessCard')
        expect(request.employeeId).toBe('employee-1')
        return {
          businessCard: {
            businessCardId: 'card-1',
            tenantId: 'tenant-1',
            employeeId: 'employee-1',
            status: BusinessCardStatus.BUSINESS_CARD_STATUS_DRAFT,
            templateKey: 'classic'
          }
        }
      }),
      updateBusinessCardContactActions: jest.fn(async (request) => {
        calls.push('updateBusinessCardContactActions')
        expect(request.businessCardId).toBe('card-1')
        expect(request.contactActionConfigs).toEqual([
          expect.objectContaining({
            contactActionType: 'SEND_EMAIL',
            targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_CONTACT_ASSET,
            targetRefId: 'contact-email-1',
            enabled: true,
            includeInVCard: true
          }),
          expect.objectContaining({
            contactActionType: 'SAVE_VCARD',
            targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE,
            targetRefId: '',
            enabled: true
          })
        ])
        return { businessCard: { businessCardId: 'card-1' } }
      }),
      bindOrRefreshBusinessCardPublicEntry: jest.fn(async (request) => {
        calls.push('bindOrRefreshBusinessCardPublicEntry')
        expect(request.businessCardId).toBe('card-1')
        return {
          publicEntryRef: {
            publicEntryId: 'short-link-1',
            shortCode: 'abc123',
            publicUrl: 'https://public.example.test/s/abc123',
            qrContent: 'https://public.example.test/s/abc123',
            status: ShortLinkStatus.SHORT_LINK_STATUS_ACTIVE
          }
        }
      }),
      enableBusinessCard: jest.fn(async (request) => {
        calls.push('enableBusinessCard')
        expect(request.businessCardId).toBe('card-1')
        return {
          businessCardId: 'card-1',
          previousStatus: BusinessCardStatus.BUSINESS_CARD_STATUS_DRAFT,
          status: BusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE
        }
      }),
      getBusinessCardDetail: jest.fn(async (request) => {
        calls.push('getBusinessCardDetail')
        expect(request.businessCardId).toBe('card-1')
        return {
          businessCard: {
            businessCardId: 'card-1',
            tenantId: 'tenant-1',
            employeeId: 'employee-1',
            status: BusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE,
            publicEntryRef: {
              publicEntryId: 'short-link-1',
              shortCode: 'abc123',
              publicUrl: 'https://public.example.test/s/abc123',
              qrContent: 'https://public.example.test/s/abc123',
              status: ShortLinkStatus.SHORT_LINK_STATUS_ACTIVE
            }
          },
          readiness: { ready: true, reasons: [] }
        }
      }),
      runBusinessCardReadinessCheck: jest.fn(async (request) => {
        calls.push('runBusinessCardReadinessCheck')
        expect(request.businessCardId).toBe('card-1')
        return { ready: true, reasons: [] }
      }),
      renderPublicBusinessCard: jest.fn(async (request) => {
        calls.push('renderPublicBusinessCard')
        expect(request.businessCardId).toBe('card-1')
        return {
          state: 'AVAILABLE',
          view: {
            businessCardId: 'card-1',
            publicUrl: 'https://public.example.test/s/abc123',
            person: {
              displayName: 'Alex Chen',
              officialPhotoUrl: 'https://hr.example.test/official-photo.webp'
            },
            company: { companyDisplayName: 'OES Manufacturing' },
            contactActions: [
              { contactActionType: 'SEND_EMAIL', actionUrl: 'mailto:alex@example.test' },
              { contactActionType: 'SAVE_VCARD', actionUrl: '/public/business-cards/card-1/card.vcf' }
            ]
          }
        }
      }),
      generateBusinessCardVCard: jest.fn(async (request) => {
        calls.push('generateBusinessCardVCard')
        expect(request.businessCardId).toBe('card-1')
        return { contentType: 'text/vcard; charset=utf-8', body: 'BEGIN:VCARD\nEND:VCARD' }
      }),
      getOwnBusinessCardPreview: jest.fn(async (request) => {
        calls.push('getOwnBusinessCardPreview')
        expect(request).toEqual({})
        return {
          businessCardId: 'card-1',
          employeeId: 'employee-1',
          status: BusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE,
          enabledActions: ['SEND_EMAIL', 'SAVE_VCARD'],
          preview: { state: 'AVAILABLE' }
        }
      }),
      resolvePublicRedirect: jest.fn(async (request) => {
        calls.push('resolvePublicRedirect')
        expect(request.shortCode).toBe('abc123')
        return {
          resultType: PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT,
          location: 'https://app.example.test/public/business-cards/card-1'
        }
      }),
      getBusinessCardVisitSummary: jest.fn(async (request) => {
        calls.push('getBusinessCardVisitSummary')
        expect(request.businessCardId).toBe('card-1')
        return { shortLinkId: 'short-link-1', totalVisits: 1 }
      }),
      close: jest.fn(async () => {
        calls.push('close')
      })
    }

    const report = await runBusinessCardLiveSmokeFlow({
      client,
      input: {
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        accountAvatarUrl: 'https://identity.example.test/account-avatar.webp',
        hrOfficialPhotoUrl: 'https://hr.example.test/official-photo.webp',
        operatorAccountId: 'operator-1',
        selfAccountId: 'self-account-1',
        workEmailContactAssetId: 'contact-email-1',
        traceId: 'business-card-live-smoke-test'
      }
    })

    expect(report.ready).toBe(true)
    expect(report.businessCardId).toBe('card-1')
    expect(report.shortCode).toBe('abc123')
    expect(report.publicRenderState).toBe('AVAILABLE')
    expect(report.publicRenderOfficialPhotoUrl).toBe('https://hr.example.test/official-photo.webp')
    expect(report.publicRenderOfficialPhotoUrl).not.toBe('https://identity.example.test/account-avatar.webp')
    expect(report.selfPreviewState).toBe('AVAILABLE')
    expect(report.vCardContentType).toBe('text/vcard; charset=utf-8')
    expect(report.visitTotal).toBe(1)
    expect(calls).toEqual([
      'ensurePrimaryBusinessCard',
      'updateBusinessCardContactActions',
      'bindOrRefreshBusinessCardPublicEntry',
      'enableBusinessCard',
      'getBusinessCardDetail',
      'runBusinessCardReadinessCheck',
      'renderPublicBusinessCard',
      'generateBusinessCardVCard',
      'getOwnBusinessCardPreview',
      'resolvePublicRedirect',
      'getBusinessCardVisitSummary',
      'close'
    ])
  })

  it('requires explicit fixture env for the live chain', () => {
    expect(() => buildBusinessCardLiveSmokeInputFromEnv({})).toThrow(
      'BUSINESS_CARD_LIVE_TENANT_ID is required'
    )
  })

  it('keeps an explicit empty HR official photo expectation from env', () => {
    const input = buildBusinessCardLiveSmokeInputFromEnv({
      BUSINESS_CARD_LIVE_TENANT_ID: 'tenant-1',
      BUSINESS_CARD_LIVE_EMPLOYEE_ID: 'employee-1',
      BUSINESS_CARD_LIVE_HR_OFFICIAL_PHOTO_URL: '',
      BUSINESS_CARD_LIVE_OPERATOR_ACCOUNT_ID: 'operator-1',
      BUSINESS_CARD_LIVE_SELF_ACCOUNT_ID: 'self-account-1',
      BUSINESS_CARD_LIVE_WORK_EMAIL_CONTACT_ASSET_ID: 'contact-email-1'
    })

    expect(input.hrOfficialPhotoUrl).toBe('')
  })

  it('keeps Gateway redirects manual and sends the same W3C trace headers', async () => {
    const saved = { traceparent: process.env.BUSINESS_CARD_LIVE_TRACEPARENT, tracestate: process.env.BUSINESS_CARD_LIVE_TRACESTATE }
    process.env.BUSINESS_CARD_LIVE_TRACEPARENT = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
    process.env.BUSINESS_CARD_LIVE_TRACESTATE = 'vendor=value'
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 302, headers: new Headers({ location: '/public/card' }) } as Response)
    try {
      const client = createPublicEntryBusinessCardLiveSmokeClient('http://gateway.test')
      await expect(client.resolvePublicRedirect({ shortCode: 'abc' })).resolves.toEqual({ resultType: PublicRedirectResultType.PUBLIC_REDIRECT_RESULT_TYPE_REDIRECT, location: '/public/card' })
      expect(fetchMock).toHaveBeenCalledWith('http://gateway.test/c/abc', expect.objectContaining({ redirect: 'manual', headers: expect.any(Headers) }))
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers
      expect(headers.get('traceparent')).toBe(process.env.BUSINESS_CARD_LIVE_TRACEPARENT)
      expect(headers.get('tracestate')).toBe('vendor=value')
    } finally {
      fetchMock.mockRestore()
      if (saved.traceparent === undefined) delete process.env.BUSINESS_CARD_LIVE_TRACEPARENT; else process.env.BUSINESS_CARD_LIVE_TRACEPARENT = saved.traceparent
      if (saved.tracestate === undefined) delete process.env.BUSINESS_CARD_LIVE_TRACESTATE; else process.env.BUSINESS_CARD_LIVE_TRACESTATE = saved.tracestate
    }
  })
})
