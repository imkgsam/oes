import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested
} from 'class-validator'

// Defines the optional account-provisioning input accepted by the member account-access command.
export class ProvisionEmployeeAccessAccountDto {
  @ApiProperty({ maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  displayName!: string

  @ApiPropertyOptional({ maxLength: 256 })
  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string
}

// Defines the member account-access completion payload consumed by the HR tenant entry.
export class CompleteEmployeeAccessDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  employmentId!: string

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleIds!: string[]

  @ApiPropertyOptional({ maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  reason?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  existingAccountId?: string

  @ApiPropertyOptional({ type: () => ProvisionEmployeeAccessAccountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProvisionEmployeeAccessAccountDto)
  createAccount?: ProvisionEmployeeAccessAccountDto
}
