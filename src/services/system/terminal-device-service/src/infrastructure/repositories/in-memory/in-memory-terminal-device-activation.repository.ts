import { TerminalDeviceError } from '../../../domain/errors/terminal-device.error'
import {
  CompleteEnrollmentActivationInput,
  CompleteEnrollmentActivationResult,
  TerminalDeviceActivationRepository
} from '../../../domain/repositories/terminal-device-activation.repository'
import { InMemoryTerminalDeviceStore } from './in-memory-terminal-device-store'

// InMemoryTerminalDeviceActivationRepository commits activation facts after validating all uniqueness constraints.
export class InMemoryTerminalDeviceActivationRepository implements TerminalDeviceActivationRepository {
  constructor(private readonly store = new InMemoryTerminalDeviceStore()) {}

  // Persists device creation, enrollment consumption, and audit event together for activation tests.
  async completeEnrollmentActivation(input: CompleteEnrollmentActivationInput): Promise<CompleteEnrollmentActivationResult> {
    const existingEnrollment = this.store.enrollments.get(input.issuedEnrollment.enrollmentId)
    if (!existingEnrollment) {
      throw new TerminalDeviceError('ENROLLMENT_NOT_FOUND', 'Enrollment not found')
    }
    if (existingEnrollment.status !== 'ISSUED') {
      throw new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Enrollment is no longer issued')
    }
    if (existingEnrollment.codeHash !== input.issuedEnrollment.codeHash) {
      throw new TerminalDeviceError('ENROLLMENT_ACTIVATION_CONFLICT', 'Enrollment version changed before activation')
    }
    if (this.store.devices.has(input.terminalDevice.terminalDeviceId)) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_ALREADY_EXISTS', 'Terminal device already exists')
    }
    if (
      input.terminalDevice.enrollmentId &&
      this.store.terminalDeviceIdsByEnrollmentId.has(input.terminalDevice.enrollmentId)
    ) {
      throw new TerminalDeviceError('TERMINAL_DEVICE_ENROLLMENT_ALREADY_LINKED', 'Terminal device enrollment is already linked')
    }
    if (this.store.auditEventIds.has(input.auditEvent.auditEventId)) {
      throw new TerminalDeviceError('AUDIT_EVENT_ALREADY_EXISTS', 'Terminal device audit event already exists')
    }

    this.store.devices.set(input.terminalDevice.terminalDeviceId, input.terminalDevice)
    if (input.terminalDevice.enrollmentId) {
      this.store.terminalDeviceIdsByEnrollmentId.set(input.terminalDevice.enrollmentId, input.terminalDevice.terminalDeviceId)
    }
    this.store.enrollments.set(input.usedEnrollment.enrollmentId, input.usedEnrollment)
    this.store.auditEvents.push(input.auditEvent)
    this.store.auditEventIds.add(input.auditEvent.auditEventId)

    return {
      terminalDevice: input.terminalDevice,
      enrollment: input.usedEnrollment,
      auditEvent: input.auditEvent
    }
  }
}
