import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceEnrollmentEntity } from '../../../domain/entities/terminal-device-enrollment.entity'
import { EnrollmentStatus, TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceEnrollmentRepository } from '../../../domain/repositories/terminal-device-enrollment.repository'

export interface ListEnrollmentsQueryInput {
  tenantId: string
  terminalDeviceType?: TerminalDeviceType | null
  status?: EnrollmentStatus | null
  page?: number | null
  pageSize?: number | null
}

export interface ListEnrollmentsResult {
  items: TerminalDeviceEnrollmentEntity[]
  page: number
  pageSize: number
  total: number
}

// ListEnrollmentsQuery carries tenant-scoped enrollment filters for the admin management surface.
export class ListEnrollmentsQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType | null
  readonly status: EnrollmentStatus | null
  readonly page: number
  readonly pageSize: number

  // Constructs an enrollment list query with bounded pagination defaults.
  constructor(input: ListEnrollmentsQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceType = input.terminalDeviceType ?? null
    this.status = input.status ?? null
    this.page = Math.max(1, input.page ?? 1)
    this.pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  }
}

@Injectable()
@QueryHandler(ListEnrollmentsQuery)
// ListEnrollmentsHandler builds enrollment management pages without exposing plaintext enrollment codes.
export class ListEnrollmentsHandler implements IQueryHandler<ListEnrollmentsQuery, ListEnrollmentsResult> {
  constructor(
    @Inject(SYMBOLS.REPO.ENROLLMENT)
    private readonly enrollmentRepository: TerminalDeviceEnrollmentRepository
  ) {}

  // Executes tenant-scoped enrollment listing with simple lifecycle/type filters.
  async execute(query: ListEnrollmentsQuery): Promise<ListEnrollmentsResult> {
    const allEnrollments = await this.enrollmentRepository.listByTenant(query.tenantId)
    const filtered = allEnrollments.filter((enrollment) => {
      if (query.terminalDeviceType && enrollment.terminalDeviceType !== query.terminalDeviceType) {
        return false
      }
      if (query.status && enrollment.status !== query.status) {
        return false
      }
      return true
    })
    const start = (query.page - 1) * query.pageSize

    return {
      items: filtered.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length
    }
  }
}
