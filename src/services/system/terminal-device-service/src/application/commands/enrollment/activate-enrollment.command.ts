import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { randomUUID } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalDeviceAuditEventEntity } from '../../../domain/entities/terminal-device-audit-event.entity'
import { TerminalDeviceEntity } from '../../../domain/entities/terminal-device.entity'
import { TerminalDeviceStatus, TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import { TerminalDeviceActivationRepository } from '../../../domain/repositories/terminal-device-activation.repository'
import { TerminalDeviceEnrollmentRepository } from '../../../domain/repositories/terminal-device-enrollment.repository'
import { TerminalDeviceRepository } from '../../../domain/repositories/terminal-device.repository'
import { hashEnrollmentCode } from './create-enrollment.command'
import { TerminalDeviceCredentialVerifierService } from '../../services/terminal-device-credential-verifier.service'

export type ActivateEnrollmentDecisionCode =
  | 'ALLOW'
  | 'ENROLLMENT_NOT_FOUND'
  | 'ENROLLMENT_EXPIRED'
  | 'ENROLLMENT_USED'
  | 'ENROLLMENT_REVOKED'
  | 'ENROLLMENT_TYPE_MISMATCH'
  | 'EXPECTED_SERIAL_MISMATCH'
  | 'DEVICE_IDENTITY_CONFLICT'

export interface ActivateEnrollmentIdentityInput {
  manufacturerSerial?: string | null
  androidId?: string | null
  appInstallationId?: string | null
  manufacturer?: string | null
  model?: string | null
}

export interface ActivateEnrollmentSoftwareInput {
  androidVersion?: string | null
  webViewVersion?: string | null
  appVersion?: string | null
}

export interface ActivateEnrollmentResult {
  activated: boolean
  terminalDeviceId: string | null
  tenantId: string | null
  terminalDeviceType: TerminalDeviceType | null
  deviceStatus: TerminalDeviceStatus | null
  enrollmentId: string | null
  decisionCode: ActivateEnrollmentDecisionCode
  deviceCredential?: string | null
  deviceCredentialExpiresAt?: Date | null
  deviceCredentialVersion?: number | null
}

export interface ActivateEnrollmentCommandInput {
  enrollmentCode: string
  terminalDeviceType: TerminalDeviceType
  identity: ActivateEnrollmentIdentityInput
  software: ActivateEnrollmentSoftwareInput
  traceId?: string | null
  now?: Date
}

// ActivateEnrollmentCommand carries a PDA activation attempt with identity and software signals.
export class ActivateEnrollmentCommand implements ICommand {
  readonly enrollmentCode: string
  readonly terminalDeviceType: TerminalDeviceType
  readonly identity: ActivateEnrollmentIdentityInput
  readonly software: ActivateEnrollmentSoftwareInput
  readonly traceId: string | null
  readonly now?: Date

  // Constructs the activation command with nullable trace metadata normalized.
  constructor(input: ActivateEnrollmentCommandInput) {
    this.enrollmentCode = input.enrollmentCode
    this.terminalDeviceType = input.terminalDeviceType
    this.identity = input.identity
    this.software = input.software
    this.traceId = input.traceId ?? null
    this.now = input.now
  }
}

@Injectable()
@CommandHandler(ActivateEnrollmentCommand)
// ActivateEnrollmentHandler validates one-use enrollment and creates the managed terminal device.
export class ActivateEnrollmentHandler implements ICommandHandler<ActivateEnrollmentCommand, ActivateEnrollmentResult> {
  constructor(
    @Inject(SYMBOLS.REPO.ENROLLMENT)
    private readonly enrollmentRepository: TerminalDeviceEnrollmentRepository,
    @Inject(SYMBOLS.REPO.TERMINAL_DEVICE)
    private readonly terminalDeviceRepository: TerminalDeviceRepository,
    @Inject(SYMBOLS.REPO.ACTIVATION)
    private readonly activationRepository: TerminalDeviceActivationRepository,
    private readonly credentialVerifier: TerminalDeviceCredentialVerifierService
  ) {}

  // Executes activation, rejecting invalid lifecycle states without recovering existing devices.
  async execute(command: ActivateEnrollmentCommand): Promise<ActivateEnrollmentResult> {
    if (command.terminalDeviceType !== 'PDA') {
      return rejected('ENROLLMENT_TYPE_MISMATCH')
    }

    const now = command.now ?? new Date()
    const enrollment = await this.enrollmentRepository.findByCodeHash(hashEnrollmentCode(command.enrollmentCode))

    if (!enrollment) {
      return rejected('ENROLLMENT_NOT_FOUND')
    }

    const lifecycleRejection = enrollment.activationRejectionAt(now)
    if (lifecycleRejection) {
      return rejected(lifecycleRejection)
    }

    if (enrollment.terminalDeviceType !== 'PDA' || enrollment.terminalDeviceType !== command.terminalDeviceType) {
      return rejected('ENROLLMENT_TYPE_MISMATCH')
    }

    if (
      enrollment.expectedManufacturerSerial &&
      enrollment.expectedManufacturerSerial !== (command.identity.manufacturerSerial ?? null)
    ) {
      return rejected('EXPECTED_SERIAL_MISMATCH')
    }

    const possibleMatch = await this.terminalDeviceRepository.findPossibleIdentityMatch({
      terminalDeviceType: command.terminalDeviceType,
      manufacturerSerial: command.identity.manufacturerSerial ?? null,
      androidId: command.identity.androidId ?? null,
      appInstallationId: command.identity.appInstallationId ?? null
    })
    if (possibleMatch) {
      return rejected('DEVICE_IDENTITY_CONFLICT')
    }

    const issuedCredential = this.credentialVerifier.issue(now)
    const device = new TerminalDeviceEntity({
      terminalDeviceId: randomUUID(),
      tenantId: enrollment.tenantId,
      terminalDeviceType: enrollment.terminalDeviceType,
      displayName: enrollment.displayName,
      status: 'ACTIVE',
      statusReason: null,
      enrollmentId: enrollment.enrollmentId,
      manufacturerSerial: command.identity.manufacturerSerial ?? null,
      androidId: command.identity.androidId ?? null,
      appInstallationId: command.identity.appInstallationId ?? null,
      deviceCredentialHash: issuedCredential.hash,
      deviceCredentialPreviousHash: null,
      deviceCredentialVersion: issuedCredential.version,
      deviceCredentialPreviousVersion: null,
      deviceCredentialExpiresAt: issuedCredential.expiresAt,
      deviceCredentialPreviousExpiresAt: null,
      deviceCredentialState: 'ACTIVE',
      manufacturer: command.identity.manufacturer ?? null,
      model: command.identity.model ?? null,
      androidVersion: command.software.androidVersion ?? null,
      registeredAt: now,
      updatedAt: now,
      notes: enrollment.notes
    })

    const usedEnrollment = enrollment.markUsed(device.terminalDeviceId, now)
    const auditEvent = new TerminalDeviceAuditEventEntity({
      auditEventId: randomUUID(),
      tenantId: device.tenantId,
      operatorAccountId: 'SYSTEM',
      operatorOrgId: null,
      action: 'ENROLLMENT_USED',
      targetTerminalDeviceId: device.terminalDeviceId,
      beforeJson: {
        enrollmentId: enrollment.enrollmentId,
        status: enrollment.status
      },
      afterJson: {
        enrollmentId: usedEnrollment.enrollmentId,
        status: usedEnrollment.status,
        terminalDeviceId: device.terminalDeviceId,
        deviceStatus: device.status
      },
      reason: null,
      traceId: command.traceId,
      occurredAt: now
    })
    try {
      await this.activationRepository.completeEnrollmentActivation({
        issuedEnrollment: enrollment,
        usedEnrollment,
        terminalDevice: device,
        auditEvent
      })
    } catch (error) {
      if (error instanceof TerminalDeviceError && error.code === 'ENROLLMENT_ACTIVATION_CONFLICT') {
        return rejected('ENROLLMENT_USED')
      }
      throw error
    }

    return {
      activated: true,
      terminalDeviceId: device.terminalDeviceId,
      tenantId: device.tenantId,
      terminalDeviceType: device.terminalDeviceType,
      deviceStatus: device.status,
      enrollmentId: enrollment.enrollmentId,
      decisionCode: 'ALLOW',
      deviceCredential: issuedCredential.credential,
      deviceCredentialExpiresAt: device.deviceCredentialExpiresAt,
      deviceCredentialVersion: device.deviceCredentialVersion
    }
  }
}

// rejected creates the standard activation failure response without leaking enrollment details.
function rejected(decisionCode: ActivateEnrollmentDecisionCode): ActivateEnrollmentResult {
  return {
    activated: false,
    terminalDeviceId: null,
    tenantId: null,
    terminalDeviceType: null,
    deviceStatus: null,
    enrollmentId: null,
    decisionCode
  }
}
