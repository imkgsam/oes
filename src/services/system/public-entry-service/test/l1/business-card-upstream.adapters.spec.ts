import { Metadata } from '@grpc/grpc-js'
import { of, throwError } from 'rxjs'
import {
  EmployeeLifecycleStatus,
  EmploymentStatus
} from '@oes/common/generated/hr_service'
import {
  BusinessCardContactAssetGrpcAdapter,
  BusinessCardEmployeeGrpcAdapter,
  BusinessCardTenantProfileGrpcAdapter
} from '../../src/infrastructure/adapters/business-card-upstream.grpc.adapters'
import { PublicEntryFoundationTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/foundation-trusted-grpc.clients'

let trustedMetadata: Metadata

// buildGrpcClient creates a minimal Nest ClientGrpc double for adapter tests.
function buildGrpcClient<T extends object>(service: T) {
  return {
    getService: jest.fn(() => service)
  }
}

describe('BusinessCard upstream gRPC adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    trustedMetadata = new Metadata()
    jest
      .spyOn(PublicEntryFoundationTrustedGrpcExecutionProducer.prototype, 'forBusinessCall')
      .mockResolvedValue(trustedMetadata)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('resolves an employee summary from HR, Identity account binding, and Tenant Org references', async () => {
    const hrQuery = {
      getEmployeeById: jest.fn(() =>
        of({
          employee: {
            id: 'emp_001',
            tenantId: 'tenant_001',
            officialPhotoUrl: 'https://hr.example.com/alex-official.jpg',
            lifecycleStatus: EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE
          }
        })
      ),
      getActiveEmployment: jest.fn(() =>
        of({
          employment: {
            employeeId: 'emp_001',
            orgUnitId: 'org_sales',
            status: EmploymentStatus.EMPLOYMENT_STATUS_ACTIVE,
            positionName: 'Sales Manager'
          }
        })
      )
    }
    const identityQuery = {
      resolveEmployeeLoginAccount: jest.fn(() =>
        of({
          account: {
            accountId: 'acc_001',
            tenantId: 'tenant_001',
            displayName: 'Alex Chen',
            accountEnabled: true
          }
        })
      ),
      getAccountById: jest.fn(() =>
        of({
          account: {
            id: 'acc_001',
            tenantId: 'tenant_001',
            displayName: 'Alex Chen',
            avatarUrl: 'https://cdn.example.com/alex-account-avatar.jpg',
            isEnabled: true
          }
        })
      )
    }
    const tenantOrgQuery = {
      getOrgReferenceSummary: jest.fn(() =>
        of({ orgUnit: { id: 'org_sales', tenantId: 'tenant_001', name: 'Enterprise Sales' } })
      )
    }
    const adapter = new BusinessCardEmployeeGrpcAdapter(
      buildGrpcClient(hrQuery) as any,
      buildGrpcClient(identityQuery) as any,
      buildGrpcClient(tenantOrgQuery) as any
    )
    adapter.onModuleInit()

    await expect(
      adapter.getEmployeeSummary({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        traceId: 'trace_001'
      })
    ).resolves.toEqual({
      tenantId: 'tenant_001',
      employeeId: 'emp_001',
      accountId: 'acc_001',
      displayName: 'Alex Chen',
      englishName: null,
      title: 'Sales Manager',
      department: 'Enterprise Sales',
      officialPhotoUrl: 'https://hr.example.com/alex-official.jpg',
      status: 'ACTIVE'
    })
  })

  it('does not use Identity account avatar when HR has no employee official photo', async () => {
    const hrQuery = {
      getEmployeeById: jest.fn(() =>
        of({
          employee: {
            id: 'emp_001',
            tenantId: 'tenant_001',
            lifecycleStatus: EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE
          }
        })
      ),
      getActiveEmployment: jest.fn(() => of({}))
    }
    const identityQuery = {
      resolveEmployeeLoginAccount: jest.fn(() =>
        of({
          account: {
            accountId: 'acc_001',
            tenantId: 'tenant_001',
            displayName: 'Alex Chen',
            accountEnabled: true
          }
        })
      ),
      getAccountById: jest.fn(() =>
        of({
          account: {
            id: 'acc_001',
            tenantId: 'tenant_001',
            displayName: 'Alex Chen',
            avatarUrl: 'https://cdn.example.com/account-avatar.jpg',
            isEnabled: true
          }
        })
      )
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
        employeeId: 'emp_001'
      })
    ).resolves.toMatchObject({
      officialPhotoUrl: null
    })
  })

  it('uses HR employee official photo instead of a different Identity account avatar', async () => {
    const hrQuery = {
      getEmployeeById: jest.fn(() =>
        of({
          employee: {
            id: 'emp_001',
            tenantId: 'tenant_001',
            officialPhotoUrl: 'https://hr.example.com/official-photo.jpg',
            lifecycleStatus: EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE
          }
        })
      ),
      getActiveEmployment: jest.fn(() => of({}))
    }
    const identityQuery = {
      resolveEmployeeLoginAccount: jest.fn(() =>
        of({
          account: {
            accountId: 'acc_001',
            tenantId: 'tenant_001',
            displayName: 'Alex Chen',
            accountEnabled: true
          }
        })
      ),
      getAccountById: jest.fn(() =>
        of({
          account: {
            id: 'acc_001',
            tenantId: 'tenant_001',
            displayName: 'Alex Chen',
            avatarUrl: 'https://cdn.example.com/account-avatar.jpg',
            isEnabled: true
          }
        })
      )
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
        employeeId: 'emp_001'
      })
    ).resolves.toMatchObject({
      officialPhotoUrl: 'https://hr.example.com/official-photo.jpg'
    })
  })

  it('derives self-view employee from authenticated account binding and rejects disabled accounts', async () => {
    const hrQuery = {
      getEmployeeById: jest.fn(() =>
        of({
          employee: {
            id: 'emp_001',
            tenantId: 'tenant_001',
            lifecycleStatus: EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE
          }
        })
      ),
      getActiveEmployment: jest.fn(() => of({}))
    }
    const identityQuery = {
      getEmployeeBindingByAccountId: jest.fn(() =>
        of({ binding: { tenantId: 'tenant_001', accountId: 'acc_001', employeeId: 'emp_001' } })
      ),
      getAccountById: jest.fn(() =>
        of({
          account: {
            id: 'acc_001',
            tenantId: 'tenant_001',
            displayName: 'Alex Chen',
            isEnabled: false
          }
        })
      ),
      resolveEmployeeLoginAccount: jest.fn(() => of({}))
    }
    const adapter = new BusinessCardEmployeeGrpcAdapter(
      buildGrpcClient(hrQuery) as any,
      buildGrpcClient(identityQuery) as any,
      buildGrpcClient({}) as any
    )
    adapter.onModuleInit()

    await expect(
      adapter.getEmployeeByAccount({
        tenantId: 'tenant_001',
        accountId: 'acc_001'
      })
    ).resolves.toBeNull()
  })

  it('resolves only public-safe supported Contact Asset values', async () => {
    const identityQuery = {
      resolveEmployeeLoginAccount: jest.fn(() =>
        of({ account: { accountId: 'acc_001', tenantId: 'tenant_001', accountEnabled: true } })
      ),
      resolveContactActionTargets: jest.fn(() =>
        of({
          targets: [
            {
              contactActionType: 'SEND_EMAIL',
              targetRefType: 'CONTACT_ASSET',
              targetRefId: 'email_001',
              renderable: true,
              publicValueSummary: {
                type: 'WORK_EMAIL',
                displayValue: 'alex.chen@example.com',
                actionUri: 'mailto:alex.chen@example.com'
              }
            },
            {
              contactActionType: 'CALL_PHONE',
              targetRefType: 'CONTACT_ASSET',
              targetRefId: 'phone_disabled',
              renderable: false,
              hiddenReason: 'CONTACT_ASSET_NOT_ACTIVE'
            },
            {
              contactActionType: 'OPEN_WHATSAPP',
              targetRefType: 'CONTACT_ASSET',
              targetRefId: 'whatsapp_001',
              renderable: true,
              publicValueSummary: {
                type: 'WHATSAPP',
                displayValue: '+44 20 7946 0321',
                actionUri: 'https://wa.me/442079460321'
              }
            }
          ]
        })
      ),
      listAccountWorkEmailAssets: jest.fn(),
      listAccountWorkPhoneAssets: jest.fn()
    }
    const adapter = new BusinessCardContactAssetGrpcAdapter(buildGrpcClient(identityQuery) as any)
    adapter.onModuleInit()

    await expect(
      adapter.resolvePublicSafeValues({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        actionRefs: [
          { contactActionType: 'SEND_EMAIL', targetRefType: 'CONTACT_ASSET', targetRefId: 'email_001' },
          { contactActionType: 'CALL_PHONE', targetRefType: 'CONTACT_ASSET', targetRefId: 'phone_disabled' },
          { contactActionType: 'OPEN_WHATSAPP', targetRefType: 'CONTACT_ASSET', targetRefId: 'whatsapp_001' }
        ]
      })
    ).resolves.toEqual([
      {
        targetRefType: 'CONTACT_ASSET',
        targetRefId: 'email_001',
        contactAssetKind: 'WORK_EMAIL',
        displayValue: 'alex.chen@example.com',
        actionUrl: 'mailto:alex.chen@example.com',
        available: true
      },
      {
        targetRefType: 'CONTACT_ASSET',
        targetRefId: 'whatsapp_001',
        contactAssetKind: 'WHATSAPP',
        displayValue: '+44 20 7946 0321',
        actionUrl: 'https://wa.me/442079460321',
        available: true
      }
    ])
    expect(identityQuery.resolveContactActionTargets).toHaveBeenCalledWith(
      {
        tenantId: 'tenant_001',
        accountId: 'acc_001',
        employeeId: 'emp_001',
        targetRefs: [
          { contactActionType: 'SEND_EMAIL', targetRefType: 'CONTACT_ASSET', targetRefId: 'email_001' },
          { contactActionType: 'CALL_PHONE', targetRefType: 'CONTACT_ASSET', targetRefId: 'phone_disabled' },
          { contactActionType: 'OPEN_WHATSAPP', targetRefType: 'CONTACT_ASSET', targetRefId: 'whatsapp_001' }
        ]
      },
      trustedMetadata
    )
    expect(identityQuery.listAccountWorkEmailAssets).not.toHaveBeenCalled()
    expect(identityQuery.listAccountWorkPhoneAssets).not.toHaveBeenCalled()
  })

  it('maps tenant public website URL from tenant-org into the company display summary', async () => {
    const tenantOrgQuery = {
      getTenantById: jest.fn(() =>
        of({
          tenant: {
            id: 'tenant_001',
            code: 'oes',
            name: 'OES Manufacturing',
            status: 'ACTIVE',
            websiteUrl: 'https://www.oes.example'
          }
        })
      )
    }
    const adapter = new BusinessCardTenantProfileGrpcAdapter(
      buildGrpcClient(tenantOrgQuery) as any
    )
    adapter.onModuleInit()

    await expect(adapter.getCompanyDisplaySummary({ tenantId: 'tenant_001' })).resolves.toEqual({
      tenantId: 'tenant_001',
      companyDisplayName: 'OES Manufacturing',
      websiteUrl: 'https://www.oes.example',
      logoUrl: null
    })
  })

  it('returns null instead of leaking upstream failures', async () => {
    const adapter = new BusinessCardTenantProfileGrpcAdapter(
      buildGrpcClient({
        getTenantById: jest.fn(() => throwError(() => new Error('tenant-org unavailable')))
      }) as any
    )
    adapter.onModuleInit()

    await expect(adapter.getCompanyDisplaySummary({ tenantId: 'tenant_001' })).resolves.toBeNull()
  })
})
