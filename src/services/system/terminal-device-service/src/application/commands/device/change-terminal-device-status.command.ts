import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { randomUUID } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceStatus } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'

export interface ChangeTerminalDeviceStatusOperatorContext {
  operatorAccountId: string
  operatorOrgId?: string | null
  traceId?: string | null
}

export interface TerminalDeviceSessionRevokeIntent {
  tenantId: string
  terminalDeviceId: string
  terminal: 'PDA'
  shouldRevokeServerSessions: true
  reason: string | null
  requestedAt: Date
}

export interface ChangeTerminalDeviceStatusResult {
  terminalDeviceId: string
  tenantId: string
  previousStatus: TerminalDeviceStatus
  deviceStatus: TerminalDeviceStatus
  sessionRevokeIntent: TerminalDeviceSessionRevokeIntent | null
}

export interface ChangeTerminalDeviceStatusCommandInput {
  terminalDeviceId: string
  targetStatus: TerminalDeviceStatus
  reason?: string | null
  operatorContext: ChangeTerminalDeviceStatusOperatorContext
  now?: Date
}

// ChangeTerminalDeviceStatusCommand carries an administrator lifecycle transition request for one terminal device.
export class ChangeTerminalDeviceStatusCommand implements ICommand {
  readonly terminalDeviceId: string
  readonly targetStatus: TerminalDeviceStatus
  readonly reason: string | null
  readonly operatorContext: ChangeTerminalDeviceStatusOperatorContext
  readonly now?: Date

  // Constructs a lifecycle command with normalized nullable reason and operator metadata.
  constructor(input: ChangeTerminalDeviceStatusCommandInput) {
    this.terminalDeviceId = input.terminalDeviceId
    this.targetStatus = input.targetStatus
    this.reason = input.reason ?? null
    this.operatorContext = input.operatorContext
    this.now = input.now
  }
}

@Injectable()
@CommandHandler(ChangeTerminalDeviceStatusCommand)
// ChangeTerminalDeviceStatusHandler applies lifecycle transition rules and emits a session revoke intent when needed.
export class ChangeTerminalDeviceStatusHandler
  implements ICommandHandler<ChangeTerminalDeviceStatusCommand, ChangeTerminalDeviceStatusResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: TerminalDeviceAuditEventRepository
  ) {}

  // Executes a lifecycle transition with audit and session revoke intent generation.
  async execute(command: ChangeTerminalDeviceStatusCommand): Promise<ChangeTerminalDeviceStatusResult> {
    const now = command.now ?? new Date()
    const device = await this.terminalDeviceRepository.findById(command.terminalDeviceId)
    if (!device) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    assertTransitionAllowed(device.status, command.targetStatus)
    assertReasonPresentIfRequired(device.status, command.targetStatus, command.reason)

    const updated = await this.terminalDeviceRepository.update(
      new TerminalDeviceEntity({
        ...device,
        status: command.targetStatus,
        statusReason: command.reason,
        updatedAt: now
      })
    )

    await this.auditEventRepository.create(
      new TerminalDeviceAuditEventEntity({
        auditEventId: randomUUID(),
        tenantId: device.tenantId,
        operatorAccountId: command.operatorContext.operatorAccountId,
        operatorOrgId: command.operatorContext.operatorOrgId ?? null,
        action: 'STATUS_CHANGED',
        targetTerminalDeviceId: device.terminalDeviceId,
        beforeJson: {
          status: device.status,
          statusReason: device.statusReason
        },
        afterJson: {
          status: updated.status,
          statusReason: updated.statusReason
        },
        reason: command.reason,
        traceId: command.operatorContext.traceId ?? null,
        occurredAt: now
      })
    )

    return {
      terminalDeviceId: updated.terminalDeviceId,
      tenantId: updated.tenantId,
      previousStatus: device.status,
      deviceStatus: updated.status,
      sessionRevokeIntent: updated.status === 'ACTIVE'
        ? null
        : {
            tenantId: updated.tenantId,
            terminalDeviceId: updated.terminalDeviceId,
            terminal: 'PDA',
            shouldRevokeServerSessions: true,
            reason: command.reason,
            requestedAt: now
          }
    }
  }
}

// assertTransitionAllowed protects terminal lifecycle invariants from invalid direct restoration.
function assertTransitionAllowed(currentStatus: TerminalDeviceStatus, targetStatus: TerminalDeviceStatus): void {
  if (currentStatus === 'DECOMMISSIONED' && targetStatus !== 'DECOMMISSIONED') {
    throw new TerminalDeviceError(
      'TERMINAL_DEVICE_DECOMMISSIONED_CANNOT_RESTORE',
      'Decommissioned terminal devices cannot leave terminal status'
    )
  }
}

// assertReasonPresentIfRequired enforces audit-ready reasons for high-risk lifecycle transitions.
function assertReasonPresentIfRequired(
  currentStatus: TerminalDeviceStatus,
  targetStatus: TerminalDeviceStatus,
  reason: string | null
): void {
  const restoresToActive = currentStatus !== 'ACTIVE' && targetStatus === 'ACTIVE'
  const movesToNonActive = targetStatus !== 'ACTIVE'
  if ((restoresToActive || movesToNonActive) && !reason?.trim()) {
    throw new TerminalDeviceError('TERMINAL_DEVICE_STATUS_REASON_REQUIRED', 'Lifecycle transition reason is required')
  }
}
