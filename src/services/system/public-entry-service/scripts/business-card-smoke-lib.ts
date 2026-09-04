import { ShortLinkApplicationService } from '../src/application/services/short-link-application.service'
import { ShortLinkTargetResolverRegistry } from '../src/application/services/short-link-target-resolver.registry'
import { QrCodeService } from '../src/application/services/qr-code.service'
import { BusinessCardApplicationService } from '../src/application/services/business-card-application.service'
import { PublicRedirectService } from '../src/application/services/public-redirect.service'
import {
  BusinessCardAuthorizationPort,
  BusinessCardContactAssetPort,
  BusinessCardEmployeePort,
  BusinessCardTenantProfilePort,
  ContactActionPublicSafeValue
} from '../src/application/ports/business-card.ports'
import { ShortCodeGenerator } from '../src/domain/services/short-code-generator'
import { PrismaService } from '../src/infrastructure/prisma/prisma.service'
import { PrismaBusinessCardRepository } from '../src/infrastructure/repositories/prisma-business-card.repository'
import { PrismaShortLinkRepository } from '../src/infrastructure/repositories/prisma-short-link.repository'

export type BusinessCardSmokeSeed = ReturnType<typeof createBusinessCardSmokeSeed>

export interface BusinessCardSmokePublicBoundary {
  readonly businessCardId: string
  readonly shortCode: string
  renderPublicCard(businessCardId?: string): Promise<any>
  resolveVisit(input: {
    shortCode?: string
    userAgent?: string
    ipAddress?: string
    acceptLanguage?: string
    referrer?: string
  }): Promise<any>
  generateVCard(businessCardId?: string): Promise<any>
}

// createBusinessCardSmokeSeed builds deterministic tenant, employee, and upstream values for one isolated smoke run.
export function createBusinessCardSmokeSeed(timestamp = Date.now()) {
  const suffix = String(timestamp)
  return {
    tenantId: `bc-smoke-tenant-${suffix}`,
    employeeId: `bc-smoke-employee-${suffix}`,
    accountId: `bc-smoke-account-${suffix}`,
    operatorContext: {
      operatorAccountId: `bc-smoke-operator-${suffix}`,
      operatorOrgId: `bc-smoke-org-${suffix}`,
      traceId: `bc-smoke-trace-${suffix}`
    },
    employee: {
      displayName: 'Alex Chen',
      englishName: 'Alex Chen',
      title: 'Sales Manager',
      department: 'Enterprise Sales',
      officialPhotoUrl: 'https://cdn.example.com/alex-smoke.jpg'
    },
    company: {
      companyDisplayName: 'OES Manufacturing',
      websiteUrl: 'https://oes.example.com',
      logoUrl: 'https://cdn.example.com/oes-logo.png'
    },
    contactAssets: {
      phoneAssetId: `bc-smoke-phone-${suffix}`,
      emailAssetId: `bc-smoke-email-${suffix}`,
      phone: '+1 (312) 847-1928',
      email: 'alex.chen@example.com'
    },
    publicRenderBaseUrl: 'https://app.oes.local'
  }
}

