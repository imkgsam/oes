import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

/** RevokeTenantSessionsCommand carries a tenant lifecycle revocation request from tenant-org-service. */
export class RevokeTenantSessionsCommand {
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsString()
  @IsOptional()
  readonly reason?: string

  constructor(tenantId: string, reason?: string) {
    this.tenantId = tenantId
    this.reason = reason
  }
}
