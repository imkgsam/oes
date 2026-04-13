import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'

// Captures the supported filters for reading one account's effective role bindings.
export class ListAccountRolesDto {
  @ApiPropertyOptional({
    description: 'Tenant id for tenant-scoped account role bindings.',
    example: 'tenant-id'
  })
  @IsOptional()
  @IsString()
  tenantId?: string

  @ApiPropertyOptional({
    description: 'Binding scope filter. Defaults to TENANT when omitted.',
    enum: ['SYSTEM', 'TENANT']
  })
  @IsOptional()
  @IsIn(['SYSTEM', 'TENANT'])
  scopeLevel?: string
}
