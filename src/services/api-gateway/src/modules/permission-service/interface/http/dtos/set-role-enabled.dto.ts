import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean } from 'class-validator'

// Defines the payload for enabling or disabling a role instance.
export class SetRoleEnabledDto {
  @ApiProperty({
    description: 'Whether the role should be enabled.',
    example: true
  })
  @IsBoolean()
  isEnabled: boolean
}
