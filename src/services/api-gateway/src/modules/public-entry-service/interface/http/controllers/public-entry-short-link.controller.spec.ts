import 'reflect-metadata'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import {
  PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { PublicEntryShortLinkController } from './public-entry-short-link.controller'

// Verifies the public-entry ShortLink controller keeps public redirect and admin permissions aligned with contracts.
describe('PublicEntryShortLinkController', () => {
  const service = {
    changeStatus: jest.fn(),
    createShortLink: jest.fn(),
    generateQr: jest.fn(),
    getShortLink: jest.fn(),
    getStats: jest.fn(),
    listByTarget: jest.fn(),
    resolvePublicRedirect: jest.fn(),
    updateMetadata: jest.fn(),
    updateTarget: jest.fn()
  }
  const controller = new PublicEntryShortLinkController(service as never)
  const source = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: { aid: 'account-1', tid: 'tenant-1', scopeLevel: 'TENANT' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('marks only /c/:shortCode public and declares required admin permission metadata', () => {
    const reflector = new Reflector()

    expect(reflector.get(IS_PUBLIC_KEY, PublicEntryShortLinkController.prototype.resolvePublicRedirect)).toBe(true)
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryShortLinkController.prototype.createShortLink)
    ).toEqual({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.CREATE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryShortLinkController.prototype.listByTarget)
    ).toEqual({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryShortLinkController.prototype.updateTarget)
    ).toEqual({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.UPDATE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryShortLinkController.prototype.changeStatus)
    ).toEqual({
      any: [
        PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.UPDATE,
        PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.DISABLE,
        PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.ARCHIVE
      ]
    })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryShortLinkController.prototype.getStats)
    ).toEqual({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.STATS_READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryShortLinkController.prototype.downloadQr)
    ).toEqual({ all: [PUBLIC_ENTRY_SHORT_LINK_PERMISSION_CODES.READ] })
  })

  it('maps public REDIRECT, NOT_FOUND, and unavailable outcomes into controlled HTTP responses', async () => {
    const redirectResponse = createResponseMock()
    service.resolvePublicRedirect.mockResolvedValueOnce({
      type: 'REDIRECT',
      location: 'https://example.com/card'
    })

    await controller.resolvePublicRedirect(
      'abc1234',
      {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '203.0.113.9, 10.0.0.1',
          'accept-language': 'zh-CN',
          referer: 'https://source.example',
          'x-request-id': 'req-public',
          'x-trace-id': 'trace-public'
        },
        ip: '10.0.0.2'
      } as never,
      redirectResponse as never
    )

    expect(service.resolvePublicRedirect).toHaveBeenCalledWith('abc1234', {
      userAgent: 'Mozilla/5.0',
      ipAddress: '203.0.113.9',
      acceptLanguage: 'zh-CN',
      referrer: 'https://source.example',
      requestId: 'req-public',
      traceId: 'trace-public'
    })
    expect(redirectResponse.redirect).toHaveBeenCalledWith(302, 'https://example.com/card')

    const missingResponse = createResponseMock()
    service.resolvePublicRedirect.mockResolvedValueOnce({ type: 'NOT_FOUND', location: '' })
    await controller.resolvePublicRedirect('missing', { headers: {}, ip: '10.0.0.2' } as never, missingResponse as never)
    expect(missingResponse.status).toHaveBeenCalledWith(404)
    expect(missingResponse.send.mock.calls[0][0]).toContain('链接不可用')
    expect(missingResponse.send.mock.calls[0][0]).not.toContain('tenant-1')

    const disabledResponse = createResponseMock()
    service.resolvePublicRedirect.mockResolvedValueOnce({ type: 'UNAVAILABLE', location: '' })
    await controller.resolvePublicRedirect('disabled', { headers: {}, ip: '10.0.0.2' } as never, disabledResponse as never)
    expect(disabledResponse.status).toHaveBeenCalledWith(200)
    expect(disabledResponse.send.mock.calls[0][0]).toContain('该链接当前不可用')
    expect(disabledResponse.send.mock.calls[0][0]).not.toContain('targetResourceId')
  })

  it('delegates tenant admin management endpoints to the BFF service', async () => {
    service.createShortLink.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    service.listByTarget.mockResolvedValue({ items: [] })
    service.getShortLink.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    service.updateTarget.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    service.updateMetadata.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    service.changeStatus.mockResolvedValue({ shortLink: { id: 'short-link-1' } })
    service.getStats.mockResolvedValue({ totalVisits: 1 })
    service.generateQr.mockResolvedValue({ imageBase64: Buffer.from('png').toString('base64') })

    await controller.createShortLink('tenant-1', { displayName: 'Link' } as never, source as never)
    await controller.listByTarget('tenant-1', { targetType: 'BUSINESS_CARD' }, source as never)
    await controller.getShortLink('tenant-1', 'short-link-1', source as never)
    await controller.updateTarget('tenant-1', 'short-link-1', { reason: 'migrate' } as never, source as never)
    await controller.updateMetadata('tenant-1', 'short-link-1', { displayName: 'New' } as never, source as never)
    await controller.changeStatus('tenant-1', 'short-link-1', { targetStatus: 'DISABLED' } as never, source as never)
    await controller.getStats('tenant-1', 'short-link-1', { from: '2026-07-01T00:00:00.000Z' }, source as never)
    await controller.getQr('tenant-1', 'short-link-1', source as never)

    const downloadResponse = createResponseMock()
    await controller.downloadQr('tenant-1', 'short-link-1', source as never, downloadResponse as never)

    expect(service.createShortLink).toHaveBeenCalledWith('tenant-1', { displayName: 'Link' }, source)
    expect(service.listByTarget).toHaveBeenCalledWith('tenant-1', { targetType: 'BUSINESS_CARD' }, source)
    expect(service.getShortLink).toHaveBeenCalledWith('tenant-1', 'short-link-1', source)
    expect(service.updateTarget).toHaveBeenCalledWith('tenant-1', 'short-link-1', { reason: 'migrate' }, source)
    expect(service.updateMetadata).toHaveBeenCalledWith('tenant-1', 'short-link-1', { displayName: 'New' }, source)
    expect(service.changeStatus).toHaveBeenCalledWith('tenant-1', 'short-link-1', { targetStatus: 'DISABLED' }, source)
    expect(service.getStats).toHaveBeenCalledWith(
      'tenant-1',
      'short-link-1',
      { from: '2026-07-01T00:00:00.000Z' },
      source
    )
    expect(service.generateQr).toHaveBeenCalledWith('tenant-1', 'short-link-1', source)
    expect(downloadResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png')
    expect(downloadResponse.send).toHaveBeenCalledWith(Buffer.from('png'))
  })
})

// createResponseMock provides the chainable Express response surface used by the controller.
function createResponseMock() {
  const response = {
    redirect: jest.fn(),
    send: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn(),
    type: jest.fn()
  }
  response.status.mockReturnValue(response)
  response.type.mockReturnValue(response)
  response.setHeader.mockReturnValue(response)
  response.send.mockReturnValue(response)
  response.redirect.mockReturnValue(response)
  return response
}
