import { TerminalDeviceEnrollmentEntity } from '../entities/terminal-device-enrollment.entity'

// TerminalDeviceEnrollmentRepository defines persistence operations for one-time enrollment authorizations.
export interface TerminalDeviceEnrollmentRepository {
  create(entity: TerminalDeviceEnrollmentEntity): Promise<TerminalDeviceEnrollmentEntity>
  findById(enrollmentId: string): Promise<TerminalDeviceEnrollmentEntity | null>
  findByCodeHash(codeHash: string): Promise<TerminalDeviceEnrollmentEntity | null>
}
