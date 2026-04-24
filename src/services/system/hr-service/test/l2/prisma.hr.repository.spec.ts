import { BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaEmployeeRepository } from '../../src/infrastructure/repositories/prisma-employee.repository'
import { PrismaEmploymentRepository } from '../../src/infrastructure/repositories/prisma-employment.repository'
import { PrismaOnboardingAccessRepository } from '../../src/infrastructure/repositories/prisma-onboarding-access.repository'
import {
  EmployeeLifecycleStatus,
  EmploymentStatus,
  OnboardingAccessStatus
} from '../../src/domain/value-objects'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('HR Prisma repositories L2', () => {
  let prisma: PrismaService
  let employeeRepository: PrismaEmployeeRepository
  let employmentRepository: PrismaEmploymentRepository
  let onboardingRepository: PrismaOnboardingAccessRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    employeeRepository = new PrismaEmployeeRepository(prisma)
    employmentRepository = new PrismaEmploymentRepository(prisma)
    onboardingRepository = new PrismaOnboardingAccessRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('Employee / should enforce unique tenantId + tenantPartyId', async () => {
    await employeeRepository.create({
      tenantId: `${prefix}_tenant`,
      tenantPartyId: `${prefix}_tenant_party`,
      partyId: `${prefix}_party`,
      employeeCode: `${prefix}_E001`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })

    await expect(
      employeeRepository.create({
        tenantId: `${prefix}_tenant`,
        tenantPartyId: `${prefix}_tenant_party`,
        partyId: `${prefix}_party`,
        employeeCode: `${prefix}_E002`,
        lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('Employment / should enforce one ACTIVE employment per employee', async () => {
    const employee = await employeeRepository.create({
      tenantId: `${prefix}_tenant`,
      tenantPartyId: `${prefix}_tenant_party`,
      employeeCode: `${prefix}_E001`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    await employmentRepository.createActive({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      orgUnitId: `${prefix}_org_1`,
      effectiveFrom: new Date()
    })

    await expect(
      employmentRepository.createActive({
        tenantId: employee.tenantId,
        employeeId: employee.id,
        orgUnitId: `${prefix}_org_2`,
        effectiveFrom: new Date()
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('ChangePrimaryEmployment / should atomically end old employment and create the new active one', async () => {
    const employee = await employeeRepository.create({
      tenantId: `${prefix}_tenant`,
      tenantPartyId: `${prefix}_tenant_party`,
      employeeCode: `${prefix}_E001`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    const created = await employmentRepository.createActive({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      orgUnitId: `${prefix}_org_1`,
      effectiveFrom: new Date('2026-04-23T00:00:00.000Z')
    })

    const result = await employmentRepository.changePrimary({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      fromEmploymentId: created.employment.id,
      toOrgUnitId: `${prefix}_org_2`,
      effectiveFrom: new Date('2026-04-23T01:00:00.000Z'),
      endedReason: 'transfer'
    })
    const active = await employmentRepository.findActiveByEmployeeId(employee.tenantId, employee.id)
    const history = await employmentRepository.listByEmployeeId(employee.tenantId, employee.id)

    expect(result.endedEmployment.status).toBe(EmploymentStatus.ENDED)
    expect(result.newEmployment.status).toBe(EmploymentStatus.ACTIVE)
    expect(active?.id).toBe(result.newEmployment.id)
    expect(history).toHaveLength(2)
  })

  it('ChangePrimaryEmployment / should not leave half-written state when source employment does not match', async () => {
    const employee = await employeeRepository.create({
      tenantId: `${prefix}_tenant`,
      tenantPartyId: `${prefix}_tenant_party`,
      employeeCode: `${prefix}_E001`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    await employmentRepository.createActive({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      orgUnitId: `${prefix}_org_1`,
      effectiveFrom: new Date('2026-04-23T00:00:00.000Z')
    })

    await expect(
      employmentRepository.changePrimary({
        tenantId: employee.tenantId,
        employeeId: employee.id,
        fromEmploymentId: '00000000-0000-0000-0000-000000000000',
        toOrgUnitId: `${prefix}_org_2`,
        effectiveFrom: new Date('2026-04-23T01:00:00.000Z')
      })
    ).rejects.toBeInstanceOf(BadRequestException)

    const history = await employmentRepository.listByEmployeeId(employee.tenantId, employee.id)
    expect(history).toHaveLength(1)
    expect(history[0].status).toBe(EmploymentStatus.ACTIVE)
  })

  it('OnboardingAccess / should persist retryable compensation status without binding or grant truth tables', async () => {
    const employee = await employeeRepository.create({
      tenantId: `${prefix}_tenant`,
      tenantPartyId: `${prefix}_tenant_party`,
      employeeCode: `${prefix}_E001`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    const created = await employmentRepository.createActive({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      orgUnitId: `${prefix}_org_1`,
      effectiveFrom: new Date()
    })

    const process = await onboardingRepository.recordAccessStatus({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      employmentId: created.employment.id,
      accountId: `${prefix}_account`,
      status: OnboardingAccessStatus.ACCESS_GRANT_PENDING,
      grantIdempotencyKey: `${prefix}_grant_key`,
      failureReason: 'permission-service unavailable'
    })

    expect(process.status).toBe(OnboardingAccessStatus.ACCESS_GRANT_PENDING)
    expect(process.accountId).toBe(`${prefix}_account`)
    expect((prisma as any).userAccountEmployeeBinding).toBeUndefined()
    expect((prisma as any).accountRole).toBeUndefined()
  })

  it('OnboardingAccess / should load the latest employee-scoped compensation record for member access summary queries', async () => {
    const employee = await employeeRepository.create({
      tenantId: `${prefix}_tenant_latest`,
      tenantPartyId: `${prefix}_tenant_party_latest`,
      employeeCode: `${prefix}_E002`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    const created = await employmentRepository.createActive({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      orgUnitId: `${prefix}_org_latest`,
      effectiveFrom: new Date()
    })

    await onboardingRepository.recordAccessStatus({
      tenantId: employee.tenantId,
      employeeId: employee.id,
      employmentId: created.employment.id,
      status: OnboardingAccessStatus.ACCOUNT_BINDING_PENDING,
      failureReason: 'identity unavailable'
    })

    const latest = await onboardingRepository.findLatestByEmployeeId(employee.tenantId, employee.id)

    expect(latest).toEqual(
      expect.objectContaining({
        tenantId: employee.tenantId,
        employeeId: employee.id,
        employmentId: created.employment.id,
        status: OnboardingAccessStatus.ACCOUNT_BINDING_PENDING,
        failureReason: 'identity unavailable'
      })
    )
  })

  it('Queries / should not leak employees across tenants', async () => {
    await employeeRepository.create({
      tenantId: `${prefix}_tenant_a`,
      tenantPartyId: `${prefix}_tenant_party_a`,
      employeeCode: `${prefix}_A001`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    await employeeRepository.create({
      tenantId: `${prefix}_tenant_b`,
      tenantPartyId: `${prefix}_tenant_party_b`,
      employeeCode: `${prefix}_B001`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })

    const found = await employeeRepository.findByTenantPartyId(
      `${prefix}_tenant_a`,
      `${prefix}_tenant_party_b`
    )

    expect(found).toBeNull()
  })

  it('ListEmployees / should page one tenant directory without leaking or reordering other tenant rows', async () => {
    await employeeRepository.create({
      tenantId: `${prefix}_tenant_a`,
      tenantPartyId: `${prefix}_tenant_party_a_1`,
      employeeCode: `${prefix}_A001`,
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })
    await employeeRepository.create({
      tenantId: `${prefix}_tenant_a`,
      tenantPartyId: `${prefix}_tenant_party_a_2`,
      employeeCode: `${prefix}_A002`,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
    await employeeRepository.create({
      tenantId: `${prefix}_tenant_b`,
      tenantPartyId: `${prefix}_tenant_party_b_1`,
      employeeCode: `${prefix}_B001`,
      lifecycleStatus: EmployeeLifecycleStatus.ACTIVE
    })

    const firstPage = await employeeRepository.listByTenant({
      tenantId: `${prefix}_tenant_a`,
      keyword: `${prefix}_A`,
      page: 1,
      pageSize: 1
    })
    const secondPage = await employeeRepository.listByTenant({
      tenantId: `${prefix}_tenant_a`,
      keyword: `${prefix}_A`,
      page: 2,
      pageSize: 1
    })

    expect(firstPage.total).toBe(2)
    expect(firstPage.items).toHaveLength(1)
    expect(firstPage.items[0].employeeCode).toBe(`${prefix}_A001`)
    expect(secondPage.total).toBe(2)
    expect(secondPage.items).toHaveLength(1)
    expect(secondPage.items[0].employeeCode).toBe(`${prefix}_A002`)
  })
})