// runBusinessCardSmokeFlow executes the Phase 1 BusinessCard loop against the service-owned database.
export async function runBusinessCardSmokeFlow(
  seed: BusinessCardSmokeSeed,
  exercisePublicBoundary?: (boundary: BusinessCardSmokePublicBoundary) => Promise<void>
) {
  const previousRenderBaseUrl = process.env.PUBLIC_ENTRY_PUBLIC_RENDER_BASE_URL
  const prisma = new PrismaService()
  process.env.PUBLIC_ENTRY_PUBLIC_RENDER_BASE_URL = seed.publicRenderBaseUrl
  await prisma.$connect()

  try {
    await cleanupSmokeTenant(prisma, seed.tenantId)

    const shortLinkRepository = new PrismaShortLinkRepository(prisma)
    const businessCardRepository = new PrismaBusinessCardRepository(prisma)
    const registry = new ShortLinkTargetResolverRegistry()
    const shortLinkService = new ShortLinkApplicationService(
      shortLinkRepository,
      new ShortCodeGenerator(() => 0.314159),
      registry,
      new QrCodeService()
    )
    const businessCardService = new BusinessCardApplicationService(
      businessCardRepository,
      shortLinkService,
      createEmployeePort(seed),
      createContactAssetPort(seed),
      createTenantProfilePort(seed),
      createAuthorizationPort(seed)
    )
    registry.register('BUSINESS_CARD', businessCardService)
    const redirectService = new PublicRedirectService(shortLinkRepository, registry)

    const ensured = await businessCardService.ensurePrimaryCard({
      tenantId: seed.tenantId,
      employeeId: seed.employeeId,
      operatorContext: seed.operatorContext
    })
    await businessCardService.updateContactActions({
      tenantId: seed.tenantId,
      businessCardId: ensured.businessCard.businessCardId,
      operatorContext: seed.operatorContext,
      contactActionConfigs: [
        {
          contactActionType: 'CALL_PHONE',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: seed.contactAssets.phoneAssetId,
          visibility: 'PUBLIC',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true
        },
        {
          contactActionType: 'SEND_EMAIL',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: seed.contactAssets.emailAssetId,
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
          displayOrder: 30,
          enabled: true,
          includeInVCard: false
        },
        {
          contactActionType: 'SAVE_VCARD',
          targetRefType: 'NONE',
          targetRefId: null,
          visibility: 'PUBLIC',
          displayOrder: 40,
          enabled: true,
          includeInVCard: false
        }
      ]
    })
    await businessCardService.bindOrRefreshMainPublicEntry({
      tenantId: seed.tenantId,
      businessCardId: ensured.businessCard.businessCardId,
      operatorContext: seed.operatorContext
    })
    await businessCardService.enableCard({
      tenantId: seed.tenantId,
      businessCardId: ensured.businessCard.businessCardId,
      operatorContext: seed.operatorContext
    })

    const detail = await businessCardService.getCardDetail({
      tenantId: seed.tenantId,
      businessCardId: ensured.businessCard.businessCardId,
      operatorContext: seed.operatorContext
    })
    const shortCode = detail.businessCard.publicEntryRef?.shortCode
    if (!shortCode) throw new Error('BusinessCard smoke failed: public entry short code missing')

    const publicRender = await businessCardService.renderPublicCard({
      tenantId: seed.tenantId,
      businessCardId: ensured.businessCard.businessCardId,
      traceId: seed.operatorContext.traceId
    })
    const redirect = await redirectService.resolveVisit({
      shortCode,
      requestContext: {
        userAgent: 'Mozilla/5.0 BusinessCardSmoke',
        ipAddress: '203.0.113.88',
        acceptLanguage: 'en-US',
        referrer: 'https://example.com/source',
        traceId: seed.operatorContext.traceId
      }
    })
    const visitSummary = await businessCardService.getVisitSummary({
      tenantId: seed.tenantId,
      businessCardId: ensured.businessCard.businessCardId,
      operatorContext: seed.operatorContext
    })
    const vcard = await businessCardService.generateVCard({
      tenantId: seed.tenantId,
      businessCardId: ensured.businessCard.businessCardId,
      traceId: seed.operatorContext.traceId
    })
    const rawCard = await (prisma as any).businessCard.findUnique({
      where: { id: ensured.businessCard.businessCardId }
    })
    const auditRows = await (prisma as any).businessCardAuditLog.findMany({
      where: {
        tenantId: seed.tenantId,
        businessCardId: ensured.businessCard.businessCardId
      },
      orderBy: { createdAt: 'asc' }
    })

    await exercisePublicBoundary?.({
      businessCardId: ensured.businessCard.businessCardId,
      shortCode,
      renderPublicCard: (businessCardId = ensured.businessCard.businessCardId) =>
        businessCardService.renderPublicCard({
          tenantId: seed.tenantId,
          businessCardId,
          traceId: seed.operatorContext.traceId
        }),
      resolveVisit: (input) =>
        redirectService.resolveVisit({
          shortCode: input.shortCode ?? shortCode,
          requestContext: {
            userAgent: input.userAgent,
            ipAddress: input.ipAddress,
            acceptLanguage: input.acceptLanguage,
            referrer: input.referrer,
            traceId: seed.operatorContext.traceId
          }
        }),
      generateVCard: (businessCardId = ensured.businessCard.businessCardId) =>
        businessCardService.generateVCard({
          tenantId: seed.tenantId,
          businessCardId,
          traceId: seed.operatorContext.traceId
        })
    })

    return {
      businessCard: detail.businessCard,
      publicRender,
      redirect,
      visitSummary,
      vcard,
      persistedTruthLeakCheck: {
        containsDisplayOrContactTruth: containsDisplayOrContactTruth(rawCard, seed)
      },
      auditActions: auditRows.map((row: { action: string }) => row.action)
    }
  } finally {
    await cleanupSmokeTenant(prisma, seed.tenantId)
    await prisma.$disconnect()
    if (previousRenderBaseUrl === undefined) {
      delete process.env.PUBLIC_ENTRY_PUBLIC_RENDER_BASE_URL
    } else {
      process.env.PUBLIC_ENTRY_PUBLIC_RENDER_BASE_URL = previousRenderBaseUrl
    }
  }
}

