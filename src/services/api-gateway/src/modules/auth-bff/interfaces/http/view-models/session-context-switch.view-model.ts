import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SessionContextOptionViewModel {
  @ApiProperty({ description: 'Account context identifier.' })
  accountId!: string

  @ApiProperty({ description: 'Scope level for the account context.' })
  scopeLevel!: 'SYSTEM' | 'TENANT'

  @ApiPropertyOptional({ description: 'User-facing display label for the account context.' })
  displayName?: string

  @ApiPropertyOptional({
    description: 'Tenant identifier for tenant-scope contexts; null for system-scope contexts.',
    nullable: true
  })
  tenantId?: string | null

  @ApiPropertyOptional({
    description: 'Tenant display name for tenant-scope contexts; null for system-scope contexts.',
    nullable: true
  })
  tenantName?: string | null

  @ApiProperty({ description: 'Whether this item is the current active context.' })
  isCurrent!: boolean
}

export class SessionContextListViewModel {
  @ApiProperty({
    type: SessionContextOptionViewModel,
    isArray: true,
    description: 'Available account contexts visible to the authenticated user.'
  })
  items!: SessionContextOptionViewModel[]
}

export class SwitchedContextViewModel {
  @ApiProperty({ description: 'Account context identifier that became active after the switch.' })
  accountId!: string

  @ApiProperty({ description: 'Scope level that became active after the switch.' })
  scopeLevel!: 'SYSTEM' | 'TENANT'

  @ApiPropertyOptional({
    description: 'Tenant identifier for tenant-scope contexts; null for system-scope contexts.',
    nullable: true
  })
  tenantId?: string | null
}

export class SwitchContextSessionViewModel {
  @ApiProperty({ description: 'Newly issued access token for the switched context.' })
  accessToken!: string

  @ApiProperty({ description: 'Newly issued refresh token for the switched context.' })
  refreshToken!: string

  @ApiProperty({ description: 'Access token lifetime in seconds.' })
  expiresIn!: number
}

export class SwitchContextViewModel {
  @ApiProperty({ description: 'High-level result of the context switch attempt.' })
  status!: 'SUCCESS' | 'DENIED'

  @ApiPropertyOptional({
    type: SwitchedContextViewModel,
    nullable: true,
    description: 'Minimal summary of the context that became active after a successful switch.'
  })
  context?: SwitchedContextViewModel | null

  @ApiPropertyOptional({
    type: SwitchContextSessionViewModel,
    nullable: true,
    description: 'Newly issued token pair for the switched context.'
  })
  session?: SwitchContextSessionViewModel | null

  @ApiPropertyOptional({ description: 'Stable denial reason code for UI handling.' })
  reasonCode?: string

  @ApiPropertyOptional({ description: 'Operator-facing message suitable for the UI.' })
  message?: string
}
