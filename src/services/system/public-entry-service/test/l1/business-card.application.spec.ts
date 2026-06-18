import { BusinessCardApplicationService } from '../../src/application/services/business-card-application.service'
import { InMemoryBusinessCardRepository } from '../../src/infrastructure/repositories/in-memory-business-card.repository'
import { InMemoryShortLinkRepository } from '../../src/infrastructure/repositories/in-memory-short-link.repository'
import { ShortCodeGenerator } from '../../src/domain/services/short-code-generator'
import { ShortLinkTargetResolverRegistry } from '../../src/application/services/short-link-target-resolver.registry'
import { QrCodeService } from '../../src/application/services/qr-code.service'
import { PublicRedirectService } from '../../src/application/services/public-redirect.service'
import { ShortLinkApplicationService } from '../../src/application/services/short-link-application.service'
import {
  BusinessCardAuthorizationPort,
  BusinessCardContactAssetPort,
  BusinessCardEmployeePort,
  BusinessCardTenantProfilePort
} from '../../src/application/ports/business-card.ports'

const operatorContext = {
  operatorAccountId: 'acc_admin',
  operatorOrgId: 'org_001',
  traceId: 'trace_001'
}

const tenantId = 'tenant_001'
const employeeId = 'emp_001'

// buildService assembles BusinessCard with in-memory upstream ports for application behavior tests.
function buildService(overrides?: {
  employee?: Partial<BusinessCardEmployeePort>
  contactAsset?: Partial<BusinessCardContactAssetPort>
  tenantProfile?: Partial<BusinessCardTenantProfilePort>
  authorization?: Partial<BusinessCardAuthorizationPort>
}) {
  const cardRepository = new InMemoryBusinessCardRepository()
  const shortLinkRepository = new InMemoryShortLinkRepository()
  const resolverRegistry = new ShortLinkTargetResolverRegistry()
  const shortLinkService = new ShortLinkApplicationService(
    shortLinkRepository,
    new ShortCodeGenerator(() => 0),
    resolverRegistry,
    new QrCodeService()
  )
  const employees = new Map([
    [
      employeeId,
      {
        tenantId,
        employeeId,
        accountId: 'acc_employee',
        displayName: 'Alex Chen',
        englishName: 'Alex Chen',
        title: 'Sales Manager',
        department: 'Enterprise Sales',
        officialPhotoUrl: 'https://cdn.example.com/alex.jpg',
        status: 'ACTIVE' as const
      }
    ]
  ])
  const employeePort: BusinessCardEmployeePort = {
    getEmployeeSummary: jest.fn(async (input) => {
      const employee = employees.get(input.employeeId)
      return employee && employee.tenantId === input.tenantId ? employee : null
    }),
    getEmployeeByAccount: jest.fn(async (input) => {
      const employee = Array.from(employees.values()).find(
        (item) => item.tenantId === input.tenantId && item.accountId === input.accountId
      )
      return employee ?? null
    }),
    ...overrides?.employee
  }
  const contactAssetPort: BusinessCardContactAssetPort = {
    resolvePublicSafeValues: jest.fn(async (input) =>
      input.actionRefs
        .filter((ref) => ref.targetRefId !== 'missing_asset')
        .map((ref) => ({
          targetRefType: ref.targetRefType,
          targetRefId: ref.targetRefId,
          contactAssetKind:
            ref.contactActionType === 'SEND_EMAIL'
              ? ('WORK_EMAIL' as const)
              : ref.contactActionType === 'CALL_PHONE'
                ? ('WORK_PHONE' as const)
                : ref.contactActionType === 'ADD_WECHAT'
                  ? ('WECHAT' as const)
                  : ('WHATSAPP' as const),
          displayValue:
            ref.contactActionType === 'SEND_EMAIL'
              ? 'alex.chen@example.com'
              : ref.contactActionType === 'CALL_PHONE'
                ? '+1 555 0101'
                : ref.contactActionType === 'ADD_WECHAT'
                  ? 'alex-work'
                  : '+15550101',
          actionUrl:
            ref.contactActionType === 'SEND_EMAIL'
              ? 'mailto:alex.chen@example.com'
              : ref.contactActionType === 'CALL_PHONE'
                ? 'tel:+15550101'
                : ref.contactActionType === 'ADD_WECHAT'
                  ? 'weixin://dl/chat?alex-work'
                  : 'https://wa.me/15550101',
          available: true
        }))
    ),
    ...overrides?.contactAsset
  }
  const tenantProfilePort: BusinessCardTenantProfilePort = {
    getCompanyDisplaySummary: jest.fn(async () => ({
      tenantId,
      companyDisplayName: 'OES Manufacturing',
      websiteUrl: 'https://oes.example.com',
      logoUrl: 'https://cdn.example.com/logo.png'
    })),
    ...overrides?.tenantProfile
  }
  const authorizationPort: BusinessCardAuthorizationPort = {
    checkPermission: jest.fn(async () => true),
    buildQueryScope: jest.fn(async () => ({ tenantId })),
    checkResource: jest.fn(async () => true),
    ...overrides?.authorization
  }
  const service = new BusinessCardApplicationService(
    cardRepository,
    shortLinkService,
    employeePort,
    contactAssetPort,
    tenantProfilePort,
    authorizationPort
  )
  resolverRegistry.register('BUSINESS_CARD', service)
  const redirectService = new PublicRedirectService(shortLinkRepository, resolverRegistry)
  return { authorizationPort, cardRepository, redirectService, shortLinkRepository, service }
}

