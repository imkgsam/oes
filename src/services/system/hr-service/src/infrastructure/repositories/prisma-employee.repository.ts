import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateEmployeeInput,
  EmployeeListResult,
  EmployeeRepository,
  EmployeeSummary,
  ListEmployeesInput
} from '../../domain/repositories'
import { EmployeeLifecycleStatus } from '../../domain/value-objects'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaEmployeeRepository persists Employee master records for hr-service. */
@Injectable()
export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateEmployeeInput): Promise<EmployeeSummary> {
    try {
      const employee = await this.prisma.employee.create({
        data: {
          tenantId: input.tenantId,
          tenantPartyId: input.tenantPartyId,
          partyId: input.partyId ?? null,
          employeeCode: input.employeeCode,
          lifecycleStatus: input.lifecycleStatus
        }
      })
      return mapEmployee(employee)
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Employee unique constraint violated')
      }
      throw error
    }
  }

  async findById(employeeId: string): Promise<EmployeeSummary | null> {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } })
    return employee ? mapEmployee(employee) : null
  }

  /** findMaxEmployeeCodeSuffix returns the greatest tenant-scoped HR-owned suffix for code generation. */
  async findMaxEmployeeCodeSuffix(tenantId: string): Promise<string | null> {
    const result = await this.prisma.employee.aggregate({
      where: { tenantId },
      _max: { employeeCode: true }
    })
    return result._max.employeeCode ?? null
  }

  /** findByTenantAndEmployeeCode resolves one employee using exact tenant-scoped employee code matching. */
  async findByTenantAndEmployeeCode(
    tenantId: string,
    employeeCode: string
  ): Promise<EmployeeSummary | null> {
    const employee = await this.prisma.employee.findFirst({
      where: { tenantId, employeeCode }
    })
    return employee ? mapEmployee(employee) : null
  }

  async findByTenantPartyId(
    tenantId: string,
    tenantPartyId: string
  ): Promise<EmployeeSummary | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { tenantId_tenantPartyId: { tenantId, tenantPartyId } }
    })
    return employee ? mapEmployee(employee) : null
  }

  async listByTenant(input: ListEmployeesInput): Promise<EmployeeListResult> {
    const page = Math.max(input.page, 1)
    const pageSize = Math.max(input.pageSize, 1)
    const where = {
      tenantId: input.tenantId,
      ...(input.lifecycleStatus ? { lifecycleStatus: input.lifecycleStatus } : {}),
      ...(input.keyword
        ? {
            OR: [
              { employeeCode: { contains: input.keyword, mode: 'insensitive' as const } },
              { tenantPartyId: { contains: input.keyword, mode: 'insensitive' as const } },
              { partyId: { contains: input.keyword, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: [{ employeeCode: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.employee.count({ where })
    ])

    return {
      items: employees.map(mapEmployee),
      page,
      pageSize,
      total
    }
  }

  async setLifecycleStatus(input: {
    tenantId: string
    employeeId: string
    lifecycleStatus: EmployeeLifecycleStatus
  }): Promise<EmployeeSummary> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: input.employeeId, tenantId: input.tenantId }
    })
    if (!employee) {
      throw new NotFoundException(`Employee ${input.employeeId} not found`)
    }

    const updated = await this.prisma.employee.update({
      where: { id: employee.id },
      data: { lifecycleStatus: input.lifecycleStatus }
    })
    return mapEmployee(updated)
  }
}

/** mapEmployee converts a Prisma employee row to the HR repository summary. */
export function mapEmployee(employee: {
  id: string
  tenantId: string
  tenantPartyId: string
  partyId: string | null
  employeeCode: string
  lifecycleStatus: string
}): EmployeeSummary {
  return {
    id: employee.id,
    tenantId: employee.tenantId,
    tenantPartyId: employee.tenantPartyId,
    partyId: employee.partyId,
    employeeCode: employee.employeeCode,
    lifecycleStatus: employee.lifecycleStatus as EmployeeLifecycleStatus
  }
}

/** isUniqueConstraintError identifies Prisma unique constraint failures without leaking Prisma types. */
export function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002')
}
