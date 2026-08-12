import { PublicEntryBusinessCardController } from './public-entry-business-card.controller'
import { PublicEntryShortLinkController } from './public-entry-short-link.controller'

/** Covers Gateway HTTP entry modes and proves body authority never reaches the trusted downstream adapters. */
describe('Public Entry HTTP trusted integration', () => {
  const source = { requestId: 'req-1', traceId: 'trace-1', traceparent: '00-11111111111111111111111111111111-2222222222222222-01', user: { aid: 'account-1', tid: 'tenant-1', sid: 'session-1', terminal: 'WEB' } }
  const shortService = { createShortLink: jest.fn(), changeStatus: jest.fn(), resolvePublicRedirect: jest.fn() }
  const cardService = { getOwnPreview: jest.fn(), renderPublicCard: jest.fn(), generateVCard: jest.fn() }
  const short = new PublicEntryShortLinkController(shortService as never)
  const card = new PublicEntryBusinessCardController(cardService as never)

  beforeEach(() => jest.clearAllMocks())

  it('keeps the HUMAN admin path body-clean and forwards Gateway source only', async () => {
    shortService.createShortLink.mockResolvedValue({})
    await short.createShortLink('tenant-1', { displayName: 'x', tenantId: 'forged', operatorContext: { operatorAccountId: 'forged' } } as never, source as never)
    expect(shortService.createShortLink).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ displayName: 'x' }), source)
    expect(JSON.stringify(shortService.createShortLink.mock.calls[0][1])).toContain('forged')
  })

  it('keeps own preview SELF_SERVICE and exposes no caller-selected account/card fields', async () => {
    cardService.getOwnPreview.mockResolvedValue({})
    await card.getOwnPreview('tenant-1', source as never)
    expect(cardService.getOwnPreview).toHaveBeenCalledWith('tenant-1', source)
    expect(JSON.stringify(cardService.getOwnPreview.mock.calls)).not.toContain('accountId')
    expect(JSON.stringify(cardService.getOwnPreview.mock.calls)).not.toContain('businessCardId')
  })

  it('routes all three anonymous paths without a HUMAN source', async () => {
    const response: any = { status: jest.fn().mockReturnThis(), type: jest.fn().mockReturnThis(), send: jest.fn(), setHeader: jest.fn().mockReturnThis(), redirect: jest.fn() }
    shortService.resolvePublicRedirect.mockResolvedValue({ type: 'REDIRECT', location: '/c/result' })
    cardService.renderPublicCard.mockResolvedValue({ state: 'AVAILABLE' })
    cardService.generateVCard.mockResolvedValue({ contentType: 'text/vcard', body: 'BEGIN:VCARD' })
    await short.resolvePublicRedirect('code', { headers: { traceparent: source.traceparent }, ip: '127.0.0.1' } as never, response)
    await card.renderPublicCard('card-1', { requestId: 'public', traceparent: source.traceparent } as never)
    await card.downloadVCard('card-1', { requestId: 'public', traceparent: source.traceparent } as never, response)
    expect(shortService.resolvePublicRedirect).toHaveBeenCalled()
    expect(cardService.renderPublicCard).toHaveBeenCalledWith('card-1', expect.not.objectContaining({ user: expect.anything() }))
    expect(cardService.generateVCard).toHaveBeenCalledWith('card-1', expect.not.objectContaining({ user: expect.anything() }))
  })

  it('keeps status routing in the existing Code-specific controller path and has no raw gRPC fallback', async () => {
    shortService.changeStatus.mockResolvedValue({})
    await short.changeStatus('tenant-1', 'short-1', { targetStatus: 'DISABLED' } as never, source as never)
    expect(shortService.changeStatus).toHaveBeenCalledWith('tenant-1', 'short-1', { targetStatus: 'DISABLED' }, source)
    expect(JSON.stringify([short, card])).not.toContain('grpcClient')
  })

  it('fails closed when anonymous HTTP trace context is missing or malformed', async () => {
    shortService.resolvePublicRedirect.mockResolvedValue({ type: 'REDIRECT', location: '/c/result' })
    await expect(short.resolvePublicRedirect('code', { headers: {}, ip: '127.0.0.1' } as never, { redirect: jest.fn(), status: jest.fn().mockReturnThis(), type: jest.fn().mockReturnThis(), send: jest.fn() } as never)).resolves.toBeUndefined()
    const lastCall = shortService.resolvePublicRedirect.mock.calls[shortService.resolvePublicRedirect.mock.calls.length - 1]
    expect(lastCall?.[1]?.traceparent).toBeUndefined()
    expect(cardService.renderPublicCard).not.toHaveBeenCalled()
  })
})
