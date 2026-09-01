import { BadRequestException, NotFoundException } from '@nestjs/common'
import { HrQueryService } from '../../src/application/services'
import { EmployeeLifecycleStatus, EmploymentStatus } from '../../src/domain/value-objects'

/** createEmployeeRepositoryMock builds the employee repository double for HR query tests. */
function createEmployeeRepositoryMock() {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByTenantAndEmployeeCode: jest.fn(),
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

/** createTenantOrgPortMock supplies tenant employee-code prefixes for display-code composition. */
function createTenantOrgPortMock() {
  return {
    getTenantEmployeeCodePrefix: jest.fn().mockResolvedValue('0AF')
  }
}

/** createHrQueryService builds HrQueryService with all query dependencies. */
function createHrQueryService(employeeRepository: any, employmentRepository: any) {
  return new HrQueryService(
    employeeRepository,
    employmentRepository,
    { findLatestByEmployeeId: jest.fn() } as any,
    createTenantOrgPortMock() as any
  )
}

describe('HrQueryService L1', () => {
  it('ResolveActiveEmployeeByCode / should return active employee and current active employment by exact tenant employee code', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findByTenantAndEmployeeCode.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })
    employmentRepository.findActiveByEmployeeId.mockResolvedValue({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      status: EmploymentStatus.ACTIVE,
      effectiveFrom: new Date('2026-04-23T00:00:00.000Z'),
      effectiveTo: null,
      endedReason: null
    })
    const service = createHrQueryService(employeeRepository, employmentRepository)

    await expect(
      (service as any).resolveActiveEmployeeByCode({
        tenantId: ' tenant-1 ',
        employeeCode: ' EMP-0AF-0001 '
      })
    ).resolves.toEqual({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        employeeCode: 'EMP-0AF-0001',
        lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
      },
      activeEmployment: {
        id: 'employment-1',
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        status: EmploymentStatus.ACTIVE,
        effectiveFrom: new Date('2026-04-23T00:00:00.000Z'),
        effectiveTo: null,
        endedReason: null
      }
    })
    expect(employeeRepository.findByTenantAndEmployeeCode).toHaveBeenCalledWith('tenant-1', '0001')
    expect(employmentRepository.findActiveByEmployeeId).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1'
    )
  })

  it('ResolveActiveEmployeeByCode / should reject inactive employees before returning employment facts', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findByTenantAndEmployeeCode.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.OFFBOARDED
    })
    const service = createHrQueryService(employeeRepository, employmentRepository)

    await expect(
      (service as any).resolveActiveEmployeeByCode({
        tenantId: 'tenant-1',
        employeeCode: 'EMP-0AF-0001'
      })
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(employmentRepository.findActiveByEmployeeId).not.toHaveBeenCalled()
  })

  it('ResolveActiveEmployeeByCode / should reject active employees without current active employment', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findByTenantAndEmployeeCode.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })
    employmentRepository.findActiveByEmployeeId.mockResolvedValue(null)
    const service = createHrQueryService(employeeRepository, employmentRepository)

    await expect(
      (service as any).resolveActiveEmployeeByCode({
        tenantId: 'tenant-1',
        employeeCode: 'EMP-0AF-0001'
      })
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('ListEmployees / should forward tenant-scoped pagination and filters to the employee repository', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.listByTenant.mockResolvedValue({
      items: [
        {
          id: 'employee-1',
          tenantId: 'tenant-1',
          tenantPartyId: 'tenant-party-1',
          employeeCode: '0001',
          lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
          officialPhotoAssetId: 'asset-1',
          officialPhotoUrl: 'https://assets.example.com/photo.webp'
        }
      ],
      page: 2,
      pageSize: 5,
      total: 1
    })
    const service = createHrQueryService(employeeRepository, employmentRepository)

    await expect(
      service.listEmployees({
        tenantId: ' tenant-1 ',
        keyword: ' EMP-0AF-0001 ',
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
          employeeCode: 'EMP-0AF-0001',
          lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
          officialPhotoAssetId: 'asset-1',
          officialPhotoUrl: 'https://assets.example.com/photo.webp'
        }
      ],
      page: 2,
      pageSize: 5,
      total: 1
    })

    expect(employeeRepository.listByTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      keyword: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      page: 2,
      pageSize: 5
    })
  })

  it('ListEmployees / should require a non-blank tenant id before querying HR truth', async () => {
    const service = new HrQueryService(
      createEmployeeRepositoryMock() as any,
      createEmploymentRepositoryMock() as any,
      { findLatestByEmployeeId: jest.fn() } as any,
      createTenantOrgPortMock() as any
    )

    await expect(
      service.listEmployees({
        tenantId: ' ',
        page: 1,
        pageSize: 20
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('GetEmployeeById / should preserve HR official photo fields without account avatar substitution', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      officialPhotoAssetId: null,
      officialPhotoUrl: null,
      accountAvatarUrl: 'https://identity.example.com/avatar.webp'
    })
    const service = createHrQueryService(employeeRepository, employmentRepository)

    const employee = await service.getEmployeeById('employee-1')

    expect(employee.officialPhotoAssetId).toBeNull()
    expect(employee.officialPhotoUrl).toBeNull()
    expect(employee.officialPhotoUrl).not.toBe('https://identity.example.com/avatar.webp')
  })

  it('ResolveActiveEmployeeByCode / should preserve official photo fields in active employee summaries', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findByTenantAndEmployeeCode.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      officialPhotoAssetId: 'asset-1',
      officialPhotoUrl: 'https://assets.example.com/photo.webp'
    })
    employmentRepository.findActiveByEmployeeId.mockResolvedValue({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      status: EmploymentStatus.ACTIVE,
      effectiveFrom: new Date('2026-04-23T00:00:00.000Z'),
      effectiveTo: null,
      endedReason: null
    })
    const service = createHrQueryService(employeeRepository, employmentRepository)

    await expect(
      (service as any).resolveActiveEmployeeByCode({
        tenantId: 'tenant-1',
        employeeCode: 'EMP-0AF-0001'
      })
    ).resolves.toMatchObject({
      employee: {
        officialPhotoAssetId: 'asset-1',
        officialPhotoUrl: 'https://assets.example.com/photo.webp'
      }
    })
  })

  it('GetActiveEmployment / should still surface not-found when an employee has no active employment', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    employmentRepository.findActiveByEmployeeId.mockResolvedValue(null)
    const service = createHrQueryService(employeeRepository, employmentRepository)

    await expect(service.getActiveEmployment('employee-1')).rejects.toBeInstanceOf(
      NotFoundException
    )
    expect(employmentRepository.findActiveByEmployeeId).toHaveBeenCalledWith(
      'tenant-1',
      'employee-1'
    )
  })

  it('ListEmployments / should map the optional employment status filter without changing other inputs', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    employeeRepository.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })
    employmentRepository.listByEmployeeId.mockResolvedValue([])
    const service = createHrQueryService(employeeRepository, employmentRepository)

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

