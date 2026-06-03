import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'

export enum LoginMethodDto {
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  EMAIL_OTP = 'EMAIL_OTP',
  EMPLOYEE_CODE_PIN = 'EMPLOYEE_CODE_PIN',
  PHONE_PASSWORD = 'PHONE_PASSWORD',
  PHONE_OTP = 'PHONE_OTP'
}

export enum MfaFactorDto {
  EMAIL_OTP = 'EMAIL_OTP',
  SMS_OTP = 'SMS_OTP',
  TOTP = 'TOTP',
  BACKUP_CODE = 'BACKUP_CODE'
}

// Carries optional managed terminal identity hints used by terminal-aware login decisions.
export class LoginDeviceIdentityDto {
  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  manufacturerSerial?: string | null

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  androidId?: string | null

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  appInstallationId?: string | null

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  manufacturer?: string | null

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  model?: string | null
}

// Carries optional managed terminal software hints used by terminal-aware login decisions.
export class LoginDeviceSoftwareDto {
  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  androidVersion?: string | null

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  webViewVersion?: string | null

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  appVersion?: string | null
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

  @ApiPropertyOptional({ type: LoginDeviceIdentityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoginDeviceIdentityDto)
  identity?: LoginDeviceIdentityDto

  @ApiPropertyOptional({ type: LoginDeviceSoftwareDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoginDeviceSoftwareDto)
  software?: LoginDeviceSoftwareDto
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
  @IsOptional()
  @MinLength(1)
  @MaxLength(256)
  identifier?: string

  @ApiProperty({
    description: 'Password or OTP credential matching the selected login method.',
    maxLength: 256,
    example: 'p@ssw0rd-or-otp'
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(256)
  credential?: string

  @ApiPropertyOptional({
    description: 'Tenant-scoped employee code for managed terminal PIN login.',
    maxLength: 64,
    example: 'EMP001'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  employeeCode?: string

  @ApiPropertyOptional({
    description: 'Six digit terminal PIN used with employee-code login.',
    maxLength: 6,
    example: '482915'
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  pin?: string

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

// Defines the PDA employee-code preflight payload; the endpoint itself fixes the login method.
export class EmployeeCodePinPreflightDto {
  @ApiProperty({
    description: 'Tenant-scoped employee code scanned or entered on a managed PDA.',
    maxLength: 64,
    example: 'EMP-0AF-0001'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  employeeCode: string

  @ApiPropertyOptional({
    type: LoginDeviceDto,
    description: 'Optional lightweight PDA device hints attached to the preflight attempt.'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoginDeviceDto)
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
    maxLength: 4096,
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  challengeId: string

  @ApiProperty({
    enum: MfaFactorDto,
    enumName: 'MfaFactor',
    description: 'Selected MFA factor used to verify the pending challenge.'
  })
  @IsEnum(MfaFactorDto)
  factor: MfaFactorDto

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

  @ApiPropertyOptional({
    description:
      'Explicitly trusts the current device after NEW_DEVICE_LOGIN MFA succeeds so future logins can skip the new-device challenge for the configured trust window.'
  })
  @IsOptional()
  @IsBoolean()
  trustCurrentDevice?: boolean

  @ApiPropertyOptional({
    description: 'Factor-specific OTP challenge identifier when the selected MFA factor requires a separate OTP challenge.',
    maxLength: 128,
    example: 'challenge_01HZY2Q8S9K3'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  factorChallengeId?: string
}

// Defines the payload used when the user switches the selected MFA factor during a pending login MFA flow.
export class RequestMfaFactorChallengeDto {
  @ApiProperty({
    description: 'Challenge identifier previously returned by the account-selection MFA step.',
    maxLength: 4096,
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  challengeId: string

  @ApiProperty({
    enum: MfaFactorDto,
    enumName: 'MfaFactor',
    description: 'Target MFA factor that should become active for the pending login MFA flow.'
  })
  @IsEnum(MfaFactorDto)
  factor: MfaFactorDto
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

// Defines the request payload used to switch the authenticated account context after login.
export class SwitchContextDto {
  @ApiProperty({
    description: 'Target account context identifier that belongs to the current authenticated user.',
    maxLength: 128,
    example: 'acct_01HZY2Q8S9K3'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  accountId: string

  @ApiPropertyOptional({
    type: () => LoginDeviceDto,
    description: 'Optional stable client device hints used to preserve trusted-device continuity across account context switches.'
  })
  @IsOptional()
  device?: LoginDeviceDto
}
