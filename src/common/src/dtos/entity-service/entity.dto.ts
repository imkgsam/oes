import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsDateString,
  IsUrl
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

// ============ Enums ============
export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION'
}

// ============ Request DTOs ============

export class EntityIdRequestDto {
  @IsUUID()
  entityId!: string
}

export class CreateEntityRequestDto {
  @IsEnum(EntityType, { message: 'type must be either PERSON or ORGANIZATION' })
  type!: EntityType

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

export class UpdateEntityRequestDto {
  @IsUUID()
  entityId!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alias?: string | null

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  notes?: string | null
}

export class ListEntitiesRequestDto {
  @IsOptional()
  @IsEnum(EntityType, { message: 'type must be either PERSON or ORGANIZATION' })
  type?: EntityType

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number
}

// ============ Person Profile DTOs ============

export class CreatePersonProfileRequestDto {
  @IsUUID()
  entityId!: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string

  @IsOptional()
  @IsDateString()
  birthday?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  idNumber?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string
}

export class UpdatePersonProfileRequestDto {
  @IsUUID()
  entityId!: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string | null

  @IsOptional()
  @IsDateString()
  birthday?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(50)
  idNumber?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string | null
}

// ============ Organization Profile DTOs ============

export class CreateOrganizationProfileRequestDto {
  @IsUUID()
  entityId!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string
}

export class UpdateOrganizationProfileRequestDto {
  @IsUUID()
  entityId!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxId?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string | null

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string | null
}

// ============ Response DTOs ============

export class EntityDto {
  id!: string
  type!: EntityType
  name!: string
  alias?: string | null
  isActive!: boolean
  notes?: string | null
  createdAt!: Date
  updatedAt!: Date
}

export class PersonProfileDto {
  id!: string
  entityId!: string
  gender?: string | null
  birthday?: Date | null
  idNumber?: string | null
  passportNumber?: string | null
  createdAt!: Date
  updatedAt!: Date
}

export class OrganizationProfileDto {
  id!: string
  entityId!: string
  legalName?: string | null
  registrationNumber?: string | null
  taxId?: string | null
  country?: string | null
  website?: string | null
  createdAt!: Date
  updatedAt!: Date
}

export class EntityListResponseDto {
  entities!: EntityDto[]
  total!: number
}
