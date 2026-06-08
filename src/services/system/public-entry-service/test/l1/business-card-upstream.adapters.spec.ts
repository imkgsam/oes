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

const metadataFactory = {
  createInternalCallMetadata: jest.fn(() => ({ internal: true }))
}

// buildGrpcClient creates a minimal Nest ClientGrpc double for adapter tests.
function buildGrpcClient<T extends object>(service: T) {
  return {
    getService: jest.fn(() => service)
  }
}

describe('BusinessCard upstream gRPC adapters', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resolves an employee summary from HR, Identity account binding, and Tenant Org references', async () => {
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
            avatarUrl: 'https://cdn.example.com/alex.jpg',
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
      buildGrpcClient(tenantOrgQuery) as any,
      metadataFactory as any
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
      officialPhotoUrl: 'https://cdn.example.com/alex.jpg',
      status: 'ACTIVE'
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
      buildGrpcClient({}) as any,
      metadataFactory as any
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
      listAccountWorkEmailAssets: jest.fn(() =>
        of({
          assets: [
            {
              id: 'email_001',
              tenantId: 'tenant_001',
              accountId: 'acc_001',
              type: 'WORK_EMAIL',
              value: 'alex.chen@example.com',
              status: 'ACTIVE',
              isPrimary: true
            }
          ]
        })
      ),
      listAccountWorkPhoneAssets: jest.fn(() =>
        of({
          assets: [
            {
              id: 'phone_disabled',
              tenantId: 'tenant_001',
              accountId: 'acc_001',
              type: 'WORK_PHONE',
              value: '+1 555 0101',
              status: 'DISABLED',
              isPrimary: true
            }
          ]
        })
      )
    }
    const adapter = new BusinessCardContactAssetGrpcAdapter(
      buildGrpcClient(identityQuery) as any,
      metadataFactory as any
    )
    adapter.onModuleInit()

    await expect(
      adapter.resolvePublicSafeValues({
        tenantId: 'tenant_001',
        employeeId: 'emp_001',
        actionRefs: [
          { contactActionType: 'SEND_EMAIL', targetRefType: 'CONTACT_ASSET', targetRefId: 'email_001' },
          { contactActionType: 'CALL_PHONE', targetRefType: 'CONTACT_ASSET', targetRefId: 'phone_disabled' },
          { contactActionType: 'ADD_WECHAT', targetRefType: 'CONTACT_ASSET', targetRefId: 'wechat_001' }
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
      }
    ])
  })

  it('returns null instead of leaking upstream failures', async () => {
    const adapter = new BusinessCardTenantProfileGrpcAdapter(
      buildGrpcClient({
        getTenantById: jest.fn(() => throwError(() => new Error('tenant-org unavailable')))
      }) as any,
      metadataFactory as any
    )
    adapter.onModuleInit()

    await expect(adapter.getCompanyDisplaySummary({ tenantId: 'tenant_001' })).resolves.toBeNull()
  })
})