describe('HrQueryService Public Business Card owner fact', () => {
  it('returns only the active employee/current-employment public projection', async () => {
    const employees = createEmployeeRepositoryMock()
    const employments = createEmploymentRepositoryMock()
    employees.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      officialPhotoUrl: 'https://assets.example/official.jpg'
    })
    employments.findActiveByEmployeeId.mockResolvedValue({
      id: 'employment-1',
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      orgUnitId: 'org-1',
      positionName: 'Sales Manager',
      status: EmploymentStatus.ACTIVE
    })
    const service = createHrQueryService(employees, employments)

    await expect(
      service.resolvePublicBusinessCardEmployee({ tenantId: 'tenant-1', employeeId: 'employee-1' })
    ).resolves.toEqual({
      available: true,
      reasonCode: '',
      employeeId: 'employee-1',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      activeEmploymentId: 'employment-1',
      orgUnitId: 'org-1',
      positionName: 'Sales Manager',
      officialPhotoUrl: 'https://assets.example/official.jpg'
    })
  })

  it.each([
    [
      'wrong tenant',
      { tenantId: 'tenant-2', lifecycleStatus: EmployeeLifecycleStatus.ACTIVE },
      'EMPLOYEE_UNAVAILABLE'
    ],
    [
      'inactive employee',
      { tenantId: 'tenant-1', lifecycleStatus: EmployeeLifecycleStatus.OFFBOARDED },
      'EMPLOYEE_INACTIVE'
    ]
  ])('fails closed for %s', async (_, employee, reasonCode) => {
    const employees = createEmployeeRepositoryMock()
    const employments = createEmploymentRepositoryMock()
    employees.findById.mockResolvedValue({
      id: 'employee-1',
      tenantPartyId: 'party-1',
      employeeCode: '0001',
      ...employee
    })
    const service = createHrQueryService(employees, employments)
    await expect(
      service.resolvePublicBusinessCardEmployee({ tenantId: 'tenant-1', employeeId: 'employee-1' })
    ).resolves.toEqual({ available: false, reasonCode })
    expect(employments.findActiveByEmployeeId).not.toHaveBeenCalled()
  })

  it('fails closed without a current active employment', async () => {
    const employees = createEmployeeRepositoryMock()
    const employments = createEmploymentRepositoryMock()
    employees.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })
    employments.findActiveByEmployeeId.mockResolvedValue(null)
    const service = createHrQueryService(employees, employments)
    await expect(
      service.resolvePublicBusinessCardEmployee({ tenantId: 'tenant-1', employeeId: 'employee-1' })
    ).resolves.toEqual({ available: false, reasonCode: 'EMPLOYMENT_UNAVAILABLE' })
  })
})