describe('BusinessCardApplicationService', () => {
  it('creates at most one primary BusinessCard per tenant employee', async () => {
    const { service } = buildService()

    const first = await service.ensurePrimaryCard({
      tenantId,
      employeeId,
      operatorContext
    })
    const second = await service.ensurePrimaryCard({
      tenantId,
      employeeId,
      operatorContext
    })

    expect(first.businessCard.businessCardId).toBe(second.businessCard.businessCardId)
    expect(first.businessCard.status).toBe('DRAFT')
    expect(first.businessCard.contactActionConfigs).toEqual([])
  })

  it('binds the main public entry through ShortLink without owning ShortLink lifecycle', async () => {
    const { service, shortLinkRepository } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })

    const result = await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    expect(result.publicEntryRef).toMatchObject({
      status: 'ACTIVE',
      publicUrl: expect.stringMatching(/^\/c\//),
      qrContent: expect.stringMatching(/^\/c\//)
    })
    expect(shortLinkRepository.shortLinks).toHaveLength(1)
    expect(shortLinkRepository.shortLinks[0]).toMatchObject({
      targetKind: 'INTERNAL_REF',
      targetType: 'BUSINESS_CARD',
      targetResourceId: created.businessCard.businessCardId
    })
  })

  it('requires readiness before enabling and audits state changes', async () => {
    const { cardRepository, service } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })

    await expect(
      service.enableCard({
        tenantId,
        businessCardId: created.businessCard.businessCardId,
        operatorContext
      })
    ).rejects.toThrow('BusinessCard is not ready')

    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    const enabled = await service.enableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    expect(enabled.status).toBe('ACTIVE')
    expect(cardRepository.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'ENABLE',
          operatorAccountId: operatorContext.operatorAccountId
        })
      ])
    )
  })

  it('uses the Phase 1 permission code for each admin operation', async () => {
    const { authorizationPort, service } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })
    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.enableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    jest.clearAllMocks()

    await service.listCards({ tenantId, operatorContext })
    await service.getCardDetail({ tenantId, businessCardId: created.businessCard.businessCardId, operatorContext })
    await service.updateCardConfig({ tenantId, businessCardId: created.businessCard.businessCardId, operatorContext })
    await service.updateContactActions({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext,
      contactActionConfigs: []
    })
    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.runReadinessCheck({ tenantId, businessCardId: created.businessCard.businessCardId, operatorContext })
    await service.getMainPublicEntrySummary({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.getVisitSummary({ tenantId, businessCardId: created.businessCard.businessCardId, operatorContext })
    await service.enableCard({ tenantId, businessCardId: created.businessCard.businessCardId, operatorContext })
    await service.disableCard({ tenantId, businessCardId: created.businessCard.businessCardId, operatorContext })

    expect(authorizationPort.buildQueryScope).toHaveBeenCalledWith({
      tenantId,
      permissionCode: 'public-entry.business-card.read',
      operatorContext
    })
    expect((authorizationPort.checkResource as jest.Mock).mock.calls.map(([input]) => input.permissionCode)).toEqual([
      'public-entry.business-card.read',
      'public-entry.business-card.read',
      'public-entry.business-card.manage',
      'public-entry.business-card.manage',
      'public-entry.business-card.public-entry.manage',
      'public-entry.business-card.read',
      'public-entry.business-card.read',
      'public-entry.business-card.stats.read',
      'public-entry.business-card.enable',
      'public-entry.business-card.disable'
    ])
  })

  it('rejects resource-denied admin commands before mutation', async () => {
    const deniedAuthorization = {
      checkResource: jest.fn(async () => false)
    }
    const { cardRepository, service } = buildService({ authorization: deniedAuthorization })
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })

    await expect(
      service.updateCardConfig({
        tenantId,
        businessCardId: created.businessCard.businessCardId,
        operatorContext,
        templateKey: 'OTHER_TEMPLATE'
      })
    ).rejects.toThrow('Permission denied')

    const stored = await cardRepository.getById(tenantId, created.businessCard.businessCardId)
    expect(stored?.templateKey).toBe('TENANT_STANDARD')
    expect(cardRepository.auditEvents.map((event) => event.action)).toEqual(['CREATE'])
  })

  it('renders public view by resolving upstream facts and hiding unavailable Contact Actions', async () => {
    const { service } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })
    await service.updateContactActions({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext,
      contactActionConfigs: [
        {
          contactActionType: 'CALL_PHONE',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: 'phone_001',
          visibility: 'PUBLIC',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true
        },
        {
          contactActionType: 'SEND_EMAIL',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: 'missing_asset',
          visibility: 'PUBLIC',
          displayOrder: 20,
          enabled: true,
          includeInVCard: true
        },
        {
          contactActionType: 'OPEN_COMPANY_WEBSITE',
          targetRefType: 'TENANT_PUBLIC_PROFILE',
          targetRefId: null,
          visibility: 'PUBLIC',
          displayOrder: 25,
          enabled: true,
          includeInVCard: false
        },
        {
          contactActionType: 'SAVE_VCARD',
          targetRefType: 'NONE',
          targetRefId: null,
          visibility: 'PUBLIC',
          displayOrder: 30,
          enabled: true,
          includeInVCard: false
        }
      ]
    })
    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.enableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    const publicView = await service.renderPublicCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId
    })

    expect(publicView.state).toBe('AVAILABLE')
    expect(publicView.view?.person.displayName).toBe('Alex Chen')
    expect(publicView.view?.company.companyDisplayName).toBe('OES Manufacturing')
    expect(publicView.view?.contactActions.map((action) => action.contactActionType)).toEqual([
      'CALL_PHONE',
      'OPEN_COMPANY_WEBSITE',
      'SAVE_VCARD'
    ])
    expect(publicView.view?.contactActions[1]).toMatchObject({
      actionUrl: 'https://oes.example.com',
      displayValue: 'OES Manufacturing'
    })
    expect(publicView.view?.contactActions[2]).toMatchObject({
      actionUrl: expect.stringContaining(`/public/business-cards/${created.businessCard.businessCardId}.vcf`)
    })
    expect(JSON.stringify(publicView.view)).not.toContain('missing_asset')
  })

  it('hides official photo from public render when visibility config disables it', async () => {
    const { service } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })
    await service.updateCardConfig({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext,
      visibilityConfig: {
        showTitle: true,
        showDepartment: true,
        showCompany: true,
        showOfficialPhoto: false
      }
    })
    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.enableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    const publicView = await service.renderPublicCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId
    })

    expect(publicView.state).toBe('AVAILABLE')
    expect(publicView.view?.person.officialPhotoUrl).toBeNull()
  })

  it('self-view is derived from the authenticated account and cannot target another employee', async () => {
    const { service } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })
    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    const selfView = await service.getOwnCardPreview({
      tenantId,
      accountId: 'acc_employee',
      traceId: 'trace_self'
    })

    expect(selfView.businessCardId).toBe(created.businessCard.businessCardId)
    expect(selfView.employeeId).toBe(employeeId)
    await expect(
      service.getOwnCardPreview({
        tenantId,
        accountId: 'acc_other',
        traceId: 'trace_self'
      })
    ).rejects.toThrow('Employee binding not found')
  })

  it('BusinessCard target resolver returns REDIRECT only for ready public cards', async () => {
    const { service } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })

    await expect(
      service.resolveTarget({
        tenantId,
        targetType: 'BUSINESS_CARD',
        targetResourceId: created.businessCard.businessCardId,
        requestContext: { traceId: 'trace_public' }
      })
    ).resolves.toMatchObject({ result: 'UNAVAILABLE' })

    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.enableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    await expect(
      service.resolveTarget({
        tenantId,
        targetType: 'BUSINESS_CARD',
        targetResourceId: created.businessCard.businessCardId,
        requestContext: { traceId: 'trace_public' }
      })
    ).resolves.toMatchObject({
      result: 'REDIRECT',
      redirectUrl: expect.stringContaining('/public/business-cards/')
    })
    await expect(
      service.resolveTarget({
        tenantId: 'tenant_002',
        targetType: 'BUSINESS_CARD',
        targetResourceId: created.businessCard.businessCardId,
        requestContext: { traceId: 'trace_public' }
      })
    ).resolves.toMatchObject({ result: 'NOT_FOUND' })
  })

  it('ShortLink public redirect returns unavailable and records INVALID_TARGET when BusinessCard becomes disabled', async () => {
    const { redirectService, service, shortLinkRepository } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })
    const publicEntry = await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.enableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.disableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    await expect(
      redirectService.resolveVisit({
        shortCode: publicEntry.publicEntryRef.shortCode,
        requestContext: {
          userAgent: 'Mozilla/5.0 iPhone',
          ipAddress: '203.0.113.20',
          acceptLanguage: 'en-US,en;q=0.9',
          traceId: 'trace_public_disabled'
        }
      })
    ).resolves.toEqual({ type: 'UNAVAILABLE' })

    expect(shortLinkRepository.visitEvents).toHaveLength(1)
    expect(shortLinkRepository.visitEvents[0]).toMatchObject({
      shortLinkId: publicEntry.publicEntryRef.publicEntryId,
      resultStatus: 'INVALID_TARGET',
      detectedChannel: 'BROWSER',
      deviceType: 'MOBILE',
      locale: 'en-US'
    })
  })

  it('vCard contains only currently visible public fields and actions', async () => {
    const { service } = buildService()
    const created = await service.ensurePrimaryCard({ tenantId, employeeId, operatorContext })
    await service.updateContactActions({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext,
      contactActionConfigs: [
        {
          contactActionType: 'CALL_PHONE',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: 'phone_001',
          visibility: 'PUBLIC',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true
        },
        {
          contactActionType: 'SEND_EMAIL',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: 'email_001',
          visibility: 'HIDDEN',
          displayOrder: 20,
          enabled: true,
          includeInVCard: true
        }
      ],
      visibilityConfig: {
        showTitle: true,
        showDepartment: false,
        showCompany: true,
        showOfficialPhoto: true
      }
    })
    await service.bindOrRefreshMainPublicEntry({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })
    await service.enableCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId,
      operatorContext
    })

    const vcard = await service.generateVCard({
      tenantId,
      businessCardId: created.businessCard.businessCardId
    })

    expect(vcard.contentType).toBe('text/vcard')
    expect(vcard.body).toContain('FN:Alex Chen')
    expect(vcard.body).toContain('TEL;TYPE=WORK:+1 555 0101')
    expect(vcard.body).not.toContain('alex.chen@example.com')
    expect(vcard.body).not.toContain('Enterprise Sales')
  })
})
