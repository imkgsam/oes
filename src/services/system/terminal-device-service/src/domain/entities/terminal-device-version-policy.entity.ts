import { TerminalDeviceType } from '../enums/terminal-device.enums'

export interface TerminalDeviceVersionPolicyProps {
  versionPolicyId: string
  tenantId: string
  terminalDeviceType: TerminalDeviceType
  minSupportedAppVersion: string
  latestAppVersion: string
  upgradeRequired: boolean
  upgradeRecommended: boolean
  apkDownloadUrl: string | null
  releaseNotesUrl: string | null
  updatedBy: string
  updatedAt: Date
  createdAt: Date
}

// TerminalDeviceVersionPolicyEntity represents app version governance for a tenant and terminal device type.
export class TerminalDeviceVersionPolicyEntity {
  readonly versionPolicyId: string
  readonly tenantId: string
  readonly terminalDeviceType: TerminalDeviceType
  readonly minSupportedAppVersion: string
  readonly latestAppVersion: string
  readonly upgradeRequired: boolean
  readonly upgradeRecommended: boolean
  readonly apkDownloadUrl: string | null
  readonly releaseNotesUrl: string | null
  readonly updatedBy: string
  readonly updatedAt: Date
  readonly createdAt: Date

  // Constructs an immutable version policy entity from persisted version governance facts.
  constructor(props: TerminalDeviceVersionPolicyProps) {
    this.versionPolicyId = props.versionPolicyId
    this.tenantId = props.tenantId
    this.terminalDeviceType = props.terminalDeviceType
    this.minSupportedAppVersion = props.minSupportedAppVersion
    this.latestAppVersion = props.latestAppVersion
    this.upgradeRequired = props.upgradeRequired
    this.upgradeRecommended = props.upgradeRecommended
    this.apkDownloadUrl = props.apkDownloadUrl
    this.releaseNotesUrl = props.releaseNotesUrl
    this.updatedBy = props.updatedBy
    this.updatedAt = props.updatedAt
    this.createdAt = props.createdAt
  }
}
