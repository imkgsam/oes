import { BadRequestException, NotFoundException } from '@nestjs/common'
import { HrQueryService } from '../../src/application/services'
import { EmployeeLifecycleStatus, EmploymentStatus } from '../../src/domain/value-objects'

/** createEmployeeRepositoryMock builds the employee repository double for HR query tests. */
function createEmployeeRepositoryMock() {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByTenantPartyId: jest.fn(),
    listByTenant: jest.fn(),
    setLifecycleStatus: jest.fn()
  }
}

/** createEmploymentRepositoryMock builds the employment repository double for HR query tests. */
function createEmploymentRepositoryMock() {
  return {
    changePrimary: jest.fn(),
    createActive: jest.fn(),
    endActive: jest.fn(),
    findActiveByEmployeeId: jest.fn(),
    findById: jest.fn(),
    listByEmployeeId: jest.fn()
  }
}

describe('HrQueryService L1', () => {
  it('ListEmployees / should forward tenant-scoped pagination and filters to the employee repository', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.listByTenant.mockResolvedValue({
      items: [
        {
          id: 'employee-1',
          tenantId: 'tenant-1',
          tenantPartyId: 'tenant-party-1',
          partyId: 'party-1',
          employeeCode: 'EMP-001',
          lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
        }
      ],
      page: 2,
      pageSize: 5,
      total: 1
    })
    const service = new HrQueryService(employeeRepository as any, employmentRepository as any)

    await expect(
      service.listEmployees({
        tenantId: ' tenant-1 ',
        keyword: ' EMP-001 ',
        lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
        page: 2,
        pageSize: 5
      })
    ).resolves.toEqual({
      items: [
        {
          id: 'employee-1',
          tenantId: 'tenant-1',
          tenantPartyId: 'tenant-party-1',
          partyId: 'party-1',
          employeeCode: 'EMP-001',
          lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
        }
      ],
      page: 2,
      pageSize: 5,
      total: 1
    })

    expect(employeeRepository.listByTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      keyword: 'EMP-001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      page: 2,
      pageSize: 5
    })
  })

  it('ListEmployees / should require a non-blank tenant id before querying HR truth', async () => {
    const service = new HrQueryService(
      createEmployeeRepositoryMock() as any,
      createEmploymentRepositoryMock() as any
    )

    await expect(
      service.listEmployees({
        tenantId: ' ',
        page: 1,
        pageSize: 20
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('GetActiveEmployment / should still surface not-found when an employee has no active employment', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      partyId: 'party-1',
      employeeCode: 'EMP-001',
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    employmentRepository.findActiveByEmployeeId.mockResolvedValue(null)
    const service = new HrQueryService(employeeRepository as any, employmentRepository as any)

    await expect(service.getActiveEmployment('employee-1')).rejects.toBeInstanceOf(NotFoundException)
    expect(employmentRepository.findActiveByEmployeeId).toHaveBeenCalledWith('tenant-1', 'employee-1')
  })

  it('ListEmployments / should map the optional employment status filter without changing other inputs', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      partyId: 'party-1',
      employeeCode: 'EMP-001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })
    employmentRepository.listByEmployeeId.mockResolvedValue([])
    const service = new HrQueryService(employeeRepository as any, employmentRepository as any)

    await service.listEmployments({
      employeeId: 'employee-1',
      status: EmploymentStatus.ENDED
    })

    expect(employmentRepository.listByEmployeeId).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1',
      EmploymentStatus.ENDED
    )
  })
})
