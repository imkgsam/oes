import { Type } from 'class-transformer'
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'

// BusinessCardVisibilityConfigDto carries admin display visibility switches.
export class BusinessCardVisibilityConfigDto {
  @IsBoolean()
  showTitle!: boolean

  @IsBoolean()
  showDepartment!: boolean

  @IsBoolean()
  showCompany!: boolean

  @IsBoolean()
  showOfficialPhoto!: boolean
}

// BusinessCardContactActionConfigDto carries Contact Action references without contact value bodies.
export class BusinessCardContactActionConfigDto {
  @IsIn(['CALL_PHONE', 'SEND_EMAIL', 'ADD_WECHAT', 'OPEN_WHATSAPP', 'SAVE_VCARD', 'OPEN_COMPANY_WEBSITE'])
  contactActionType!: string

  @IsIn(['CONTACT_ASSET', 'TENANT_PUBLIC_PROFILE', 'NONE'])
  targetRefType!: string

  @IsOptional()
  @IsString()
  targetRefId?: string | null

  @IsIn(['PUBLIC', 'HIDDEN'])
  visibility!: string

  @IsNumber()
  displayOrder!: number

  @IsBoolean()
  enabled!: boolean

  @IsBoolean()
  includeInVCard!: boolean
}

// EnsurePrimaryBusinessCardDto carries the employee reference for card creation/ensure.
export class EnsurePrimaryBusinessCardDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string
}

// UpdateBusinessCardConfigDto carries template and field visibility configuration.
export class UpdateBusinessCardConfigDto {
  @IsOptional()
  @IsString()
  templateKey?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessCardVisibilityConfigDto)
  visibilityConfig?: BusinessCardVisibilityConfigDto
}

// UpdateBusinessCardContactActionsDto carries the full Contact Action configuration list.
export class UpdateBusinessCardContactActionsDto {
  @ValidateNested({ each: true })
  @Type(() => BusinessCardContactActionConfigDto)
  contactActionConfigs!: BusinessCardContactActionConfigDto[]

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessCardVisibilityConfigDto)
  visibilityConfig?: BusinessCardVisibilityConfigDto
}
