import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Loads the active trusted-device list for one scope-aware self-service security view.
export class ListTrustedDevicesQuery {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsString()
  readonly scopeLevel: 'SYSTEM' | 'TENANT'

  constructor(userId: string, tenantId: string | undefined, scopeLevel: 'SYSTEM' | 'TENANT') {
    this.userId = userId
    this.tenantId = tenantId
    this.scopeLevel = scopeLevel
  }
}
