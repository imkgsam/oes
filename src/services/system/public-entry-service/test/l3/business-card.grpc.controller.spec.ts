import {
  ContactActionTargetRefType,
  BusinessCardStatus as GrpcBusinessCardStatus
} from '@oes/common/generated/public_entry_service'
import { BusinessCardApplicationService } from '../../src/application/services/business-card-application.service'
import { PublicEntryBusinessCardGrpcController } from '../../src/interfaces/grpc/public-entry-business-card.grpc.controller'
import { InMemoryBusinessCardRepository } from '../../src/infrastructure/repositories/in-memory-business-card.repository'
import { InMemoryShortLinkRepository } from '../../src/infrastructure/repositories/in-memory-short-link.repository'
import { ShortCodeGenerator } from '../../src/domain/services/short-code-generator'
import { ShortLinkTargetResolverRegistry } from '../../src/application/services/short-link-target-resolver.registry'
import { QrCodeService } from '../../src/application/services/qr-code.service'
import { ShortLinkApplicationService } from '../../src/application/services/short-link-application.service'

const operatorContext = {
  operatorAccountId: 'acc_admin',
  operatorOrgId: 'org_001',
  traceId: 'trace_001'
}

// buildController wires the BusinessCard gRPC controller directly for transport mapping tests.
function buildController() {
  const cardRepository = new InMemoryBusinessCardRepository()
  const shortLinkService = new ShortLinkApplicationService(
    new InMemoryShortLinkRepository(),
    new ShortCodeGenerator(() => 0),
    new ShortLinkTargetResolverRegistry(),
    new QrCodeService()
  )
  const appService = new BusinessCardApplicationService(
    cardRepository,
    shortLinkService,
    {
      getEmployeeSummary: jest.fn(async () => ({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        accountId: 'acc_employee',
        displayName: 'Alex Chen',
        title: 'Sales Manager',
        department: 'Enterprise Sales',
        status: 'ACTIVE' as const
      })),
      getEmployeeByAccount: jest.fn(async () => ({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        accountId: 'acc_employee',
        displayName: 'Alex Chen',
        status: 'ACTIVE' as const
      }))
    },
    {
      resolvePublicSafeValues: jest.fn(async () => [
        {
          targetRefType: 'CONTACT_ASSET' as const,
          targetRefId: 'phone_001',
          contactAssetKind: 'WORK_PHONE' as const,
          displayValue: '+1 555 0101',
          actionUrl: 'tel:+15550101',
          available: true
        }
      ])
    },
    {
      getCompanyDisplaySummary: jest.fn(async () => ({
        tenantId: 'tenant_001',
        companyDisplayName: 'OES Manufacturing'
      }))
    },
    {
      checkPermission: jest.fn(async () => true),
      buildQueryScope: jest.fn(async () => ({ tenantId: 'tenant_001' })),
      checkResource: jest.fn(async () => true)
    }
  )
  return { controller: new PublicEntryBusinessCardGrpcController(appService), cardRepository }
}

describe('PublicEntryBusinessCardGrpcController', () => {
  it('maps management, public render, and vCard calls through generated contract shapes', async () => {
    const { controller } = buildController()

    const created = await controller.ensurePrimaryBusinessCard({
      tenantId: 'tenant_001',
      employeeId: 'emp_001',
      operatorContext
    })
    expect(created.businessCard?.status).toBe(GrpcBusinessCardStatus.BUSINESS_CARD_STATUS_DRAFT)

    await controller.updateBusinessCardContactActions({
      tenantId: 'tenant_001',
      businessCardId: created.businessCard?.businessCardId,
      operatorContext,
      contactActionConfigs: [
        {
          contactActionType: 'CALL_PHONE',
          targetRefType: ContactActionTargetRefType.CONTACT_ACTION_TARGET_REF_TYPE_CONTACT_ASSET,
          targetRefId: 'phone_001',
          visibility: 'PUBLIC',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true
        }
      ]
    } as any)

    const publicEntry = await controller.bindOrRefreshBusinessCardPublicEntry({
      tenantId: 'tenant_001',
      businessCardId: created.businessCard?.businessCardId,
      operatorContext
    })
    expect(publicEntry.publicEntryRef?.publicUrl).toMatch(/^\/c\//)

    const enabled = await controller.enableBusinessCard({
      tenantId: 'tenant_001',
      businessCardId: created.businessCard?.businessCardId,
      operatorContext
    })
    expect(enabled.status).toBe(GrpcBusinessCardStatus.BUSINESS_CARD_STATUS_ACTIVE)

    const rendered = await controller.renderPublicBusinessCard({
      tenantId: 'tenant_001',
      businessCardId: created.businessCard?.businessCardId
    })
    expect(rendered.state).toBe('AVAILABLE')
    expect(rendered.view?.person?.displayName).toBe('Alex Chen')
    expect(rendered.view?.contactActions?.[0]?.contactActionType).toBe('CALL_PHONE')

    const vcard = await controller.generateBusinessCardVCard({
      tenantId: 'tenant_001',
      businessCardId: created.businessCard?.businessCardId
    })
    expect(vcard.contentType).toBe('text/vcard')
    expect(vcard.body).toContain('FN:Alex Chen')
  })
})
