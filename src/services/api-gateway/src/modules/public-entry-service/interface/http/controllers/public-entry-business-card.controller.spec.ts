import 'reflect-metadata'
import { PATH_METADATA } from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import {
  PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { PublicEntryBusinessCardController } from './public-entry-business-card.controller'

// Verifies BusinessCard BFF endpoints keep admin permissions and public routes aligned with contracts.
describe('PublicEntryBusinessCardController', () => {
  const service = {
    bindPublicEntry: jest.fn(),
    disableCard: jest.fn(),
    enableCard: jest.fn(),
    ensurePrimaryCard: jest.fn(),
    generateVCard: jest.fn(),
    getCardDetail: jest.fn(),
    getOwnPreview: jest.fn(),
    getVisitSummary: jest.fn(),
    listCards: jest.fn(),
    renderPublicCard: jest.fn(),
    updateConfig: jest.fn(),
    updateContactActions: jest.fn()
  }
  const controller = new PublicEntryBusinessCardController(service as never)
  const source = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: { aid: 'account-1', tid: 'tenant-1', scopeLevel: 'TENANT' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares admin permission metadata while keeping self-view RBAC-free and public render anonymous', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.ensurePrimaryCard)
    ).toEqual({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.MANAGE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.listCards)
    ).toEqual({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.updateConfig)
    ).toEqual({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.MANAGE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.enableCard)
    ).toEqual({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.ENABLE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.disableCard)
    ).toEqual({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.DISABLE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.bindPublicEntry)
    ).toEqual({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.PUBLIC_ENTRY_MANAGE] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.getVisitSummary)
    ).toEqual({ all: [PUBLIC_ENTRY_BUSINESS_CARD_PERMISSION_CODES.STATS_READ] })
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, PublicEntryBusinessCardController.prototype.getOwnPreview)
    ).toBeUndefined()
    expect(
      reflector.get(IS_PUBLIC_KEY, PublicEntryBusinessCardController.prototype.renderPublicCard)
    ).toBe(true)
    expect(
      reflector.get(IS_PUBLIC_KEY, PublicEntryBusinessCardController.prototype.downloadVCard)
    ).toBe(true)
  })

  it('exposes contract-aligned public render and vCard paths with a compatibility vCard alias', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PublicEntryBusinessCardController.prototype.renderPublicCard)).toBe(
      'public-entry/public/business-cards/:businessCardId'
    )
    expect(Reflect.getMetadata(PATH_METADATA, PublicEntryBusinessCardController.prototype.downloadVCard)).toEqual([
      'public-entry/public/business-cards/:businessCardId.vcf',
      'public-entry/public/business-cards/:businessCardId/vcard.vcf'
    ])
  })

  it('delegates tenant admin, employee self-view, public render, and vCard endpoints to the BFF service', async () => {
    service.ensurePrimaryCard.mockResolvedValue({ businessCard: { businessCardId: 'card-1' } })
    service.listCards.mockResolvedValue({ items: [] })
    service.getCardDetail.mockResolvedValue({ businessCard: { businessCardId: 'card-1' } })
    service.updateConfig.mockResolvedValue({ businessCard: { businessCardId: 'card-1' } })
    service.updateContactActions.mockResolvedValue({ businessCard: { businessCardId: 'card-1' } })
    service.enableCard.mockResolvedValue({ status: 'ACTIVE' })
    service.disableCard.mockResolvedValue({ status: 'DISABLED' })
    service.bindPublicEntry.mockResolvedValue({ publicEntryRef: { publicUrl: '/c/abc1234' } })
    service.getVisitSummary.mockResolvedValue({ totalVisits: 3 })
    service.getOwnPreview.mockResolvedValue({ businessCardId: 'card-1' })
    service.renderPublicCard.mockResolvedValue({ state: 'AVAILABLE' })
    service.generateVCard.mockResolvedValue({ contentType: 'text/vcard', body: 'BEGIN:VCARD\r\nEND:VCARD\r\n' })

    await controller.ensurePrimaryCard('tenant-1', { employeeId: 'emp-1' }, source as never)
    await controller.listCards('tenant-1', { page: '1', pageSize: '20' }, source as never)
    await controller.getCardDetail('tenant-1', 'card-1', source as never)
    await controller.updateConfig('tenant-1', 'card-1', { templateKey: 'tenant-standard' }, source as never)
    await controller.updateContactActions(
      'tenant-1',
      'card-1',
      { contactActionConfigs: [], visibilityConfig: undefined },
      source as never
    )
    await controller.enableCard('tenant-1', 'card-1', source as never)
    await controller.disableCard('tenant-1', 'card-1', source as never)
    await controller.bindPublicEntry('tenant-1', 'card-1', source as never)
    await controller.getVisitSummary('tenant-1', 'card-1', { from: '2026-06-08T00:00:00.000Z' }, source as never)
    await controller.getOwnPreview('tenant-1', source as never)
    await controller.renderPublicCard('card-1', source as never)

    const response = createResponseMock()
    await controller.downloadVCard('card-1', source as never, response as never)

    expect(service.ensurePrimaryCard).toHaveBeenCalledWith('tenant-1', { employeeId: 'emp-1' }, source)
    expect(service.listCards).toHaveBeenCalledWith('tenant-1', { page: '1', pageSize: '20' }, source)
    expect(service.getCardDetail).toHaveBeenCalledWith('tenant-1', 'card-1', source)
    expect(service.updateConfig).toHaveBeenCalledWith('tenant-1', 'card-1', { templateKey: 'tenant-standard' }, source)
    expect(service.updateContactActions).toHaveBeenCalledWith(
      'tenant-1',
      'card-1',
      { contactActionConfigs: [], visibilityConfig: undefined },
      source
    )
    expect(service.enableCard).toHaveBeenCalledWith('tenant-1', 'card-1', source)
    expect(service.disableCard).toHaveBeenCalledWith('tenant-1', 'card-1', source)
    expect(service.bindPublicEntry).toHaveBeenCalledWith('tenant-1', 'card-1', source)
    expect(service.getVisitSummary).toHaveBeenCalledWith(
      'tenant-1',
      'card-1',
      { from: '2026-06-08T00:00:00.000Z' },
      source
    )
    expect(service.getOwnPreview).toHaveBeenCalledWith('tenant-1', source)
    expect(service.renderPublicCard).toHaveBeenCalledWith('card-1', source)
    expect(service.generateVCard).toHaveBeenCalledWith('card-1', source)
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/vcard')
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="business-card-card-1.vcf"'
    )
    expect(response.send).toHaveBeenCalledWith('BEGIN:VCARD\r\nEND:VCARD\r\n')
  })
})

// createResponseMock provides the chainable Express response surface used by vCard download.
function createResponseMock() {
  const response = {
    send: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn()
  }
  response.status.mockReturnValue(response)
  response.setHeader.mockReturnValue(response)
  response.send.mockReturnValue(response)
  return response
}
