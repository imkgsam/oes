import { Inject, Injectable } from '@nestjs/common'
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  TerminalDeviceDiagnosticLogPage,
  TerminalDeviceRuntimeSnapshotRepository
} from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'

// ListDiagnosticLogsQuery carries a tenant-scoped request for uploaded PDA diagnostic logs.
export class ListDiagnosticLogsQuery implements IQuery {
  readonly tenantId: string
  readonly terminalDeviceId: string
  readonly page?: number
  readonly pageSize?: number

  // Constructs a diagnostic log history query with service-owned pagination.
  constructor(input: { tenantId: string; terminalDeviceId: string; page?: number; pageSize?: number }) {
    this.tenantId = input.tenantId
    this.terminalDeviceId = input.terminalDeviceId
    this.page = input.page
    this.pageSize = input.pageSize
  }
}

@Injectable()
@QueryHandler(ListDiagnosticLogsQuery)
// ListDiagnosticLogsHandler loads persisted PDA diagnostic logs after tenant ownership verification.
export class ListDiagnosticLogsHandler implements IQueryHandler<ListDiagnosticLogsQuery, TerminalDeviceDiagnosticLogPage> {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository
  ) {}

  // Executes the tenant-scoped diagnostic log history query.
  async execute(query: ListDiagnosticLogsQuery): Promise<TerminalDeviceDiagnosticLogPage> {
    const device = await this.terminalDeviceRepository.findById(query.terminalDeviceId)
    if (!device || device.tenantId !== query.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    return this.runtimeSnapshotRepository.listDiagnosticLogs({
      tenantId: query.tenantId,
      terminalDeviceId: query.terminalDeviceId,
      page: query.page,
      pageSize: query.pageSize
    })
  }
}
