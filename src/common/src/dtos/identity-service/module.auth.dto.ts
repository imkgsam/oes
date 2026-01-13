import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class AuthModuleRequestDto {
  @IsString()
  clientId!: string

  @IsString()
  clientSecret!: string
}

export class AuthModuleResponseDto {
  @IsString()
  @MaxLength(255)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alias?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  notes?: string
}
