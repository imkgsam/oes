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
import { TerminalDeviceUnavailableEventPublisher } from '../../events'

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
  statusReason: string | null
  changedAt: Date
  sessionRevokeIntent: TerminalDeviceSessionRevokeIntent | null
}

export interface ChangeTerminalDeviceStatusCommandInput {
  tenantId: string
  terminalDeviceId: string
  targetStatus: TerminalDeviceStatus
  reason?: string | null
  operatorContext: ChangeTerminalDeviceStatusOperatorContext
  now?: Date
}

// ChangeTerminalDeviceStatusCommand carries an administrator lifecycle transition request for one terminal device.
export class ChangeTerminalDeviceStatusCommand implements ICommand {
  readonly tenantId: string
  readonly terminalDeviceId: string
  readonly targetStatus: TerminalDeviceStatus
  readonly reason: string | null
  readonly operatorContext: ChangeTerminalDeviceStatusOperatorContext
  readonly now?: Date

  // Constructs a lifecycle command with normalized nullable reason and operator metadata.
  constructor(input: ChangeTerminalDeviceStatusCommandInput) {
    this.tenantId = input.tenantId
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
    private readonly auditEventRepository: TerminalDeviceAuditEventRepository,
    @Inject(SYMBOLS.EVENT_PUBLISHER.TERMINAL_DEVICE_UNAVAILABLE)
    private readonly unavailableEventPublisher?: TerminalDeviceUnavailableEventPublisher
  ) {}

  // Executes a lifecycle transition with audit and session revoke intent generation.
  async execute(command: ChangeTerminalDeviceStatusCommand): Promise<ChangeTerminalDeviceStatusResult> {
    const now = command.now ?? new Date()
    const device = await this.terminalDeviceRepository.findById(command.terminalDeviceId)
    if (!device || device.tenantId !== command.tenantId) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_NOT_FOUND', 'Terminal device not found')
    }

    assertTransitionAllowed(device.status, command.targetStatus)

    const updated = await this.terminalDeviceRepository.update(
      new TerminalDeviceEntity({
        ...device,
        status: command.targetStatus,
        statusReason: command.reason,
        deviceCredentialState: credentialStateFor(command.targetStatus, device.deviceCredentialState),
        ...(command.targetStatus === 'DECOMMISSIONED'
          ? { deviceCredentialHash: null, deviceCredentialPreviousHash: null, deviceCredentialPreviousVersion: null, deviceCredentialExpiresAt: null, deviceCredentialPreviousExpiresAt: null }
          : {}),
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

    if (isUnavailableStatus(updated.status)) {
      await this.unavailableEventPublisher?.publish({
        tenantId: updated.tenantId,
        terminalDeviceId: updated.terminalDeviceId,
        previousStatus: device.status,
        newStatus: updated.status,
        operatorAccountId: command.operatorContext.operatorAccountId,
        operatorOrgId: command.operatorContext.operatorOrgId ?? null,
        traceId: command.operatorContext.traceId ?? null,
        reason: command.reason,
        occurredAt: now
      })
    }

    return {
      terminalDeviceId: updated.terminalDeviceId,
      tenantId: updated.tenantId,
      previousStatus: device.status,
      deviceStatus: updated.status,
      statusReason: updated.statusReason,
      changedAt: now,
      sessionRevokeIntent: !isUnavailableStatus(updated.status)
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

/** Maps lifecycle transitions onto the frozen device-proof state without affecting the Redis event contract. */
function credentialStateFor(status: TerminalDeviceStatus, current: 'ACTIVE' | 'SUSPENDED' | 'REVOKED'): 'ACTIVE' | 'SUSPENDED' | 'REVOKED' {
  if (status === 'DECOMMISSIONED') return 'REVOKED'
  if (status === 'DISABLED' || status === 'LOST' || status === 'MAINTENANCE') return 'SUSPENDED'
  if (status === 'ACTIVE' && current === 'SUSPENDED') return 'ACTIVE'
  return current
}

// isUnavailableStatus identifies lifecycle states that make existing auth sessions unsafe to keep.
function isUnavailableStatus(status: TerminalDeviceStatus): boolean {
  return (
    status === 'DISABLED' ||
    status === 'LOST' ||
    status === 'MAINTENANCE' ||
    status === 'DECOMMISSIONED'
  )
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
