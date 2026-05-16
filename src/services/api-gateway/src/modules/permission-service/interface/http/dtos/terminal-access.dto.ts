import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ArrayUnique, IsArray, IsIn, IsString, IsUUID, ValidateIf } from 'class-validator'

const TERMINALS = ['WEB', 'PDA', 'KIOSK'] as const

// Captures the scope context required to read account terminal access through permission-service.
export class AccountTerminalAccessQueryDto {
  @ApiPropertyOptional({ description: 'Tenant id for tenant-scoped accounts.' })
  @ValidateIf((value) => value.scopeLevel === 'TENANT')
  @IsUUID()
  tenantId?: string

  @ApiProperty({ description: 'Account scope level.', enum: ['SYSTEM', 'TENANT'] })
  @IsString()
  @IsIn(['SYSTEM', 'TENANT'])
  scopeLevel!: string
}

// Carries the replacement terminal list for role defaults or account overrides.
export class TerminalAccessMutationDto {
  @ApiProperty({ description: 'Allowed terminals.', enum: TERMINALS, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsIn(TERMINALS, { each: true })
  allowedTerminals!: string[]
}

// Carries the account override replacement together with the required account scope context.
export class AccountTerminalAccessMutationDto extends AccountTerminalAccessQueryDto {
  @ApiProperty({ description: 'Allowed terminals for the replacement override.', enum: TERMINALS, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsIn(TERMINALS, { each: true })
  allowedTerminals!: string[]
}
