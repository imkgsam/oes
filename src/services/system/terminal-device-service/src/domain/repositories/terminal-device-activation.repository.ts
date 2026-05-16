import { TerminalDeviceAuditEventEntity } from '../entities/terminal-device-audit-event.entity'
import { TerminalDeviceEnrollmentEntity } from '../entities/terminal-device-enrollment.entity'
import { TerminalDeviceEntity } from '../entities/terminal-device.entity'

export interface CompleteEnrollmentActivationInput {
  issuedEnrollment: TerminalDeviceEnrollmentEntity
  usedEnrollment: TerminalDeviceEnrollmentEntity
  terminalDevice: TerminalDeviceEntity
  auditEvent: TerminalDeviceAuditEventEntity
}

export interface CompleteEnrollmentActivationResult {
  terminalDevice: TerminalDeviceEntity
  enrollment: TerminalDeviceEnrollmentEntity
  auditEvent: TerminalDeviceAuditEventEntity
}

// TerminalDeviceActivationRepository persists the device creation and enrollment consumption as one consistency boundary.
export interface TerminalDeviceActivationRepository {
  completeEnrollmentActivation(input: CompleteEnrollmentActivationInput): Promise<CompleteEnrollmentActivationResult>
}
