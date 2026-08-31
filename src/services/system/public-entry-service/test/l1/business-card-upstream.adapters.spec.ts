import { Metadata } from '@grpc/grpc-js'
import { of, throwError } from 'rxjs'
import { EmployeeLifecycleStatus } from '@oes/common/generated/hr_service'
import {
  BusinessCardContactAssetGrpcAdapter,
  BusinessCardEmployeeGrpcAdapter,
  BusinessCardTenantProfileGrpcAdapter
} from '../../src/infrastructure/adapters/business-card-upstream.grpc.adapters'
import { PublicEntryFoundationTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/foundation-trusted-grpc.clients'

const metadata = new Metadata()

function buildGrpcClient<T extends object>(service: T) {
  return { getService: jest.fn(() => service) }
}

describe('BusinessCard dedicated owner-fact gRPC adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(PublicEntryFoundationTrustedGrpcExecutionProducer.prototype, 'forInternalMachineCall')
      .mockResolvedValue(metadata)
  })

  afterEach(() => jest.restoreAllMocks())

  it('composes HR and Identity projections once with exact INTERNAL methods and no BUSINESS read', async () => {
    const hrQuery = {
      resolvePublicBusinessCardEmployee: jest.fn(() =>
        of({
          available: true,
          employeeId: 'emp_001',
          lifecycleStatus: EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE,
          activeEmploymentId: 'employment_001',
          orgUnitId: 'org_sales',
          positionName: 'Sales Manager',
          officialPhotoUrl: 'https://hr.example/official.jpg'
        })
      ),
      getEmployeeById: jest.fn(),
      getActiveEmployment: jest.fn()
    }
    const identityQuery = {
      resolvePublicBusinessCardIdentity: jest.fn(() =>
        of({
          available: true,
          tenantId: 'tenant_001',
          employeeId: 'emp_001',
          accountId: 'acc_001',
          displayName: 'Alex Chen',
          targets: [
            {
              contactActionType: 'SEND_EMAIL',
              targetRefType: 'CONTACT_ASSET',
              targetRefId: 'email_001',
              renderable: true,
              publicValueSummary: {
                type: 'WORK_EMAIL',
                displayValue: 'alex@example.com',
                actionUri: 'mailto:alex@example.com',
                includeInVCardAllowed: true
              }
            }
          ]
        })
      ),
      resolveEmployeeLoginAccount: jest.fn(),
      getAccountById: jest.fn(),
      resolveContactActionTargets: jest.fn()
    }
    const adapter = new BusinessCardEmployeeGrpcAdapter(
      buildGrpcClient(hrQuery) as any,
      buildGrpcClient(identityQuery) as any,
      buildGrpcClient({}) as any
    )
    adapter.onModuleInit()

    await expect(
      adapter.getEmployeeSummary({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        actionRefs: [
          {
            contactActionType: 'SEND_EMAIL',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'email_001'
          }
        ]
      })
    ).resolves.toEqual({
      tenantId: 'tenant_001',
      employeeId: 'emp_001',
      accountId: 'acc_001',
      displayName: 'Alex Chen',
      englishName: null,
      title: 'Sales Manager',
      department: null,
      orgUnitId: 'org_sales',
      officialPhotoUrl: 'https://hr.example/official.jpg',
      contactValues: [
        {
          contactActionType: 'SEND_EMAIL',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: 'email_001',
          contactAssetKind: 'WORK_EMAIL',
          displayValue: 'alex@example.com',
          actionUrl: 'mailto:alex@example.com',
          available: true,
          includeInVCardAllowed: true
        }
      ],
      status: 'ACTIVE'
    })
    expect(hrQuery.resolvePublicBusinessCardEmployee).toHaveBeenCalledTimes(1)
    expect(identityQuery.resolvePublicBusinessCardIdentity).toHaveBeenCalledTimes(1)
    expect(hrQuery.getEmployeeById).not.toHaveBeenCalled()
    expect(hrQuery.getActiveEmployment).not.toHaveBeenCalled()
    expect(identityQuery.resolveEmployeeLoginAccount).not.toHaveBeenCalled()
    expect(identityQuery.getAccountById).not.toHaveBeenCalled()
    expect(identityQuery.resolveContactActionTargets).not.toHaveBeenCalled()
    expect(
      PublicEntryFoundationTrustedGrpcExecutionProducer.prototype.forInternalMachineCall
    ).toHaveBeenCalledWith('hr-service', 'hr.internal.public_business_card_employee.resolve')
    expect(
      PublicEntryFoundationTrustedGrpcExecutionProducer.prototype.forInternalMachineCall
    ).toHaveBeenCalledWith(
      'identity-service',
      'identity.internal.public_business_card_identity.resolve'
    )
  })

  it('maps optional public-safe targets through the dedicated Identity resolver', async () => {
    const identityQuery = {
      resolvePublicBusinessCardIdentity: jest.fn(() =>
        of({
          available: true,
          tenantId: 'tenant_001',
          employeeId: 'emp_001',
          targets: [
            {
              contactActionType: 'SEND_EMAIL',
              targetRefType: 'CONTACT_ASSET',
              targetRefId: 'email_001',
              renderable: true,
              publicValueSummary: {
                type: 'WORK_EMAIL',
                displayValue: 'alex@example.com',
                actionUri: 'mailto:alex@example.com',
                includeInVCardAllowed: false
              }
            },
            { targetRefType: 'CONTACT_ASSET', targetRefId: 'hidden', renderable: false }
          ]
        })
      )
    }
    const adapter = new BusinessCardContactAssetGrpcAdapter(buildGrpcClient(identityQuery) as any)
    adapter.onModuleInit()

    await expect(
      adapter.resolvePublicSafeValues({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        actionRefs: [
          {
            contactActionType: 'SEND_EMAIL',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'email_001'
          }
        ]
      })
    ).resolves.toEqual([
      expect.objectContaining({
        contactActionType: 'SEND_EMAIL',
        includeInVCardAllowed: false
      })
    ])
  })

  it('drops mismatched Identity action/value projections instead of retyping them', async () => {
    const identityQuery = {
      resolvePublicBusinessCardIdentity: jest.fn(() =>
        of({
          available: true,
          tenantId: 'tenant_001',
          employeeId: 'emp_001',
          targets: [
            {
              contactActionType: 'SEND_EMAIL',
              targetRefType: 'CONTACT_ASSET',
              targetRefId: 'email_001',
              renderable: true,
              publicValueSummary: {
                type: 'WORK_PHONE',
                displayValue: '+1 555 0101',
                actionUri: 'tel:+15550101',
                includeInVCardAllowed: true
              }
            }
          ]
        })
      )
    }
    const adapter = new BusinessCardContactAssetGrpcAdapter(buildGrpcClient(identityQuery) as any)
    adapter.onModuleInit()

    await expect(
      adapter.resolvePublicSafeValues({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        actionRefs: [
          {
            contactActionType: 'SEND_EMAIL',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'email_001'
          }
        ]
      })
    ).resolves.toEqual([])
  })

  it('maps the exact TenantOrg company and optional department projection', async () => {
    const tenantOrgQuery = {
      resolvePublicBusinessCardOrganization: jest.fn(() =>
        of({
          available: true,
          tenantId: 'tenant_001',
          companyDisplayName: 'OES Manufacturing',
          websiteUrl: 'https://www.oes.example',
          orgUnitId: 'org_sales',
          orgUnitDisplayName: 'Enterprise Sales'
        })
      ),
      getTenantById: jest.fn(),
      getOrgReferenceSummary: jest.fn()
    }
    const adapter = new BusinessCardTenantProfileGrpcAdapter(buildGrpcClient(tenantOrgQuery) as any)
    adapter.onModuleInit()

    await expect(
      adapter.getCompanyDisplaySummary({ tenantId: 'tenant_001', orgUnitId: 'org_sales' })
    ).resolves.toEqual({
      tenantId: 'tenant_001',
      companyDisplayName: 'OES Manufacturing',
      websiteUrl: 'https://www.oes.example',
      departmentDisplayName: 'Enterprise Sales',
      logoUrl: null
    })
    expect(tenantOrgQuery.resolvePublicBusinessCardOrganization).toHaveBeenCalledTimes(1)
    expect(tenantOrgQuery.getTenantById).not.toHaveBeenCalled()
    expect(tenantOrgQuery.getOrgReferenceSummary).not.toHaveBeenCalled()
  })

  it('fails the required projection closed when an owner dependency is unavailable', async () => {
    const adapter = new BusinessCardTenantProfileGrpcAdapter(
      buildGrpcClient({
        resolvePublicBusinessCardOrganization: jest.fn(() =>
          throwError(() => new Error('tenant-org unavailable'))
        )
      }) as any
    )
    adapter.onModuleInit()
    await expect(adapter.getCompanyDisplaySummary({ tenantId: 'tenant_001' })).resolves.toBeNull()
  })
})
