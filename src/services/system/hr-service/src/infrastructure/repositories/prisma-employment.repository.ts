import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {
  ChangePrimaryEmploymentInput,
  ChangePrimaryEmploymentResult,
  CreateActiveEmploymentInput,
  EmploymentMutationResult,
  EmploymentRepository,
  EmploymentSummary,
  EndActiveEmploymentInput
} from '../../domain/repositories'
import { EmployeeLifecycleStatus, EmploymentStatus } from '../../domain/value-objects'
import { PrismaService } from '../prisma/prisma.service'
import { isUniqueConstraintError, mapEmployee } from './prisma-employee.repository'

/** PrismaEmploymentRepository persists Employment records and protects HR-local employment invariants. */
@Injectable()
export class PrismaEmploymentRepository implements EmploymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createActive(input: CreateActiveEmploymentInput): Promise<EmploymentMutationResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const employee = await tx.employee.findFirst({
          where: { id: input.employeeId, tenantId: input.tenantId }
        })
        if (!employee) {
          throw new NotFoundException(`Employee ${input.employeeId} not found`)
        }

        const existingActive = await tx.employment.findFirst({
          where: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            status: EmploymentStatus.ACTIVE
          }
        })
        if (existingActive) {
          throw new ConflictException('Employee already has an active employment')
        }

        const employment = await tx.employment.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            orgUnitId: input.orgUnitId,
            status: EmploymentStatus.ACTIVE,
            effectiveFrom: input.effectiveFrom,
            activeSlot: input.employeeId
          }
        })
        const updatedEmployee = await tx.employee.update({
          where: { id: employee.id },
          data: { lifecycleStatus: EmployeeLifecycleStatus.ACTIVE }
        })

        return {
          employee: mapEmployee(updatedEmployee),
          employment: mapEmployment(employment)
        }
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Employee already has an active employment')
      }
      throw error
    }
  }

  async endActive(input: EndActiveEmploymentInput): Promise<EmploymentMutationResult> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.employment.findUnique({ where: { id: input.employmentId } })
      if (!existing) {
        throw new NotFoundException(`Employment ${input.employmentId} not found`)
      }
      if (existing.status !== EmploymentStatus.ACTIVE) {
        throw new BadRequestException('Only active employment can be ended')
      }
      if (input.effectiveTo.getTime() < existing.effectiveFrom.getTime()) {
        throw new BadRequestException('effectiveTo cannot be earlier than effectiveFrom')
      }

      const employment = await tx.employment.update({
        where: { id: existing.id },
        data: {
          status: EmploymentStatus.ENDED,
          effectiveTo: input.effectiveTo,
          endedReason: input.endedReason ?? null,
          activeSlot: null
        }
      })
      const remainingActive = await tx.employment.count({
        where: {
          tenantId: existing.tenantId,
          employeeId: existing.employeeId,
          status: EmploymentStatus.ACTIVE
        }
      })
      const employee = await tx.employee.update({
        where: { id: existing.employeeId },
        data: {
          lifecycleStatus:
            remainingActive > 0
              ? EmployeeLifecycleStatus.ACTIVE
              : EmployeeLifecycleStatus.OFFBOARDED
        }
      })

      return {
        employee: mapEmployee(employee),
        employment: mapEmployment(employment)
      }
    })
  }

  async changePrimary(input: ChangePrimaryEmploymentInput): Promise<ChangePrimaryEmploymentResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.employment.findFirst({
          where: {
            id: input.fromEmploymentId,
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            status: EmploymentStatus.ACTIVE
          }
        })
        if (!existing) {
          throw new BadRequestException('fromEmploymentId is not the current active employment')
        }
        if (input.effectiveFrom.getTime() < existing.effectiveFrom.getTime()) {
          throw new BadRequestException('new effectiveFrom cannot be earlier than current employment')
        }

        const endedEmployment = await tx.employment.update({
          where: { id: existing.id },
          data: {
            status: EmploymentStatus.ENDED,
            effectiveTo: input.effectiveFrom,
            endedReason: input.endedReason ?? null,
            activeSlot: null
          }
        })
        const newEmployment = await tx.employment.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            orgUnitId: input.toOrgUnitId,
            status: EmploymentStatus.ACTIVE,
            effectiveFrom: input.effectiveFrom,
            activeSlot: input.employeeId
          }
        })
        const employee = await tx.employee.update({
          where: { id: input.employeeId },
          data: { lifecycleStatus: EmployeeLifecycleStatus.ACTIVE }
        })

        return {
          employee: mapEmployee(employee),
          endedEmployment: mapEmployment(endedEmployment),
          newEmployment: mapEmployment(newEmployment)
        }
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Employee already has an active employment')
      }
      throw error
    }
  }

  async findById(employmentId: string): Promise<EmploymentSummary | null> {
    const employment = await this.prisma.employment.findUnique({ where: { id: employmentId } })
    return employment ? mapEmployment(employment) : null
  }

  async findActiveByEmployeeId(
    tenantId: string,
    employeeId: string
  ): Promise<EmploymentSummary | null> {
    const employment = await this.prisma.employment.findFirst({
      where: {
        tenantId,
        employeeId,
        status: EmploymentStatus.ACTIVE
      }
    })
    return employment ? mapEmployment(employment) : null
  }

  async listByEmployeeId(
    tenantId: string,
    employeeId: string,
    status?: EmploymentStatus
  ): Promise<EmploymentSummary[]> {
    const employments = await this.prisma.employment.findMany({
      where: {
        tenantId,
        employeeId,
        status
      },
      orderBy: [{ effectiveFrom: 'asc' }, { createdAt: 'asc' }]
    })
    return employments.map(mapEmployment)
  }
}

/** mapEmployment converts a Prisma employment row to the HR repository summary. */
export function mapEmployment(employment: {
  id: string
  tenantId: string
  employeeId: string
  orgUnitId: string
  status: string
  effectiveFrom: Date
  effectiveTo: Date | null
  endedReason: string | null
}): EmploymentSummary {
  return {
    id: employment.id,
    tenantId: employment.tenantId,
    employeeId: employment.employeeId,
    orgUnitId: employment.orgUnitId,
    status: employment.status as EmploymentStatus,
    effectiveFrom: employment.effectiveFrom,
    effectiveTo: employment.effectiveTo,
    endedReason: employment.endedReason
  }
}
