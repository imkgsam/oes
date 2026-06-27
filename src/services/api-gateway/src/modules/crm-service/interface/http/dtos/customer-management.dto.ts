import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

const CRM_ACCOUNT_LIFECYCLE_STAGE_VALUES = ['LEAD', 'PROSPECT_CUSTOMER', 'CUSTOMER'] as const
const CRM_ACCOUNT_RECORD_STATUS_VALUES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const
const CRM_ACCOUNT_TYPE_HINT_VALUES = ['UNKNOWN', 'PERSON', 'ORGANIZATION'] as const
const CRM_ARCHIVE_REASON_VALUES = [
  'LOW_VALUE',
  'INVALID_TARGET',
  'NON_TARGET_ACCOUNT',
  'COMPETITOR',
  'DUPLICATE',
  'NO_FIT',
  'UNRESPONSIVE',
  'OTHER'
] as const
const CRM_LEAD_ASSIGNMENT_INTENT_VALUES = ['OWNED_BY_OPERATOR', 'POOL'] as const
const CRM_PRIORITY_VALUES = ['A', 'B', 'C', 'D'] as const
const CRM_SOURCE_TYPE_VALUES = [
  'WEBSITE_FORM',
  'EXHIBITION_SCAN',
  'BUSINESS_CARD',
  'AD_CAMPAIGN',
  'REFERRAL',
  'IMPORTED_LIST',
  'BROWSER_EXTENSION',
  'WEB_RESEARCH',
  'PEER_TRANSFER',
  'SOCIAL_MEDIA',
  'OTHER'
] as const

/** CrmLeadIdentifierDto defines one strong identifier evidence value submitted with a CRM lead. */
export class CrmLeadIdentifierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identifierType!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  normalizedValue!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rawValue?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuerCountryOrRegion?: string
}

/** ListCrmAccountsDto defines the CRM P1 workspace account filters exposed through the BFF. */
export class ListCrmAccountsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ enum: CRM_ACCOUNT_LIFECYCLE_STAGE_VALUES })
  @IsOptional()
  @IsString()
  lifecycleStage?: string

  @ApiPropertyOptional({ enum: CRM_ACCOUNT_LIFECYCLE_STAGE_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  lifecycleStages?: string[]

  @ApiPropertyOptional({ enum: CRM_ACCOUNT_RECORD_STATUS_VALUES })
  @IsOptional()
  @IsIn(CRM_ACCOUNT_RECORD_STATUS_VALUES)
  @IsString()
  recordStatus?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerAccountId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ownerless?: boolean

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number
}

/** CrmLeadDraftFieldsDto defines editable CRM lead fields shared by draft and active creation. */
export class CrmLeadDraftFieldsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  displayName!: string

  @ApiPropertyOptional({ enum: CRM_ACCOUNT_TYPE_HINT_VALUES })
  @IsOptional()
  @IsString()
  partyTypeHint?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadCompanyName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadPersonName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadDomain?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadEmail?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadPhone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadWhatsapp?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadCountry?: string

  @ApiPropertyOptional({ type: [CrmLeadIdentifierDto] })
  @IsOptional()
  @IsArray()
  leadIdentifiers?: CrmLeadIdentifierDto[]

  @ApiPropertyOptional({ enum: CRM_PRIORITY_VALUES })
  @IsOptional()
  @IsString()
  priority?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextFollowUpAt?: string
}

/** CreateLeadDto defines the CRM P1 active lead creation payload accepted by tenant-web. */
export class CreateLeadDto extends CrmLeadDraftFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  duplicateWarningAcknowledged?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  claimForCurrentUser?: boolean

  @ApiPropertyOptional({ enum: CRM_LEAD_ASSIGNMENT_INTENT_VALUES })
  @IsOptional()
  @IsIn(CRM_LEAD_ASSIGNMENT_INTENT_VALUES)
  @IsString()
  assignmentIntent?: string

  @ApiProperty({ enum: CRM_SOURCE_TYPE_VALUES })
  @IsString()
  @IsNotEmpty()
  sourceType!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceCapturedAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceCapturedByAccountId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceExternalReference?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sourceRawPayload?: Record<string, unknown>

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceNote?: string
}

/** CreateDraftLeadDto defines a saved draft lead payload and optional source evidence. */
export class CreateDraftLeadDto extends CrmLeadDraftFieldsDto {
  @ApiPropertyOptional({ enum: CRM_SOURCE_TYPE_VALUES })
  @IsOptional()
  @IsString()
  sourceType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceCapturedAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceCapturedByAccountId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceExternalReference?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sourceRawPayload?: Record<string, unknown>

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceNote?: string
}

/** UpdateDraftLeadDto defines the fields that can be changed before draft submit. */
export class UpdateDraftLeadDto extends CrmLeadDraftFieldsDto {}

/** SubmitDraftLeadDto defines optional submit behavior and fallback source evidence for draft leads. */
export class SubmitDraftLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  duplicateWarningAcknowledged?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  claimForCurrentUser?: boolean

  @ApiPropertyOptional({ enum: CRM_LEAD_ASSIGNMENT_INTENT_VALUES })
  @IsOptional()
  @IsIn(CRM_LEAD_ASSIGNMENT_INTENT_VALUES)
  @IsString()
  assignmentIntent?: string

  @ApiPropertyOptional({ enum: CRM_SOURCE_TYPE_VALUES })
  @IsOptional()
  @IsString()
  sourceType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceCapturedAt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceCapturedByAccountId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceExternalReference?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sourceRawPayload?: Record<string, unknown>

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceNote?: string
}

/** ArchiveCrmAccountDto defines the CRM-owned reason required to archive a Lead or Prospect Customer. */
export class ArchiveCrmAccountDto {
  @ApiProperty({ enum: CRM_ARCHIVE_REASON_VALUES })
  @IsIn(CRM_ARCHIVE_REASON_VALUES)
  @IsString()
  @IsNotEmpty()
  archiveReason!: string
}

/** CheckLeadDuplicateDto defines the evidence payload for explicit duplicate checks. */
export class CheckLeadDuplicateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadCompanyName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadPersonName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadDomain?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadEmail?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadPhone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadWhatsapp?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadCountry?: string

  @ApiPropertyOptional({ type: [CrmLeadIdentifierDto] })
  @IsOptional()
  @IsArray()
  leadIdentifiers?: CrmLeadIdentifierDto[]
}
