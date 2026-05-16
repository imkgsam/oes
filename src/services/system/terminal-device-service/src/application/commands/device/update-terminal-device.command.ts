import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { randomUUID } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'

export interface UpdateTerminalDeviceOperatorContext {
  operatorAccountId: string
  operatorOrgId?: string | null
  traceId?: string | null
}

export interface UpdateTerminalDeviceResult {
  terminalDeviceId: string
  displayName: string
  notes: string | null
  updatedAt: Date
}

export interface UpdateTerminalDeviceCommandInput {
  tenantId: string
  terminalDeviceId: string
  displayName?: string | null
  notes?: string | null
  operatorContext: UpdateTerminalDeviceOperatorContext
  now?: Date
}

// UpdateTerminalDeviceCommand carries non-lifecycle management changes for one tenant-owned terminal device.
export class UpdateTerminalDeviceCommand implements ICommand {
  readonly tenantId: string
  readonly terminalDeviceId: string
  readonly displayName: string | null
  readonly notes: string | null
  readonly operatorContext: UpdateTerminalDeviceOperatorContext
  readonly now?: Date

  // Constructs an update command while normalizing blank display names to "unchanged".
  constructor(input: UpdateTerminalDeviceCommandInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceId = input.terminalDeviceId
    this.displayName = input.displayName?.trim() || null
    this.notes = input.notes ?? null
    this.operatorContext = input.operatorContext
    this.now = input.now
  }
}

@Injectable()
@CommandHandler(UpdateTerminalDeviceCommand)
// UpdateTerminalDeviceHandler applies non-lifecycle device edits and records governance audit metadata.
export class UpdateTerminalDeviceHandler
  implements ICommandHandler<UpdateTerminalDeviceCommand, UpdateTerminalDeviceResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: TerminalDeviceAuditEventRepository
  ) {}

  // Executes a tenant-scoped non-lifecycle update without changing device status or identity facts.
  async execute(command: UpdateTerminalDeviceCommand): Promise<UpdateTerminalDeviceResult> {
    const now = command.now ?? new Date()
    const device = await this.terminalDeviceRepository.findById(command.terminalDeviceId)
    if (!device || device.tenantId !== command.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    const updated = await this.terminalDeviceRepository.update(
      new TerminalDeviceEntity({
        ...device,
        displayName: command.displayName ?? device.displayName,
        notes: command.notes,
        updatedAt: now
      })
    )

    await this.auditEventRepository.create(
      new TerminalDeviceAuditEventEntity({
        auditEventId: randomUUID(),
        tenantId: updated.tenantId,
        operatorAccountId: command.operatorContext.operatorAccountId,
        operatorOrgId: command.operatorContext.operatorOrgId ?? null,
        action: 'DEVICE_UPDATED',
        targetTerminalDeviceId: updated.terminalDeviceId,
        beforeJson: {
          displayName: device.displayName,
          notes: device.notes
        },
        afterJson: {
          displayName: updated.displayName,
          notes: updated.notes
        },
        reason: null,
        traceId: command.operatorContext.traceId ?? null,
        occurredAt: now
      })
    )

    return {
      terminalDeviceId: updated.terminalDeviceId,
      displayName: updated.displayName,
      notes: updated.notes,
      updatedAt: updated.updatedAt
    }
  }
}
