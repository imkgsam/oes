import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

// Loads one tenant-scoped login MFA policy snapshot for tenant administration surfaces.
export class GetTenantMfaPolicyQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }
}
