import { EnrollmentStatus, TerminalDeviceType } from '../enums/terminal-device.enums'

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
}
