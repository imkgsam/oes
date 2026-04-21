import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

// Defines the authenticated first-login password setup payload.
export class FirstLoginPasswordSetupDto {
  @ApiProperty({ maxLength: 64 })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  newPassword!: string

  @ApiProperty({ maxLength: 64 })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  confirmPassword!: string
}
