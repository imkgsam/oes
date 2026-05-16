import { ApiProperty } from '@nestjs/swagger'
import { PdaDeviceAccessDecisionViewModel } from './pda-bootstrap.view-model'

export type PdaManagedDeviceDescriptor = {
  terminalDeviceId?: string | null
  terminalDeviceType: 'PDA'
  identity: {
    manufacturerSerial?: string | null
    androidId?: string | null
    appInstallationId?: string | null
    manufacturer?: string | null
    model?: string | null
  }
  software: {
    androidVersion?: string | null
    webViewVersion?: string | null
    appVersion: string
  }
}

export type PdaVersionPolicy = {
  minSupportedAppVersion: string
  latestAppVersion: string
  upgradeRequired: boolean
  upgradeRecommended?: boolean
  apkDownloadUrl?: string | null
  releaseNotesUrl?: string | null
}

export type PdaDeviceAccessDecision = {
  allowed: boolean
  decisionCode: string
  resolvedTenantId?: string | null
  terminalDeviceId?: string | null
  terminalDeviceType?: 'PDA' | null
  deviceStatus?: string | null
  presenceStatus?: 'OFFLINE' | 'ONLINE' | 'UNKNOWN' | null
  versionPolicy?: PdaVersionPolicy | null
  requiredAction: string
  messageKey?: string | null
  shouldClearLocalSession: boolean
  shouldClearLocalTerminalDeviceId: boolean
}

export class PdaEnrollmentViewModel {
  @ApiProperty()
  enrolled!: boolean

  @ApiProperty({ nullable: true })
  terminalDeviceId!: string | null

  @ApiProperty({ nullable: true })
  tenantId?: string | null

  @ApiProperty()
  terminalDeviceType?: 'PDA'

  @ApiProperty({ nullable: true })
  displayName?: string | null

  @ApiProperty({ nullable: true })
  deviceStatus?: string | null

  @ApiProperty({ type: PdaDeviceAccessDecisionViewModel })
  decision!: PdaDeviceAccessDecision

  @ApiProperty()
  serverTime!: string
}

// Confirms that the PDA heartbeat was accepted and returns the current managed device decision.
export class PdaHeartbeatViewModel {
  @ApiProperty()
  accepted!: boolean

  @ApiProperty({ type: PdaDeviceAccessDecisionViewModel })
  decision!: PdaDeviceAccessDecision

  @ApiProperty()
  heartbeatIntervalSeconds!: number

  @ApiProperty()
  serverTime!: string
}

// Confirms that the PDA manual diagnostic upload was accepted by the BFF.
export class PdaDeviceLogsViewModel {
  @ApiProperty()
  accepted!: boolean

  @ApiProperty()
  receivedCount!: number

  @ApiProperty({ type: PdaDeviceAccessDecisionViewModel, required: false })
  decision?: PdaDeviceAccessDecision

  @ApiProperty()
  serverTime!: string
}
