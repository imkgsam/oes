import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'
import {
  TerminalDeviceHeartbeatRecordPage,
  TerminalDeviceRuntimeSnapshotRepository
} from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'

export interface ListHeartbeatRecordsQueryInput {
  tenantId: string
  terminalDeviceId: string
  page?: number
  pageSize?: number
}

// ListHeartbeatRecordsQuery carries a tenant-scoped request for heartbeat diagnostics history.
export class ListHeartbeatRecordsQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceId: string
  readonly page?: number
  readonly pageSize?: number

  // Constructs a heartbeat history query with pagination owned by the service boundary.
  constructor(input: ListHeartbeatRecordsQueryInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceId = input.terminalDeviceId
    this.page = input.page
    this.pageSize = input.pageSize
  }
}

@Injectable()
@QueryHandler(ListHeartbeatRecordsQuery)
// ListHeartbeatRecordsHandler loads heartbeat diagnostics after verifying device tenant ownership.
export class ListHeartbeatRecordsHandler implements IQueryHandler<ListHeartbeatRecordsQuery, TerminalDeviceHeartbeatRecordPage> {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository
  ) {}

  async execute(query: ListHeartbeatRecordsQuery): Promise<TerminalDeviceHeartbeatRecordPage> {
    const device = await this.terminalDeviceRepository.findById(query.terminalDeviceId)
    if (!device || device.tenantId !== query.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    return this.runtimeSnapshotRepository.listHeartbeatRecords({
      tenantId: query.tenantId,
      terminalDeviceId: query.terminalDeviceId,
      page: query.page,
      pageSize: query.pageSize
    })
  }
}
