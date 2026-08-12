import { ContactActionTargetRefType } from '@oes/common/generated/public_entry_service'
import { PublicEntryBusinessCardService } from './public-entry-business-card.service'

// Verifies the BusinessCard BFF service preserves tenant, operator, self-view, and public render boundaries.
describe('PublicEntryBusinessCardService', () => {
  const adapter = {
    bindOrRefreshBusinessCardPublicEntry: jest.fn(),
    disableBusinessCard: jest.fn(),
    enableBusinessCard: jest.fn(),
    ensurePrimaryBusinessCard: jest.fn(),
    generateBusinessCardVCard: jest.fn(),
    getBusinessCardDetail: jest.fn(),
    getBusinessCardVisitSummary: jest.fn(),
    getOwnBusinessCardPreview: jest.fn(),
    listBusinessCards: jest.fn(),
    renderPublicBusinessCard: jest.fn(),
    updateBusinessCardConfig: jest.fn(),
    updateBusinessCardContactActions: jest.fn()
  }
  const contactAssetAdapter = {
    listContactAssetCandidatesByEmployee: jest.fn()
  }
  const service = new PublicEntryBusinessCardService(adapter as never, contactAssetAdapter as never)
  const source = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: {
      aid: 'account-1',
      orgId: 'org-1',
      scopeLevel: 'TENANT',
      tid: 'tenant-1'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('derives employee self-view from authenticated account context without employee or card ids', async () => {
    adapter.getOwnBusinessCardPreview.mockResolvedValue({ businessCardId: 'card-1' })

    await expect(service.getOwnPreview('tenant-1', source as never)).resolves.toEqual({
      businessCardId: 'card-1'
    })

    expect(adapter.getOwnBusinessCardPreview).toHaveBeenCalledWith(
      {},
      source
    )
    expect(JSON.stringify(adapter.getOwnBusinessCardPreview.mock.calls)).not.toContain('employeeId')
    expect(JSON.stringify(adapter.getOwnBusinessCardPreview.mock.calls)).not.toContain('businessCardId')
  })

  it('maps admin contact action references without contact values', async () => {
    adapter.updateBusinessCardContactActions.mockResolvedValue({ businessCard: { businessCardId: 'card-1' } })

    await service.updateContactActions(
      'tenant-1',
      'card-1',
      {
        contactActionConfigs: [
          {
            contactActionType: 'SEND_EMAIL',
            displayOrder: 10,
            enabled: true,
            includeInVCard: true,
            targetRefId: 'asset-email-1',
            targetRefType: 'CONTACT_ASSET',
            visibility: 'PUBLIC'
          },
          {
            contactActionType: 'SAVE_VCARD',
            displayOrder: 20,
            enabled: true,
            includeInVCard: false,
            targetRefId: null,
            targetRefType: 'NONE',
            visibility: 'PUBLIC'
          }
        ]
      },
      source as never
    )

    expect(adapter.updateBusinessCardContactActions).toHaveBeenCalledWith(
      {
        businessCardId: 'card-1',
        contactActionConfigs: [
          expect.objectContaining({
            targetRefId: 'asset-email-1',
            targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_CONTACT_ASSET
          }),
          expect.objectContaining({
            targetRefId: null,
            targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE
          })
        ],
        visibilityConfig: undefined
      },
      source
    )
    expect(JSON.stringify(adapter.updateBusinessCardContactActions.mock.calls)).not.toContain('alex.chen@example.com')
  })

  it('normalizes BusinessCard contact action target ref enums before returning BFF responses', async () => {
    adapter.getBusinessCardDetail.mockResolvedValue({
      businessCard: {
        businessCardId: 'card-1',
        contactActionConfigs: [
          {
            contactActionType: 'SEND_EMAIL',
            targetRefId: 'asset-email-1',
            targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_CONTACT_ASSET
          },
          {
            contactActionType: 'SAVE_VCARD',
            targetRefId: '',
            targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_NONE
          }
        ]
      }
    })

    await expect(service.getCardDetail('tenant-1', 'card-1', source as never)).resolves.toEqual({
      businessCard: expect.objectContaining({
        contactActionConfigs: [
          expect.objectContaining({
            contactActionType: 'SEND_EMAIL',
            targetRefId: 'asset-email-1',
            targetRefType: 'CONTACT_ASSET'
          }),
          expect.objectContaining({
            contactActionType: 'SAVE_VCARD',
            targetRefId: '',
            targetRefType: 'NONE'
          })
        ]
      })
    })
  })

  it('lists Contact Asset candidates by employee without exposing login credentials', async () => {
    contactAssetAdapter.listContactAssetCandidatesByEmployee.mockResolvedValue({
      assets: [
        {
          contactAssetId: 'asset-whatsapp-1',
          type: 'WHATSAPP',
          displayLabel: 'Regional WhatsApp',
          displayValue: '+44 20 7946 0321',
          status: 'ACTIVE',
          ownership: 'COMPANY_CONTROLLED'
        }
      ]
    })

    await expect(
      service.listContactAssetCandidates('tenant-1', { employeeId: 'emp-1' }, source as never)
    ).resolves.toEqual({
      assets: [
        {
          contactAssetId: 'asset-whatsapp-1',
          type: 'WHATSAPP',
          displayLabel: 'Regional WhatsApp',
          displayValue: '+44 20 7946 0321',
          status: 'ACTIVE',
          ownership: 'COMPANY_CONTROLLED'
        }
      ]
    })

    expect(contactAssetAdapter.listContactAssetCandidatesByEmployee).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        traceId: 'trace-1'
      },
      source
    )
    expect(JSON.stringify(contactAssetAdapter.listContactAssetCandidatesByEmployee.mock.calls)).not.toContain('password')
    expect(JSON.stringify(contactAssetAdapter.listContactAssetCandidatesByEmployee.mock.calls)).not.toContain('otp')
  })

  it('keeps anonymous public render and vCard calls internal without tenant or operator context', async () => {
    adapter.renderPublicBusinessCard.mockResolvedValue({ state: 'PUBLIC_CARD_UNAVAILABLE' })
    adapter.generateBusinessCardVCard.mockResolvedValue({ body: 'BEGIN:VCARD\r\nEND:VCARD\r\n' })

    await service.renderPublicCard('card-1', source)
    await service.generateVCard('card-1', source)

    expect(adapter.renderPublicBusinessCard).toHaveBeenCalledWith(
      { businessCardId: 'card-1' },
      source
    )
    expect(adapter.generateBusinessCardVCard).toHaveBeenCalledWith(
      { businessCardId: 'card-1' },
      source
    )
    expect(JSON.stringify(adapter.renderPublicBusinessCard.mock.calls)).not.toContain('tenantId')
    expect(JSON.stringify(adapter.generateBusinessCardVCard.mock.calls)).not.toContain('operatorContext')
  })
})
