import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { randomUUID } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceAuditEventRepository } from '../../../domain/repositories/terminal-device-audit-event.repository'
import { TerminalDeviceEnrollmentRepository } from '../../../domain/repositories/terminal-device-enrollment.repository'
import { EnrollmentOperatorContext } from './create-enrollment.command'

export interface RevokeEnrollmentResult {
  enrollmentId: string
  status: 'REVOKED'
  revokedAt: Date
  revokedBy: string
}

export interface RevokeEnrollmentCommandInput {
  tenantId: string
  enrollmentId: string
  reason: string
  operatorContext: EnrollmentOperatorContext
  now?: Date
}

// RevokeEnrollmentCommand carries an administrator request to revoke an unused enrollment.
export class RevokeEnrollmentCommand implements ICommand {
  readonly tenantId: string
  readonly enrollmentId: string
  readonly reason: string
  readonly operatorContext: EnrollmentOperatorContext
  readonly now?: Date

  // Constructs the revoke enrollment command without mutating the caller payload.
  constructor(input: RevokeEnrollmentCommandInput) {
    this.tenantId = input.tenantId
    this.enrollmentId = input.enrollmentId
    this.reason = input.reason
    this.operatorContext = input.operatorContext
    this.now = input.now
  }
}

@Injectable()
@CommandHandler(RevokeEnrollmentCommand)
// RevokeEnrollmentHandler marks an unused enrollment revoked and records the audit fact.
export class RevokeEnrollmentHandler implements ICommandHandler<RevokeEnrollmentCommand, RevokeEnrollmentResult> {
  constructor(
    @Inject(SYMBOLS.REPO.ENROLLMENT)
    private readonly enrollmentRepository: TerminalDeviceEnrollmentRepository,
    @Inject(SYMBOLS.REPO.AUDIT_EVENT)
    private readonly auditEventRepository: TerminalDeviceAuditEventRepository
  ) {}

  // Executes revocation for ISSUED enrollments while preserving used enrollment history.
  async execute(command: RevokeEnrollmentCommand): Promise<RevokeEnrollmentResult> {
    const reason = command.reason.trim()
    if (!reason) {
      throw new TerminalDeviceError('ENROLLMENT_REVOCATION_REASON_REQUIRED', 'Revocation reason is required')
    }

    const enrollment = await this.enrollmentRepository.findById(command.enrollmentId)
    if (!enrollment || enrollment.tenantId !== command.tenantId) {
      throw new TerminalDeviceError('ENROLLMENT_NOT_FOUND', 'Enrollment not found')
    }

    const now = command.now ?? new Date()
    const revokedEnrollment = enrollment.revoke(command.operatorContext.operatorAccountId, now)
    await this.enrollmentRepository.update(revokedEnrollment)

    await this.auditEventRepository.create(
      new TerminalDeviceAuditEventEntity({
        auditEventId: randomUUID(),
        tenantId: revokedEnrollment.tenantId,
        operatorAccountId: command.operatorContext.operatorAccountId,
        operatorOrgId: command.operatorContext.operatorOrgId ?? null,
        action: 'ENROLLMENT_REVOKED',
        targetTerminalDeviceId: null,
        beforeJson: {
          enrollmentId: enrollment.enrollmentId,
          status: enrollment.status
        },
        afterJson: {
          enrollmentId: revokedEnrollment.enrollmentId,
          status: revokedEnrollment.status,
          revokedAt: now.toISOString()
        },
        reason,
        traceId: command.operatorContext.traceId ?? null,
        occurredAt: now
      })
    )

    return {
      enrollmentId: revokedEnrollment.enrollmentId,
      status: 'REVOKED',
      revokedAt: now,
      revokedBy: command.operatorContext.operatorAccountId
    }
  }
}
