import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'

// ShortLinkTargetDto maps admin target input without owning target business semantics.
export class ShortLinkTargetDto {
  @IsIn(['INTERNAL_REF', 'EXTERNAL_URL'])
  targetKind!: 'INTERNAL_REF' | 'EXTERNAL_URL'

  @IsOptional()
  @IsString()
  targetType?: string

  @IsOptional()
  @IsString()
  targetResourceId?: string

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  targetUrl?: string
}

// CreateShortLinkDto carries tenant-web ShortLink create form input into the BFF.
export class CreateShortLinkDto {
  @IsString()
  @IsNotEmpty()
  displayName!: string

  @ValidateNested()
  @Type(() => ShortLinkTargetDto)
  target!: ShortLinkTargetDto

  @IsString()
  @IsNotEmpty()
  entryPurpose!: string

  @IsString()
  @IsNotEmpty()
  sourcePlacement!: string

  @IsOptional()
  @IsString()
  campaignRef?: string

  @IsOptional()
  @IsISO8601()
  expiresAt?: string
}

// UpdateShortLinkTargetDto carries target migration input and operator reason.
export class UpdateShortLinkTargetDto {
  @ValidateNested()
  @Type(() => ShortLinkTargetDto)
  target!: ShortLinkTargetDto

  @IsOptional()
  @IsString()
  reason?: string
}

// UpdateShortLinkMetadataDto carries mutable display, attribution, and expiry fields.
export class UpdateShortLinkMetadataDto {
  @IsOptional()
  @IsString()
  displayName?: string

  @IsOptional()
  @IsString()
  entryPurpose?: string

  @IsOptional()
  @IsString()
  sourcePlacement?: string

  @IsOptional()
  @IsString()
  campaignRef?: string

  @IsOptional()
  @IsISO8601()
  expiresAt?: string
}

// ChangeShortLinkStatusDto carries status transition input for admin actions.
export class ChangeShortLinkStatusDto {
  @IsIn(['ACTIVE', 'DISABLED', 'ARCHIVED'])
  targetStatus!: 'ACTIVE' | 'DISABLED' | 'ARCHIVED'

  @IsOptional()
  @IsString()
  reason?: string
}
