import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// Defines the operator summary returned by the authenticated session context endpoint.
export class SessionContextOperatorViewModel {
  @ApiProperty({ description: 'Authenticated user identifier bound to the current session.' })
  userId!: string

  @ApiPropertyOptional({ description: 'Display name currently available for the authenticated operator.' })
  displayName?: string

  @ApiProperty({ description: 'Scope level of the selected account context.' })
  scopeLevel!: 'SYSTEM' | 'TENANT'
}

// Defines the account summary returned by the authenticated session context endpoint.
export class SessionContextAccountViewModel {
  @ApiProperty({ description: 'Selected account identifier bound to the current session.' })
  accountId!: string

  @ApiPropertyOptional({ description: 'Display name currently available for the selected account.' })
  name?: string

  @ApiPropertyOptional({ description: 'Avatar currently configured for the selected account profile.' })
  avatar?: string

  @ApiProperty({ description: 'Scope level of the selected account.' })
  scopeLevel!: 'SYSTEM' | 'TENANT'
}

// Defines the tenant summary returned by the authenticated session context endpoint.
export class SessionContextTenantViewModel {
  @ApiProperty({ description: 'Selected tenant identifier bound to the current session.' })
  tenantId!: string

  @ApiPropertyOptional({ description: 'Display name currently available for the selected tenant.' })
  name?: string
}

// Defines the optional organization summary returned by the authenticated session context endpoint.
export class SessionContextOrgViewModel {
  @ApiProperty({ description: 'Organization identifier bound to the current session when available.' })
  orgId!: string

  @ApiPropertyOptional({ description: 'Display name currently available for the selected organization.' })
  name?: string
}

// Defines the shell navigation summary returned by the authenticated session context endpoint.
export class SessionContextNavigationViewModel {
  @ApiProperty({ description: 'Default navigation entry code selected by the back-end for the current account context.' })
  defaultEntry!: string

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Visible navigation entry codes; each front-end maps these entries into its own route or menu shape.'
  })
  visibleEntries!: string[]

  @ApiProperty({ description: 'Default path the front-end should enter after session initialization.' })
  defaultHomePath!: string

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Stage-one placeholder menu list kept stable for future navigation expansion.'
  })
  menus!: string[]
}

// Defines the permission summary returned by the authenticated session context endpoint.
export class SessionContextAccessViewModel {
  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Stage-one placeholder action code list kept stable for future permission summary expansion.'
  })
  actionCodes!: string[]
}

// Defines the authenticated shell initialization payload returned after login completes.
export class SessionContextViewModel {
  @ApiProperty({ type: SessionContextOperatorViewModel })
  operator!: SessionContextOperatorViewModel

  @ApiProperty({ type: SessionContextAccountViewModel })
  account!: SessionContextAccountViewModel

  @ApiPropertyOptional({
    type: SessionContextTenantViewModel,
    nullable: true,
    description: 'Tenant summary for tenant-scope sessions; null for system-scope sessions.'
  })
  tenant?: SessionContextTenantViewModel | null

  @ApiPropertyOptional({
    type: SessionContextOrgViewModel,
    nullable: true,
    description: 'Optional organization summary when the current session is already bound to an org.'
  })
  org?: SessionContextOrgViewModel | null

  @ApiProperty({ type: SessionContextNavigationViewModel })
  navigation!: SessionContextNavigationViewModel

  @ApiProperty({ type: SessionContextAccessViewModel })
  access!: SessionContextAccessViewModel

  @ApiProperty({ description: 'Scope level of the current shell context.' })
  scopeLevel!: 'SYSTEM' | 'TENANT'

  @ApiPropertyOptional({
    description: 'Whether the current authenticated session must complete first-login password setup before entering the workspace.'
  })
  passwordSetupRequired?: boolean
}
