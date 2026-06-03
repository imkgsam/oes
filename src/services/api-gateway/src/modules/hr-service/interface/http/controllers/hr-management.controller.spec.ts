import { Reflector } from '@nestjs/core'
import {
  HR_MANAGEMENT_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { HrManagementController } from './hr-management.controller'

// Verifies the HR management gateway controller keeps employee and employment endpoints aligned with HR boundaries.
describe('HrManagementController', () => {
  const hrManagementService = {
    completeEmployeeAccess: jest.fn(),
    changePrimaryEmployment: jest.fn(),
    createEmployee: jest.fn(),
    createEmployment: jest.fn(),
    endEmployment: jest.fn(),
    getEmployeeAccountAccess: jest.fn(),
    getEmployeeDetail: jest.fn(),
    listEmployees: jest.fn(),
    previewNextEmployeeCode: jest.fn()
  }

  const controller = new HrManagementController(hrManagementService as any)

  it('declares the expected HR permissions on employee and employment endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.listEmployees
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.getEmployeeDetail
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.getEmployeeAccountAccess
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.previewNextEmployeeCode
      )
    ).toEqual(expect.objectContaining({ all: [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE] }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.createEmployee
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.createEmployment
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.endEmployment
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.changePrimaryEmployment
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        HrManagementController.prototype.completeEmployeeAccess
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards employee list, detail, account-access summary, and write actions to the HR management service', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    hrManagementService.listEmployees.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    hrManagementService.getEmployeeDetail.mockResolvedValue({
      employee: { id: 'employee-1' },
      employments: []
    })
    hrManagementService.getEmployeeAccountAccess.mockResolvedValue({
      status: 'PENDING'
    })
    hrManagementService.previewNextEmployeeCode.mockResolvedValue({
      employeeCode: 'EMP-0AF-0003'
    })
    hrManagementService.createEmployee.mockResolvedValue({
      employee: { id: 'employee-1' }
    })
    hrManagementService.createEmployment.mockResolvedValue({
      employee: { id: 'employee-1' },
      employment: { id: 'employment-1' }
    })
    hrManagementService.endEmployment.mockResolvedValue({
      employee: { id: 'employee-1' },
      employment: { id: 'employment-1' }
    })
    hrManagementService.changePrimaryEmployment.mockResolvedValue({
      employee: { id: 'employee-1' },
      endedEmployment: { id: 'employment-old' },
      newEmployment: { id: 'employment-new' }
    })
    hrManagementService.completeEmployeeAccess.mockResolvedValue({
      status: 'ACTIVE'
    })

    await expect(
      controller.listEmployees(
        'tenant-1',
        { keyword: 'Vic', page: 2, pageSize: 10 } as any,
        source as any
      )
    ).resolves.toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    await expect(
      controller.getEmployeeDetail('tenant-1', 'employee-1', source as any)
    ).resolves.toEqual({
      employee: { id: 'employee-1' },
      employments: []
    })
    await expect(
      controller.getEmployeeAccountAccess('tenant-1', 'employee-1', source as any)
    ).resolves.toEqual({
      status: 'PENDING'
    })
    await expect(
      controller.previewNextEmployeeCode('tenant-1', source as any)
    ).resolves.toEqual({
      employeeCode: 'EMP-0AF-0003'
    })
    await expect(
      controller.createEmployee(
        'tenant-1',
        {
          employeeCode: 'EMP-0AF-0001',
          partyId: 'party-1',
          tenantPartyId: 'tenant-party-1'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      employee: { id: 'employee-1' }
    })
    await expect(
      controller.createEmployment(
        'tenant-1',
        'employee-1',
        {
          effectiveFrom: '2026-04-24T00:00:00.000Z',
          orgUnitId: 'org-1'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      employee: { id: 'employee-1' },
      employment: { id: 'employment-1' }
    })
    await expect(
      controller.endEmployment(
        'tenant-1',
        'employee-1',
        'employment-1',
        {
          effectiveTo: '2026-04-25T00:00:00.000Z',
          endedReason: 'manual'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      employee: { id: 'employee-1' },
      employment: { id: 'employment-1' }
    })
    await expect(
      controller.changePrimaryEmployment(
        'tenant-1',
        'employee-1',
        {
          effectiveFrom: '2026-04-26T00:00:00.000Z',
          endedReason: 'transfer',
          fromEmploymentId: 'employment-1',
          toOrgUnitId: 'org-2'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      employee: { id: 'employee-1' },
      endedEmployment: { id: 'employment-old' },
      newEmployment: { id: 'employment-new' }
    })
    await expect(
      controller.completeEmployeeAccess(
        'tenant-1',
        'employee-1',
        {
          employmentId: 'employment-1',
          roleIds: ['role-1'],
          reason: 'member_access_enable',
          createAccount: {
            displayName: 'EMP-0AF-0001',
            email: 'member@example.com'
          }
        } as any,
        source as any
      )
    ).resolves.toEqual({
      status: 'ACTIVE'
    })

    expect(hrManagementService.listEmployees).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'Vic',
        lifecycleStatus: undefined,
        page: 2,
        pageSize: 10
      },
      source
    )
    expect(hrManagementService.getEmployeeDetail).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1',
      source
    )
    expect(hrManagementService.getEmployeeAccountAccess).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1',
      source
    )
    expect(hrManagementService.previewNextEmployeeCode).toHaveBeenCalledWith('tenant-1', source)
    expect(hrManagementService.createEmployee).toHaveBeenCalledWith(
      'tenant-1',
      {
        employeeCode: 'EMP-0AF-0001',
        partyId: 'party-1',
        tenantPartyId: 'tenant-party-1'
      },
      source
    )
    expect(hrManagementService.createEmployment).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1',
      {
        effectiveFrom: '2026-04-24T00:00:00.000Z',
        orgUnitId: 'org-1'
      },
      source
    )
    expect(hrManagementService.endEmployment).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1',
      'employment-1',
      {
        effectiveTo: '2026-04-25T00:00:00.000Z',
        endedReason: 'manual'
      },
      source
    )
    expect(hrManagementService.changePrimaryEmployment).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1',
      {
        effectiveFrom: '2026-04-26T00:00:00.000Z',
        endedReason: 'transfer',
        fromEmploymentId: 'employment-1',
        toOrgUnitId: 'org-2'
      },
      source
    )
    expect(hrManagementService.completeEmployeeAccess).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1',
      {
        employmentId: 'employment-1',
        roleIds: ['role-1'],
        reason: 'member_access_enable',
        createAccount: {
          displayName: 'EMP-0AF-0001',
          email: 'member@example.com'
        }
      },
      source
    )
  })
})
