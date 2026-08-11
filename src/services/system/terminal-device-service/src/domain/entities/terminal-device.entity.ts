import { TerminalDeviceStatus, TerminalDeviceType } from '../enums/terminal-device.enums'

export interface TerminalDeviceProps {
  terminalDeviceId: string
  tenantId: string
  terminalDeviceType: TerminalDeviceType
  displayName: string
  status: TerminalDeviceStatus
  statusReason: string | null
  enrollmentId: string | null
  manufacturerSerial: string | null
  androidId: string | null
  appInstallationId: string | null
  deviceCredentialHash?: string | null
  deviceCredentialPreviousHash?: string | null
  deviceCredentialVersion?: number
  deviceCredentialPreviousVersion?: number | null
  deviceCredentialExpiresAt?: Date | null
  deviceCredentialPreviousExpiresAt?: Date | null
  deviceCredentialState?: 'ACTIVE' | 'SUSPENDED' | 'REVOKED'
  manufacturer: string | null
  model: string | null
  androidVersion: string | null
  registeredAt: Date
  updatedAt: Date
  notes: string | null
}

// TerminalDeviceEntity represents the service-owned managed terminal device registry record.
export class TerminalDeviceEntity {
  readonly terminalDeviceId: string
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType
  readonly displayName: string
  readonly status: TerminalDeviceStatus
  readonly statusReason: string | null
  readonly enrollmentId: string | null
  readonly manufacturerSerial: string | null
  readonly androidId: string | null
  readonly appInstallationId: string | null
  readonly deviceCredentialHash: string | null
  readonly deviceCredentialPreviousHash: string | null
  readonly deviceCredentialVersion: number
  readonly deviceCredentialPreviousVersion: number | null
  readonly deviceCredentialExpiresAt: Date | null
  readonly deviceCredentialPreviousExpiresAt: Date | null
  readonly deviceCredentialState: 'ACTIVE' | 'SUSPENDED' | 'REVOKED'
  readonly manufacturer: string | null
  readonly model: string | null
  readonly androidVersion: string | null
  readonly registeredAt: Date
  readonly updatedAt: Date
  readonly notes: string | null

  // Constructs an immutable terminal device entity from persisted lifecycle and identity facts.
  constructor(props: TerminalDeviceProps) {
    this.terminalDeviceId = props.terminalDeviceId
    this.tenantId = props.tenantId
    this.terminalDeviceType = props.terminalDeviceType
    this.displayName = props.displayName
    this.status = props.status
    this.statusReason = props.statusReason
    this.enrollmentId = props.enrollmentId
    this.manufacturerSerial = props.manufacturerSerial
    this.androidId = props.androidId
    this.appInstallationId = props.appInstallationId
    this.deviceCredentialHash = props.deviceCredentialHash ?? null
    this.deviceCredentialPreviousHash = props.deviceCredentialPreviousHash ?? null
    this.deviceCredentialVersion = props.deviceCredentialVersion ?? 1
    this.deviceCredentialPreviousVersion = props.deviceCredentialPreviousVersion ?? null
    this.deviceCredentialExpiresAt = props.deviceCredentialExpiresAt ?? null
    this.deviceCredentialPreviousExpiresAt = props.deviceCredentialPreviousExpiresAt ?? null
    this.deviceCredentialState = props.deviceCredentialState ?? 'ACTIVE'
    this.manufacturer = props.manufacturer
    this.model = props.model
    this.androidVersion = props.androidVersion
    this.registeredAt = props.registeredAt
    this.updatedAt = props.updatedAt
    this.notes = props.notes
  }
}
