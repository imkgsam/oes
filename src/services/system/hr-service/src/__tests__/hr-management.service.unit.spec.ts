import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { HrManagementService } from '../application/services/hr-management.service'
import { EmployeeLifecycleStatus, EmploymentStatus } from '../domain/value-objects'

/** createEmployeeRepositoryMock builds the employee repository double for HR management tests. */
function createEmployeeRepositoryMock() {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findMaxEmployeeCodeSuffix: jest.fn(),
    findByTenantPartyId: jest.fn(),
    setLifecycleStatus: jest.fn(),
    updateOfficialPhoto: jest.fn(),
    removeOfficialPhoto: jest.fn()
  }
}

/** createEmploymentRepositoryMock builds the employment repository double for HR management tests. */
function createEmploymentRepositoryMock() {
  return {
    createActive: jest.fn(),
    endActive: jest.fn(),
    changePrimary: jest.fn(),
    findById: jest.fn(),
    findActiveByEmployeeId: jest.fn(),
    listByEmployeeId: jest.fn()
  }
}

/** createTenantOrgPortMock builds the org reference validator double for HR management tests. */
function createTenantOrgPortMock(valid = true) {
  return {
    getTenantEmployeeCodePrefix: jest.fn().mockResolvedValue('0AF'),
    validateOrgReference: jest.fn().mockResolvedValue({
      valid,
      rejectionReason: valid ? '' : 'ORG_UNIT_NOT_FOUND'
    })
  }
}

