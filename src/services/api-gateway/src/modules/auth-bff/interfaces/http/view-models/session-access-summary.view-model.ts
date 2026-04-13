import { ApiProperty } from '@nestjs/swagger'

// Defines a role summary returned for display and diagnostics in the session access summary endpoint.
export class SessionAccessRoleViewModel {
  @ApiProperty({ description: 'Effective role identifier bound to the current account context.' })
  roleId!: string

  @ApiProperty({ description: 'Stable role code for display and diagnostics only.' })
  code!: string

  @ApiProperty({ description: 'Human-readable role name.' })
  name!: string

  @ApiProperty({ description: 'Tenant identifier associated with this role assignment.' })
  tenantId!: string

  @ApiProperty({ description: 'Role scope category resolved by permission-service.' })
  scope!: string
}

// Defines the front-end action-code summary for the authenticated selected account context.
export class SessionAccessSummaryViewModel {
  @ApiProperty({
    type: SessionAccessRoleViewModel,
    isArray: true,
    description: 'Effective roles for display and diagnostics; front-end code must not derive authorization from this list.'
  })
  roles!: SessionAccessRoleViewModel[]

  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Effective action codes used by the front-end for button and action-level access control.'
  })
  actionCodes!: string[]
}
