import { EnrollmentStatus, TerminalDeviceType } from '../enums/terminal-device.enums'
import { TerminalDeviceError } from '../errors/terminal-device.error'

export type EnrollmentActivationRejection = 'ENROLLMENT_EXPIRED' | 'ENROLLMENT_USED' | 'ENROLLMENT_REVOKED'

export interface TerminalDeviceEnrollmentProps {
  enrollmentId: string
  tenantId: string
  terminalDeviceType: TerminalDeviceType
  displayName: string
  codeHash: string
  status: EnrollmentStatus
  expectedManufacturerSerial: string | null
  expiresAt: Date
  usedAt: Date | null
  usedByTerminalDeviceId: string | null
  revokedAt: Date | null
  revokedBy: string | null
  createdBy: string
  createdAt: Date
  notes: string | null
}

// TerminalDeviceEnrollmentEntity represents a one-time administrator-issued device enrollment authorization.
export class TerminalDeviceEnrollmentEntity {
  readonly enrollmentId: string
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType
  readonly displayName: string
  readonly codeHash: string
  readonly status: EnrollmentStatus
  readonly expectedManufacturerSerial: string | null
  readonly expiresAt: Date
  readonly usedAt: Date | null
  readonly usedByTerminalDeviceId: string | null
  readonly revokedAt: Date | null
  readonly revokedBy: string | null
  readonly createdBy: string
  readonly createdAt: Date
  readonly notes: string | null

  // Constructs an immutable enrollment entity from persisted lifecycle facts.
  constructor(props: TerminalDeviceEnrollmentProps) {
    this.enrollmentId = props.enrollmentId
    this.tenantId = props.tenantId
    this.terminalDeviceType = props.terminalDeviceType
    this.displayName = props.displayName
    this.codeHash = props.codeHash
    this.status = props.status
    this.expectedManufacturerSerial = props.expectedManufacturerSerial
    this.expiresAt = props.expiresAt
    this.usedAt = props.usedAt
    this.usedByTerminalDeviceId = props.usedByTerminalDeviceId
    this.revokedAt = props.revokedAt
    this.revokedBy = props.revokedBy
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
    this.notes = props.notes
  }

  // Returns the lifecycle rejection that prevents this enrollment from being activated.
  activationRejectionAt(now: Date): EnrollmentActivationRejection | null {
    if (this.status === 'USED') {
      return 'ENROLLMENT_USED'
    }
    if (this.status === 'REVOKED') {
      return 'ENROLLMENT_REVOKED'
    }
    if (this.status === 'EXPIRED' || this.expiresAt.getTime() <= now.getTime()) {
      return 'ENROLLMENT_EXPIRED'
    }
    return null
  }

  // Marks an issued enrollment as used by the newly activated terminal device.
  markUsed(terminalDeviceId: string, usedAt: Date): TerminalDeviceEnrollmentEntity {
    const rejection = this.activationRejectionAt(usedAt)
    if (rejection) {
      throw new TerminalDeviceError(rejection, `Enrollment cannot be used: ${rejection}`)
    }

    return new TerminalDeviceEnrollmentEntity({
      ...this,
      status: 'USED',
      usedAt,
      usedByTerminalDeviceId: terminalDeviceId
    })
  }

  // Marks an issued enrollment as revoked by an administrator.
  revoke(operatorAccountId: string, revokedAt: Date): TerminalDeviceEnrollmentEntity {
    if (this.status === 'USED') {
      throw new TerminalDeviceError('ENROLLMENT_USED', 'Used enrollment cannot be revoked')
    }
    if (this.status !== 'ISSUED') {
      throw new TerminalDeviceError('ENROLLMENT_NOT_ISSUED', `Only ISSUED enrollment can be revoked: ${this.status}`)
    }

    return new TerminalDeviceEnrollmentEntity({
      ...this,
      status: 'REVOKED',
      revokedAt,
      revokedBy: operatorAccountId
    })
  }
}
