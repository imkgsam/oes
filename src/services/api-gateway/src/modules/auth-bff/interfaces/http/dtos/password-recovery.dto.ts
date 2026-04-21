import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator'

export enum PasswordRecoveryChannelDto {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE'
}

// Defines the request payload used to inspect the verified recovery destinations for one submitted identifier.
export class InspectPasswordRecoveryChannelsDto {
  @ApiProperty({
    description: 'Submitted verified login identifier used to resolve the account recovery options.',
    maxLength: 256,
    example: 'user@example.com'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  identifier: string
}

// Defines the request payload used to start a public forgot-password recovery attempt.
export class RequestPasswordRecoveryChallengeDto {
  @ApiProperty({
    enum: PasswordRecoveryChannelDto,
    enumName: 'PasswordRecoveryChannel',
    description: 'Verified recovery destination type selected by the caller.'
  })
  @IsEnum(PasswordRecoveryChannelDto)
  channel: PasswordRecoveryChannelDto

  @ApiProperty({
    description: 'Identifier matching the selected recovery destination, such as an email or phone number.',
    maxLength: 256,
    example: 'user@example.com'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  identifier: string
}

// Defines the request payload used to verify one forgot-password OTP.
export class VerifyPasswordRecoveryChallengeDto {
  @ApiProperty({
    description: 'OTP entered by the end user for the active recovery challenge.',
    maxLength: 64,
    example: '123456'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  otp: string
}

// Defines the request payload used to complete one verified password recovery.
export class CompletePasswordRecoveryDto {
  @ApiProperty({
    description: 'Short-lived reset token returned after successful OTP verification.',
    maxLength: 128,
    example: 'reset_01HZY2Q8S9K3'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  resetToken: string

  @ApiProperty({
    description: 'New password that should replace the previous unified password.',
    maxLength: 256,
    example: 'NewSecret123!'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  newPassword: string

  @ApiProperty({
    description: 'Confirmation copy of the new password entered by the end user.',
    maxLength: 256,
    example: 'NewSecret123!'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  confirmPassword: string
}
