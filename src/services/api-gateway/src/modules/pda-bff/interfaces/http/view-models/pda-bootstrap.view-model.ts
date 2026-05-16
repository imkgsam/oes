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
  deviceStatus!: 'ACTIVE'

  @ApiPropertyOptional()
  deviceId?: string

  @ApiPropertyOptional()
  idSource?: string
}

export class PdaBootstrapDevicePolicyViewModel {
  @ApiProperty()
  heartbeatIntervalSeconds!: number

  @ApiProperty()
  idleTimeoutSeconds!: number

  @ApiProperty()
  minSupportedAppVersion!: string

  @ApiProperty()
  latestAppVersion!: string

  @ApiProperty()
  upgradeRequired!: boolean
}

export class PdaBootstrapWorkbenchViewModel {
  @ApiProperty()
  mode!: 'FOUNDATION_ACCEPTANCE'

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

  @ApiProperty({ type: PdaBootstrapDevicePolicyViewModel })
  devicePolicy!: PdaBootstrapDevicePolicyViewModel

  @ApiProperty({ type: PdaBootstrapWorkbenchViewModel })
  workbench!: PdaBootstrapWorkbenchViewModel

  @ApiProperty()
  serverTime!: string
}