describe('HrManagementService Unit', () => {
  it('CreateEmployee / should create an independent PREBOARDING employee keyed by tenantPartyId', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    const tenantOrgPort = createTenantOrgPortMock()
    employeeRepository.findByTenantPartyId.mockResolvedValue(null)
    employeeRepository.create.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    employeeRepository.findMaxEmployeeCodeSuffix.mockResolvedValue(null)
    const service = new HrManagementService(
      employeeRepository as never,
      employmentRepository as never,
      tenantOrgPort as never
    )

    const employee = await service.createEmployee({
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
    })

    expect(employee.id).toBe('employee-1')
    expect(employee.id).not.toBe('tenant-party-1')
    expect(employee.lifecycleStatus).toBe(EmployeeLifecycleStatus.PREBOARDING)
    expect(employee.employeeCode).toBe('EMP-0AF-0001')
    expect(employeeRepository.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
  })

  it('CreateEmployee / should store an explicit full employee code as a suffix only', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    const tenantOrgPort = createTenantOrgPortMock()
    employeeRepository.findByTenantPartyId.mockResolvedValue(null)
    employeeRepository.create.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '000A',
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    const service = new HrManagementService(
      employeeRepository as never,
      employmentRepository as never,
      tenantOrgPort as never
    )

    const employee = await service.createEmployee({
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: 'EMP-0AF-000A'
    })

    expect(employee.employeeCode).toBe('EMP-0AF-000A')
    expect(employeeRepository.findMaxEmployeeCodeSuffix).not.toHaveBeenCalled()
    expect(employeeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeCode: '000A'
      })
    )
  })

  it('CreateEmployee / should reject duplicate tenantPartyId in the same tenant', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const service = new HrManagementService(
      employeeRepository as never,
      createEmploymentRepositoryMock() as never,
      createTenantOrgPortMock() as never
    )
    employeeRepository.findByTenantPartyId.mockResolvedValue({ id: 'employee-1' })

    await expect(
      service.createEmployee({
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        employeeCode: 'EMP-0AF-0001'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('CreateEmployment / should reject future-dated minimum employments', async () => {
    const service = new HrManagementService(
      createEmployeeRepositoryMock() as never,
      createEmploymentRepositoryMock() as never,
      createTenantOrgPortMock() as never
    )

    await expect(
      service.createEmployment({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-1',
        effectiveFrom: new Date(Date.now() + 60_000)
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('CreateEmployment / should reject a second ACTIVE employment', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const employmentRepository = createEmploymentRepositoryMock()
    const service = new HrManagementService(
      employeeRepository as never,
      employmentRepository as never,
      createTenantOrgPortMock() as never
    )
    employeeRepository.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })
    employmentRepository.findActiveByEmployeeId.mockResolvedValue({
      id: 'employment-1',
      status: EmploymentStatus.ACTIVE
    })

    await expect(
      service.createEmployment({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'org-2',
        effectiveFrom: new Date()
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('EndEmployment / should move employee to OFFBOARDED when no active employment remains', async () => {
    const employmentRepository = createEmploymentRepositoryMock()
    employmentRepository.endActive.mockResolvedValue({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        lifecycleStatus: EmployeeLifecycleStatus.OFFBOARDED
      },
      employment: {
        id: 'employment-1',
        status: EmploymentStatus.ENDED
      }
    })
    const service = new HrManagementService(
      createEmployeeRepositoryMock() as never,
      employmentRepository as never,
      createTenantOrgPortMock() as never
    )

    const result = await service.endEmployment({
      employmentId: 'employment-1',
      effectiveTo: new Date(),
      endedReason: 'left'
    })

    expect(result.employee.lifecycleStatus).toBe(EmployeeLifecycleStatus.OFFBOARDED)
    expect(result.employment.status).toBe(EmploymentStatus.ENDED)
  })

  it('ChangePrimaryEmployment / should delegate one atomic replacement command to the repository', async () => {
    const employmentRepository = createEmploymentRepositoryMock()
    const effectiveFrom = new Date()
    employmentRepository.changePrimary.mockResolvedValue({
      employee: {
        id: 'employee-1',
        tenantId: 'tenant-1',
        lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
      },
      endedEmployment: {
        id: 'employment-1',
        status: EmploymentStatus.ENDED
      },
      newEmployment: {
        id: 'employment-2',
        status: EmploymentStatus.ACTIVE,
        orgUnitId: 'org-2'
      }
    })
    const service = new HrManagementService(
      createEmployeeRepositoryMock() as never,
      employmentRepository as never,
      createTenantOrgPortMock() as never
    )

    const result = await service.changePrimaryEmployment({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      fromEmploymentId: 'employment-1',
      toOrgUnitId: 'org-2',
      positionName: '生产经理',
      effectiveFrom,
      endedReason: 'transfer'
    })

    expect(employmentRepository.changePrimary).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      fromEmploymentId: 'employment-1',
      toOrgUnitId: 'org-2',
      positionName: '生产经理',
      effectiveFrom,
      endedReason: 'transfer'
    })
    expect(result.endedEmployment.status).toBe(EmploymentStatus.ENDED)
    expect(result.newEmployment.status).toBe(EmploymentStatus.ACTIVE)
  })

  it('CreateEmployment / should reject invalid tenant-org references before writing HR truth', async () => {
    const employmentRepository = createEmploymentRepositoryMock()
    const employeeRepository = createEmployeeRepositoryMock()
    employeeRepository.findById.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    employmentRepository.findActiveByEmployeeId.mockResolvedValue(null)
    const service = new HrManagementService(
      employeeRepository as never,
      employmentRepository as never,
      createTenantOrgPortMock(false) as never
    )

    await expect(
      service.createEmployment({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        orgUnitId: 'missing-org',
        effectiveFrom: new Date()
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(employmentRepository.createActive).not.toHaveBeenCalled()
  })

  it('UpdateEmployeeOfficialPhoto / should validate and persist the HR-owned official photo binding', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    employeeRepository.updateOfficialPhoto.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      officialPhotoAssetId: 'asset-1',
      officialPhotoUrl: 'https://assets.example.com/photo.webp'
    })
    const service = new HrManagementService(
      employeeRepository as never,
      createEmploymentRepositoryMock() as never,
      createTenantOrgPortMock() as never
    )

    const employee = await (service as any).updateEmployeeOfficialPhoto({
      tenantId: ' tenant-1 ',
      employeeId: ' employee-1 ',
      officialPhotoAssetId: ' asset-1 ',
      officialPhotoUrl: ' https://assets.example.com/photo.webp '
    })

    expect(employee.officialPhotoAssetId).toBe('asset-1')
    expect(employee.officialPhotoUrl).toBe('https://assets.example.com/photo.webp')
    expect(employeeRepository.updateOfficialPhoto).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1',
      officialPhotoAssetId: 'asset-1',
      officialPhotoUrl: 'https://assets.example.com/photo.webp'
    })
  })

  it('UpdateEmployeeOfficialPhoto / should reject blank official photo urls before writing HR truth', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    const service = new HrManagementService(
      employeeRepository as never,
      createEmploymentRepositoryMock() as never,
      createTenantOrgPortMock() as never
    )

    await expect(
      (service as any).updateEmployeeOfficialPhoto({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        officialPhotoAssetId: 'asset-1',
        officialPhotoUrl: ' '
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(employeeRepository.updateOfficialPhoto).not.toHaveBeenCalled()
  })

  it('UpdateEmployeeOfficialPhoto / should surface tenant-scoped not found from the repository', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    employeeRepository.updateOfficialPhoto.mockRejectedValue(
      new NotFoundException('Employee employee-1 not found')
    )
    const service = new HrManagementService(
      employeeRepository as never,
      createEmploymentRepositoryMock() as never,
      createTenantOrgPortMock() as never
    )

    await expect(
      (service as any).updateEmployeeOfficialPhoto({
        tenantId: 'tenant-2',
        employeeId: 'employee-1',
        officialPhotoAssetId: 'asset-1',
        officialPhotoUrl: 'https://assets.example.com/photo.webp'
      })
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('RemoveEmployeeOfficialPhoto / should clear the HR-owned official photo binding', async () => {
    const employeeRepository = createEmployeeRepositoryMock()
    employeeRepository.removeOfficialPhoto.mockResolvedValue({
      id: 'employee-1',
      tenantId: 'tenant-1',
      tenantPartyId: 'tenant-party-1',
      employeeCode: '0001',
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE,
      officialPhotoAssetId: null,
      officialPhotoUrl: null
    })
    const service = new HrManagementService(
      employeeRepository as never,
      createEmploymentRepositoryMock() as never,
      createTenantOrgPortMock() as never
    )

    const employee = await (service as any).removeEmployeeOfficialPhoto({
      tenantId: ' tenant-1 ',
      employeeId: ' employee-1 '
    })

    expect(employee.officialPhotoAssetId).toBeNull()
    expect(employee.officialPhotoUrl).toBeNull()
    expect(employeeRepository.removeOfficialPhoto).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1'
    })
  })
})
