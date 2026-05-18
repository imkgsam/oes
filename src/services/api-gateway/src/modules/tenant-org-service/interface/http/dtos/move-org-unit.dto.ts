import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

// Defines the target parent for an org node move command.
export class MoveOrgUnitDto {
  @ApiProperty({ description: 'Target parent org unit id.', example: '5f9624d9-294c-4b9b-ae72-4d9f8b8a7b73' })
  @IsString()
  newParentOrgId!: string
}
