import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PdaBootstrapAccountViewModel {
  @ApiProperty()
  accountId!: string

  @ApiPropertyOptional({ nullable: true })
  tenantId?: string | null

  @ApiProperty()
  scopeLevel!: string

  @ApiPropertyOptional()
  displayName?: string
}

export class PdaBootstrapSessionViewModel {
  @ApiPropertyOptional()
  sessionId?: string

  @ApiProperty()
  terminal!: 'PDA'

  @ApiPropertyOptional()
  terminalDeviceId?: string

  @ApiPropertyOptional()
  expiresAt?: string

  @ApiProperty()
  idleTimeoutSeconds!: number
}

export class PdaBootstrapAccessViewModel {
  @ApiProperty({ type: String, isArray: true })
  roles!: string[]

  @ApiProperty({ type: String, isArray: true })
  actionCodes!: string[]
}

export class PdaBootstrapDeviceViewModel {
  @ApiProperty()
  terminalDeviceId!: string

  @ApiProperty()
  terminalDeviceType!: 'PDA'

  @ApiPropertyOptional({ nullable: true })
  tenantId?: string | null

  @ApiPropertyOptional({ nullable: true })
  displayName?: string | null

  @ApiProperty()
  deviceStatus!: string
}

export class PdaVersionPolicyViewModel {
  @ApiProperty()
  minSupportedAppVersion!: string

  @ApiProperty()
  latestAppVersion!: string

  @ApiProperty()
  upgradeRequired!: boolean

  @ApiPropertyOptional()
  upgradeRecommended?: boolean

  @ApiPropertyOptional({ nullable: true })
  apkDownloadUrl?: string | null

  @ApiPropertyOptional({ nullable: true })
  releaseNotesUrl?: string | null
}

export class PdaDeviceAccessDecisionViewModel {
  @ApiProperty()
  allowed!: boolean

  @ApiProperty()
  decisionCode!: string

  @ApiPropertyOptional({ nullable: true })
  resolvedTenantId?: string | null

  @ApiPropertyOptional({ nullable: true })
  terminalDeviceId?: string | null

  @ApiPropertyOptional({ nullable: true })
  terminalDeviceType?: 'PDA' | null

  @ApiPropertyOptional({ nullable: true })
  deviceStatus?: string | null

  @ApiPropertyOptional({ nullable: true })
  presenceStatus?: 'OFFLINE' | 'ONLINE' | 'UNKNOWN' | null

  @ApiPropertyOptional({ type: PdaVersionPolicyViewModel, nullable: true })
  versionPolicy?: PdaVersionPolicyViewModel | null

  @ApiProperty()
  requiredAction!: string

  @ApiPropertyOptional({ nullable: true })
  messageKey?: string | null

  @ApiProperty()
  shouldClearLocalSession!: boolean

  @ApiProperty()
  shouldClearLocalTerminalDeviceId!: boolean
}

export class PdaBootstrapWorkbenchViewModel {
  @ApiProperty()
  mode!: 'FOUNDATION_ACCEPTANCE' | 'PDA_MANAGED_DEVICE'

  @ApiProperty({ type: String, isArray: true })
  enabledCards!: string[]
}

export class PdaBootstrapViewModel {
  @ApiProperty({ type: PdaBootstrapAccountViewModel })
  account!: PdaBootstrapAccountViewModel

  @ApiProperty({ type: PdaBootstrapSessionViewModel })
  session!: PdaBootstrapSessionViewModel

  @ApiProperty({ type: PdaBootstrapAccessViewModel })
  access!: PdaBootstrapAccessViewModel

  @ApiProperty({ type: PdaBootstrapDeviceViewModel })
  device!: PdaBootstrapDeviceViewModel

  @ApiProperty({ type: PdaDeviceAccessDecisionViewModel })
  decision!: PdaDeviceAccessDecisionViewModel

  @ApiProperty({ type: PdaBootstrapWorkbenchViewModel })
  workbench!: PdaBootstrapWorkbenchViewModel

  @ApiProperty()
  serverTime!: string
}
