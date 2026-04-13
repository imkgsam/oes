import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export enum LoginMethodDto {
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  EMAIL_OTP = 'EMAIL_OTP',
  PHONE_PASSWORD = 'PHONE_PASSWORD',
  PHONE_OTP = 'PHONE_OTP'
}

// Defines optional device hints that help the auth flow label the resulting session.
export class LoginDeviceDto {
  @ApiPropertyOptional({
    description: 'Stable client-side device identifier when the caller can provide one.',
    maxLength: 128,
    example: 'browser-7f3a2d9c'
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string

  @ApiPropertyOptional({
    description: 'User-visible device label supplied by the client.',
    maxLength: 128,
    example: 'Alice MacBook Pro'
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceName?: string
}

// Defines the unified primary login request accepted by the auth BFF.
export class LoginDto {
  @ApiProperty({
    enum: LoginMethodDto,
    enumName: 'LoginMethod',
    description: 'Primary login method selected by the caller.'
  })
  @IsEnum(LoginMethodDto)
  method: LoginMethodDto

  @ApiProperty({
    description: 'Login identifier matching the selected method, such as email address or phone number.',
    maxLength: 256,
    example: 'alice@example.com'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  identifier: string

  @ApiProperty({
    description: 'Password or OTP credential matching the selected login method.',
    maxLength: 256,
    example: 'p@ssw0rd-or-otp'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  credential: string

  @ApiPropertyOptional({
    description: 'Optional tenant hint used only as a client-side preference before account selection.',
    maxLength: 128,
    example: 'tenant-acme'
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenantHint?: string

  @ApiPropertyOptional({
    type: LoginDeviceDto,
    description: 'Optional lightweight device hints attached to the login attempt.'
  })
  @IsOptional()
  device?: LoginDeviceDto
}

// Defines the request payload that starts an email OTP login challenge.
export class EmailOtpChallengeDto {
  @ApiProperty({
    description: 'Email address that will receive the login OTP challenge.',
    maxLength: 256,
    example: 'alice@example.com'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  email: string
}

// Defines the request payload that starts a phone OTP login challenge.
export class PhoneOtpChallengeDto {
  @ApiProperty({
    description: 'Phone number that will receive the login OTP challenge.',
    maxLength: 64,
    example: '+8613800138000'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  phone: string
}

// Defines the MFA completion payload used to continue an interrupted login flow.
export class CompleteMfaDto {
  @ApiProperty({
    description: 'Challenge identifier previously returned by the login flow.',
    maxLength: 128,
    example: 'challenge_01HZY2Q8S9K3'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  challengeId: string

  @ApiProperty({
    description: 'Verification code entered by the user for the MFA challenge.',
    maxLength: 64,
    example: '123456'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code: string

  @ApiProperty({
    enum: LoginMethodDto,
    enumName: 'LoginMethod',
    description: 'Original login method used to start the authentication flow.'
  })
  @IsEnum(LoginMethodDto)
  loginMethod: LoginMethodDto
}

// Defines the account selection payload used after authentication returns multiple account candidates.
export class SelectAccountDto {
  @ApiProperty({
    description: 'Authenticated user identifier returned by the previous auth step.',
    maxLength: 128,
    example: 'usr_01HZY2Q8S9K3'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  userId: string

  @ApiProperty({
    description: 'Chosen account identifier returned by the account selection step.',
    maxLength: 128,
    example: 'acct_01HZY2Q8S9K3'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  accountId: string

  @ApiProperty({
    enum: LoginMethodDto,
    enumName: 'LoginMethod',
    description: 'Original login method used to start the authentication flow.'
  })
  @IsEnum(LoginMethodDto)
  loginMethod: LoginMethodDto

  @ApiPropertyOptional({
    type: LoginDeviceDto,
    description: 'Optional device hints attached to the newly established session.'
  })
  @IsOptional()
  device?: LoginDeviceDto
}

// Defines the refresh token payload used to renew a user session.
export class RefreshSessionDto {
  @ApiProperty({
    description: 'Refresh token issued by a previous successful login or refresh.',
    maxLength: 4096,
    example: 'eyJhbGciOi...'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  refreshToken: string
}
