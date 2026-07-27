import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested
} from 'class-validator'

const EXTENSION_PAGE_KIND_VALUES = ['OFFICIAL_SITE', 'SEARCH_RESULTS'] as const
const EXTENSION_SEARCH_ENGINE_VALUES = ['GOOGLE', 'BING', 'OTHER'] as const
const EXTENSION_CAPTURE_KIND_VALUES = ['CURRENT_PAGE', 'LINK'] as const
const EXTENSION_PROFILE_ITEM_TYPE_VALUES = [
  'DOMAIN',
  'WEBSITE',
  'EMAIL',
  'PHONE',
  'WHATSAPP',
  'WECHAT',
  'SOCIAL_PROFILE'
] as const

/** ExtensionProfileItemDto validates one account-level profile item supplied by browser extension capture. */
export class ExtensionProfileItemDto {
  @IsIn(EXTENSION_PROFILE_ITEM_TYPE_VALUES)
  itemType!: string

  @IsString()
  @IsNotEmpty()
  normalizedValue!: string

  @IsOptional()
  @IsString()
  rawValue?: string

  @IsOptional()
  @IsString()
  label?: string

  @IsOptional()
  @IsString()
  role?: string
}

/** ExtensionPageSignalsDto validates bounded browser-collected page evidence. */
export class ExtensionPageSignalsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  domain!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string

  @IsIn(EXTENSION_PAGE_KIND_VALUES)
  pageKind!: string

  @IsOptional()
  @IsString()
  @MaxLength(600)
  selectedText?: string

  @IsOptional()
  @IsArray()
  visibleEmails?: string[]

  @IsOptional()
  @IsArray()
  visiblePhones?: string[]

  @IsOptional()
  @IsArray()
  companyNameCandidates?: string[]

  @IsOptional()
  @IsArray()
  socialLinks?: string[]

  @IsString()
  @IsNotEmpty()
  capturedAt!: string
}

/** ResolveExtensionPageContextDto validates current-page resolve requests. */
export class ResolveExtensionPageContextDto {
  @ValidateNested()
  @Type(() => ExtensionPageSignalsDto)
  page!: ExtensionPageSignalsDto
}

/** ExtensionSearchResultDto validates one search result candidate. */
export class ExtensionSearchResultDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  domain!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(600)
  snippet?: string
}

/** ExtensionLeadCaptureBrowserContextDto validates the browser context attached to Lead capture evidence. */
export class ExtensionLeadCaptureBrowserContextDto {
  @IsIn(['CONTEXT_MENU'])
  entryPoint!: string

  @IsIn(['CRM'])
  workspace!: string
}

/** ExtensionLeadCaptureDto validates the standard browser-extension CRM Lead capture payload. */
export class ExtensionLeadCaptureDto {
  [key: string]: unknown

  @IsIn(EXTENSION_CAPTURE_KIND_VALUES)
  captureKind!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  targetUrl!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  sourcePageUrl!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sourcePageTitle!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  targetDomain!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  targetTitle!: string

  @IsOptional()
  @IsArray()
  companyNameCandidates?: string[]

  @IsOptional()
  @IsArray()
  visibleEmails?: string[]

  @IsOptional()
  @IsArray()
  visiblePhones?: string[]

  @IsOptional()
  @IsArray()
  socialLinks?: string[]

  @IsString()
  @IsNotEmpty()
  capturedAt!: string

  @ValidateNested()
  @Type(() => ExtensionLeadCaptureBrowserContextDto)
  browserContext!: ExtensionLeadCaptureBrowserContextDto
}

/** ResolveExtensionSearchResultsDto validates read-only search result resolve requests. */
export class ResolveExtensionSearchResultsDto {
  @IsIn(EXTENSION_SEARCH_ENGINE_VALUES)
  searchEngine!: string

  @IsString()
  @MaxLength(255)
  query!: string

  @IsString()
  @IsNotEmpty()
  capturedAt!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtensionSearchResultDto)
  results!: ExtensionSearchResultDto[]
}

/** ExtensionLeadInputDto validates extension lead create and duplicate check payloads. */
export class ExtensionLeadInputDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ExtensionLeadCaptureDto)
  capture?: ExtensionLeadCaptureDto

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName!: string

  @IsOptional()
  @IsString()
  partyTypeHint?: string

  @IsOptional()
  @IsString()
  leadCompanyName?: string

  @IsOptional()
  @IsString()
  leadDomain?: string

  @IsOptional()
  @IsString()
  leadEmail?: string

  @IsOptional()
  @IsString()
  leadPhone?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtensionProfileItemDto)
  profileItems?: ExtensionProfileItemDto[]

  @IsOptional()
  @IsString()
  leadCountry?: string

  @IsOptional()
  @IsString()
  priority?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sourceNote?: string

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  duplicateWarningAcknowledged?: boolean

  @IsOptional()
  @IsObject()
  page?: ExtensionPageSignalsDto
}