// createEmployeePort supplies stable upstream employee facts without storing them in BusinessCard.
function createEmployeePort(seed: BusinessCardSmokeSeed): BusinessCardEmployeePort {
  const employee = {
    tenantId: seed.tenantId,
    employeeId: seed.employeeId,
    accountId: seed.accountId,
    displayName: seed.employee.displayName,
    englishName: seed.employee.englishName,
    title: seed.employee.title,
    department: seed.employee.department,
    officialPhotoUrl: seed.employee.officialPhotoUrl,
    contactValues: [
      {
        contactActionType: 'CALL_PHONE' as const,
        targetRefType: 'CONTACT_ASSET' as const,
        targetRefId: seed.contactAssets.phoneAssetId,
        contactAssetKind: 'WORK_PHONE' as const,
        displayValue: seed.contactAssets.phone,
        actionUrl: `tel:${seed.contactAssets.phone.replace(/[^\d+]/g, '')}`,
        available: true,
        includeInVCardAllowed: true
      },
      {
        contactActionType: 'SEND_EMAIL' as const,
        targetRefType: 'CONTACT_ASSET' as const,
        targetRefId: seed.contactAssets.emailAssetId,
        contactAssetKind: 'WORK_EMAIL' as const,
        displayValue: seed.contactAssets.email,
        actionUrl: `mailto:${seed.contactAssets.email}`,
        available: true,
        includeInVCardAllowed: true
      }
    ],
    status: 'ACTIVE' as const
  }
  return {
    getEmployeeSummary: async (input) =>
      input.tenantId === seed.tenantId && input.employeeId === seed.employeeId ? employee : null,
    getEmployeeByAccount: async (input) =>
      input.tenantId === seed.tenantId && input.accountId === seed.accountId ? employee : null
  }
}

// createContactAssetPort resolves public-safe contact values from Contact Asset references only.
function createContactAssetPort(seed: BusinessCardSmokeSeed): BusinessCardContactAssetPort {
  return {
    resolvePublicSafeValues: async (input) =>
      input.actionRefs.flatMap<ContactActionPublicSafeValue>((ref) => {
        if (
          ref.contactActionType === 'CALL_PHONE' &&
          ref.targetRefId === seed.contactAssets.phoneAssetId
        ) {
          return [
            {
              contactActionType: ref.contactActionType,
              targetRefType: ref.targetRefType,
              targetRefId: ref.targetRefId,
              contactAssetKind: 'WORK_PHONE' as const,
              displayValue: seed.contactAssets.phone,
              actionUrl: `tel:${seed.contactAssets.phone.replace(/[^\d+]/g, '')}`,
              available: true,
              includeInVCardAllowed: true
            }
          ]
        }
        if (
          ref.contactActionType === 'SEND_EMAIL' &&
          ref.targetRefId === seed.contactAssets.emailAssetId
        ) {
          return [
            {
              contactActionType: ref.contactActionType,
              targetRefType: ref.targetRefType,
              targetRefId: ref.targetRefId,
              contactAssetKind: 'WORK_EMAIL' as const,
              displayValue: seed.contactAssets.email,
              actionUrl: `mailto:${seed.contactAssets.email}`,
              available: true,
              includeInVCardAllowed: true
            }
          ]
        }
        return []
      })
  }
}

// createTenantProfilePort supplies company display facts as an upstream dependency.
function createTenantProfilePort(seed: BusinessCardSmokeSeed): BusinessCardTenantProfilePort {
  return {
    getCompanyDisplaySummary: async (input) =>
      input.tenantId === seed.tenantId
        ? {
            tenantId: seed.tenantId,
            companyDisplayName: seed.company.companyDisplayName,
            websiteUrl: seed.company.websiteUrl,
            logoUrl: seed.company.logoUrl
          }
        : null
  }
}

// createAuthorizationPort allows the smoke operator through the same application authorization boundary.
function createAuthorizationPort(seed: BusinessCardSmokeSeed): BusinessCardAuthorizationPort {
  return {
    checkPermission: async (input) => input.tenantId === seed.tenantId,
    buildQueryScope: async (input) => ({ tenantId: input.tenantId }),
    checkResource: async (input) =>
      input.tenantId === seed.tenantId && input.resource.tenantId === seed.tenantId
  }
}

// cleanupSmokeTenant removes rows owned by the isolated smoke tenant.
async function cleanupSmokeTenant(prisma: PrismaService, tenantId: string): Promise<void> {
  await (prisma as any).businessCardAuditLog.deleteMany({ where: { tenantId } })
  await (prisma as any).businessCard.deleteMany({ where: { tenantId } })
  await prisma.visitEvent.deleteMany({ where: { tenantId } })
  await prisma.shortLinkAuditLog.deleteMany({ where: { tenantId } })
  await prisma.shortLink.deleteMany({ where: { tenantId } })
}

// containsDisplayOrContactTruth checks persisted BusinessCard-owned fields for forbidden upstream truth copies.
function containsDisplayOrContactTruth(rawCard: unknown, seed: BusinessCardSmokeSeed): boolean {
  const serialized = JSON.stringify({
    contactActionsJson: (rawCard as any)?.contactActionsJson,
    visibilityConfigJson: (rawCard as any)?.visibilityConfigJson,
    publicEntryRefJson: (rawCard as any)?.publicEntryRefJson
  })
  return [
    seed.employee.displayName,
    seed.employee.englishName,
    seed.employee.title,
    seed.employee.department,
    seed.employee.officialPhotoUrl,
    seed.company.companyDisplayName,
    seed.company.logoUrl,
    seed.contactAssets.phone,
    seed.contactAssets.email
  ].some((forbidden) => serialized.includes(forbidden))
}
