import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceEnrollmentEntity } from '../../../domain/entities/terminal-device-enrollment.entity'
import { TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { TerminalDeviceEnrollmentRepository } from '../../../domain/repositories/terminal-device-enrollment.repository'

export interface EnrollmentOperatorContext {
  operatorAccountId: string
  operatorOrgId?: string | null
  traceId?: string | null
}

export interface CreateEnrollmentResult {
  enrollmentId: string
  tenantId: string
  terminalDeviceType: TerminalDeviceType
  displayName: string
  status: 'ISSUED'
  enrollmentCode: string
  expiresAt: Date
  createdAt: Date
}

export interface CreateEnrollmentCommandInput {
  tenantId: string
  terminalDeviceType: TerminalDeviceType
  displayName: string
  expectedManufacturerSerial?: string | null
  expiresAt: Date
  notes?: string | null
  operatorContext: EnrollmentOperatorContext
  now?: Date
}

// CreateEnrollmentCommand carries an administrator request to issue a short-lived PDA enrollment.
export class CreateEnrollmentCommand implements ICommand {
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType
  readonly displayName: string
  readonly expectedManufacturerSerial: string | null
  readonly expiresAt: Date
  readonly notes: string | null
  readonly operatorContext: EnrollmentOperatorContext
  readonly now?: Date

  // Constructs the create enrollment command with normalized nullable optional fields.
  constructor(input: CreateEnrollmentCommandInput) {
    this.tenantId = input.tenantId
    this.terminalDeviceType = input.terminalDeviceType
    this.displayName = input.displayName
    this.expectedManufacturerSerial = input.expectedManufacturerSerial ?? null
    this.expiresAt = input.expiresAt
    this.notes = input.notes ?? null
    this.operatorContext = input.operatorContext
    this.now = input.now
  }
}

@Injectable()
@CommandHandler(CreateEnrollmentCommand)
// CreateEnrollmentHandler persists a one-time enrollment with only a hashed activation code.
export class CreateEnrollmentHandler implements ICommandHandler<CreateEnrollmentCommand, CreateEnrollmentResult> {
  constructor(
    @Inject(SYMBOLS.REPO.ENROLLMENT)
    private readonly enrollmentRepository: TerminalDeviceEnrollmentRepository,
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: TerminalDeviceAuditEventRepository
  ) {}

  // Executes enrollment issuance and records the governance audit fact.
  async execute(command: CreateEnrollmentCommand): Promise<CreateEnrollmentResult> {
    if (command.terminalDeviceType !== 'PDA') {
      throw new TerminalDeviceError('UNSUPPORTED_TERMINAL_DEVICE_TYPE', 'Only PDA enrollment is supported in Phase 2')
    }

    const now = command.now ?? new Date()
    if (command.expiresAt.getTime() <= now.getTime()) {
      throw new TerminalDeviceError('ENROLLMENT_EXPIRATION_NOT_FUTURE', 'Enrollment expiration must be in the future')
    }

    const enrollmentCode = generateEnrollmentCode()
    const enrollment = await this.enrollmentRepository.create(
      new TerminalDeviceEnrollmentEntity({
        enrollmentId: randomUUID(),
        tenantId: command.tenantId,
        terminalDeviceType: command.terminalDeviceType,
        displayName: command.displayName,
        codeHash: hashEnrollmentCode(enrollmentCode),
        status: 'ISSUED',
        expectedManufacturerSerial: command.expectedManufacturerSerial,
        expiresAt: command.expiresAt,
        usedAt: null,
        usedByTerminalDeviceId: null,
        revokedAt: null,
        revokedBy: null,
        createdBy: command.operatorContext.operatorAccountId,
        createdAt: now,
        notes: command.notes
      })
    )

    await this.auditEventRepository.create(
      new TerminalDeviceAuditEventEntity({
        auditEventId: randomUUID(),
        tenantId: enrollment.tenantId,
        operatorAccountId: command.operatorContext.operatorAccountId,
        operatorOrgId: command.operatorContext.operatorOrgId ?? null,
        action: 'ENROLLMENT_CREATED',
        targetTerminalDeviceId: null,
        beforeJson: null,
        afterJson: {
          enrollmentId: enrollment.enrollmentId,
          status: enrollment.status,
          terminalDeviceType: enrollment.terminalDeviceType,
          expiresAt: enrollment.expiresAt.toISOString()
        },
        reason: null,
        traceId: command.operatorContext.traceId ?? null,
        occurredAt: now
      })
    )

    return {
      enrollmentId: enrollment.enrollmentId,
      tenantId: enrollment.tenantId,
      terminalDeviceType: enrollment.terminalDeviceType,
      displayName: enrollment.displayName,
      status: 'ISSUED',
      enrollmentCode,
      expiresAt: enrollment.expiresAt,
      createdAt: enrollment.createdAt
    }
  }
}

// hashEnrollmentCode creates the non-plaintext digest persisted for enrollment validation.
export function hashEnrollmentCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

// generateEnrollmentCode creates a compact human-enterable one-time enrollment code.
function generateEnrollmentCode(): string {
  return `ENR-${randomBytes(8).toString('base64url').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 12).padEnd(12, '0')}`
}
