import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { randomUUID } from 'crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceDiagnosticLogEntity } from '../../../domain/entities/terminal-device-diagnostic-log.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'
import { TerminalDeviceRuntimeSnapshotRepository } from '../../../domain/repositories/terminal-device-runtime-snapshot.repository'

export interface RecordDiagnosticLogInput {
  accountId?: string | null
  sessionId?: string | null
  clientTime: Date
  receivedAt: Date
  level: string
  eventType: string
  message: string
  traceId?: string | null
  requestId?: string | null
  errorCode?: string | null
  diagnosticMode: boolean
  details: Record<string, unknown>
}

export interface RecordDiagnosticLogsCommandInput {
  tenantId: string
  terminalDeviceId: string
  logs: RecordDiagnosticLogInput[]
}

export interface RecordDiagnosticLogsResult {
  accepted: boolean
  receivedCount: number
}

// RecordDiagnosticLogsCommand carries sanitized manual PDA diagnostic logs into the service boundary.
export class RecordDiagnosticLogsCommand implements ICommand {
  readonly tenantId: string
  readonly terminalDeviceId: string
  readonly logs: RecordDiagnosticLogInput[]

  // Constructs a diagnostic log command scoped to one tenant-owned terminal device.
  constructor(input: RecordDiagnosticLogsCommandInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceId = input.terminalDeviceId
    this.logs = input.logs
  }
}

@Injectable()
@CommandHandler(RecordDiagnosticLogsCommand)
// RecordDiagnosticLogsHandler persists sanitized manual diagnostics without owning application observability.
export class RecordDiagnosticLogsHandler implements ICommandHandler<RecordDiagnosticLogsCommand, RecordDiagnosticLogsResult> {
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.RUNTIME_SNAPSHOT)
    private readonly runtimeSnapshotRepository: TerminalDeviceRuntimeSnapshotRepository
  ) {}

  // Executes log persistence after verifying the device belongs to the supplied tenant.
  async execute(command: RecordDiagnosticLogsCommand): Promise<RecordDiagnosticLogsResult> {
    const device = await this.terminalDeviceRepository.findById(command.terminalDeviceId)
    if (!device || device.tenantId !== command.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    await this.runtimeSnapshotRepository.appendDiagnosticLogs(
      command.logs.map(
        (log) =>
          new TerminalDeviceDiagnosticLogEntity({
            diagnosticLogId: randomUUID(),
            tenantId: command.tenantId,
            terminalDeviceId: command.terminalDeviceId,
            accountId: log.accountId ?? null,
            sessionId: log.sessionId ?? null,
            clientTime: log.clientTime,
            receivedAt: log.receivedAt,
            level: log.level,
            eventType: log.eventType,
            message: log.message,
            traceId: log.traceId ?? null,
            requestId: log.requestId ?? null,
            errorCode: log.errorCode ?? null,
            diagnosticMode: log.diagnosticMode,
            details: log.details
          })
      )
    )

    return {
      accepted: true,
      receivedCount: command.logs.length
    }
  }
}
