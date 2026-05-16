import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'

export interface ListTerminalDeviceAuditEventsQueryInput {
  tenantId: string
  terminalDeviceId: string
  page?: number | null
  pageSize?: number | null
}

export interface ListTerminalDeviceAuditEventsResult {
  items: TerminalDeviceAuditEventEntity[]
  page: number
  pageSize: number
  total: number
}

// ListTerminalDeviceAuditEventsQuery carries a tenant-scoped device governance audit read request.
export class ListTerminalDeviceAuditEventsQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceId: string
  readonly page: number
  readonly pageSize: number

  // Constructs an audit list query with bounded pagination defaults.
  constructor(input: ListTerminalDeviceAuditEventsQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceId = input.terminalDeviceId
    this.page = Math.max(1, input.page ?? 1)
    this.pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  }
}

@Injectable()
@QueryHandler(ListTerminalDeviceAuditEventsQuery)
// ListTerminalDeviceAuditEventsHandler returns governance audit events after verifying tenant ownership.
export class ListTerminalDeviceAuditEventsHandler
  implements IQueryHandler<ListTerminalDeviceAuditEventsQuery, ListTerminalDeviceAuditEventsResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: TerminalDeviceAuditEventRepository
  ) {}

  // Executes a tenant-scoped audit query and keeps pagination in the application layer.
  async execute(query: ListTerminalDeviceAuditEventsQuery): Promise<ListTerminalDeviceAuditEventsResult> {
    const device = await this.terminalDeviceRepository.findById(query.terminalDeviceId)
    if (!device || device.tenantId !== query.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    const events = await this.auditEventRepository.listByTerminalDeviceId(query.tenantId, query.terminalDeviceId)
    const start = (query.page - 1) * query.pageSize

    return {
      items: events.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: events.length
    }
  }
}
