import { Injectable } from '@nestjs/common'
import { EmployeeBindingRepository } from '../../../domain/repositories/employee-binding.repository'
import { EmployeeBindingSummaryEntity } from '../../../domain/entities/employee-binding-summary.entity'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaEmployeeBindingRepository persists identity-owned UserAccount-to-Employee binding facts. */
@Injectable()
export class PrismaEmployeeBindingRepository implements EmployeeBindingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async bind(input: {
    tenantId: string
    accountId: string
    employeeId: string
  }): Promise<EmployeeBindingSummaryEntity> {
    const record = await this.prisma.userAccountEmployeeBinding.upsert({
      where: {
        accountId: input.accountId
      },
      update: {
        tenantId: input.tenantId,
        employeeId: input.employeeId
      },
      create: {
        tenantId: input.tenantId,
        accountId: input.accountId,
        employeeId: input.employeeId
      }
    })

    return toEntity(record)
  }

  async findByAccountId(accountId: string): Promise<EmployeeBindingSummaryEntity | null> {
    const record = await this.prisma.userAccountEmployeeBinding.findUnique({
      where: {
        accountId
      }
    })

    return record ? toEntity(record) : null
  }

  async findByEmployeeId(employeeId: string): Promise<EmployeeBindingSummaryEntity | null> {
    const record = await this.prisma.userAccountEmployeeBinding.findUnique({
      where: {
        employeeId
      }
    })

    return record ? toEntity(record) : null
  }

  async unbindByAccountId(accountId: string): Promise<EmployeeBindingSummaryEntity | null> {
    const existing = await this.prisma.userAccountEmployeeBinding.findUnique({
      where: {
        accountId
      }
    })

    if (!existing) {
      return null
    }

    await this.prisma.userAccountEmployeeBinding.delete({
      where: {
        accountId
      }
    })

    return toEntity(existing)
  }
}

function toEntity(record: {
  id: string
  tenantId: string
  accountId: string
  employeeId: string
}): EmployeeBindingSummaryEntity {
  return new EmployeeBindingSummaryEntity(
    record.id,
    record.tenantId,
    record.accountId,
    record.employeeId
  )
}
