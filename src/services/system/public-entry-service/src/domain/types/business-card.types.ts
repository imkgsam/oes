import {
  OperatorContext,
  ResolvedTargetResult,
  ShortLinkTargetResolver,
  TargetResolverRequest
} from './short-link.types'

export type BusinessCardStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED' | 'ARCHIVED'
export type ContactActionType =
  | 'CALL_PHONE'
  | 'SEND_EMAIL'
  | 'ADD_WECHAT'
  | 'OPEN_WHATSAPP'
  | 'SAVE_VCARD'
  | 'OPEN_COMPANY_WEBSITE'
export type ContactActionTargetRefType = 'CONTACT_ASSET' | 'TENANT_PUBLIC_PROFILE' | 'NONE'
export type ContactActionVisibility = 'PUBLIC' | 'HIDDEN'
export type ReadinessReason =
  | 'READY'
  | 'CARD_DISABLED'
  | 'EMPLOYEE_NOT_FOUND'
  | 'EMPLOYEE_NOT_ACTIVE'
  | 'DISPLAY_NAME_MISSING'
  | 'COMPANY_DISPLAY_MISSING'
  | 'PUBLIC_ENTRY_MISSING'
  | 'TEMPLATE_UNAVAILABLE'
  | 'CONTACT_TARGET_UNAVAILABLE'
  | 'UPSTREAM_TEMPORARILY_UNAVAILABLE'

export type ContactActionConfig = {
  contactActionType: ContactActionType
  targetRefType: ContactActionTargetRefType
  targetRefId?: string | null
  visibility: ContactActionVisibility
  displayOrder: number
  enabled: boolean
  includeInVCard: boolean
}

export type VisibilityConfig = {
  showTitle: boolean
  showDepartment: boolean
  showCompany: boolean
  showOfficialPhoto: boolean
}

export type PublicEntryRef = {
  publicEntryId: string
  shortCode: string
  publicUrl: string
  qrContent: string
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED'
  expiresAt?: Date | null
}

export type BusinessCardRecord = {
  id: string
  tenantId: string
  employeeId: string
  status: BusinessCardStatus
  templateKey: string
  publicEntryRef?: PublicEntryRef | null
  contactActionConfigs: ContactActionConfig[]
  visibilityConfig: VisibilityConfig
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
}

export type BusinessCardAuditEventRecord = {
  id: string
  tenantId: string
  businessCardId: string
  action: string
  before?: unknown
  after?: unknown
  operatorAccountId: string
  operatorOrgId?: string
  traceId?: string
  createdAt: Date
}

export type BusinessCardResourceFacts = {
  tenantId: string
  businessCardId: string
  employeeId: string
  status: BusinessCardStatus
}

export type BusinessCardSummary = {
  businessCardId: string
  tenantId: string
  employeeId: string
  status: BusinessCardStatus
  templateKey: string
  publicEntryRef: SerializedPublicEntryRef | null
  contactActionConfigs: ContactActionConfig[]
  visibilityConfig: VisibilityConfig
  updatedAt: string
}

export type SerializedPublicEntryRef = Omit<PublicEntryRef, 'expiresAt'> & {
  expiresAt: string | null
}

export type PublicBusinessCardView = {
  businessCardId: string
  publicUrl: string | null
  templateKey: string
  person: {
    displayName: string
    englishName?: string | null
    title?: string | null
    department?: string | null
    officialPhotoUrl?: string | null
  }
  company: {
    companyDisplayName: string
    websiteUrl?: string | null
    logoUrl?: string | null
  }
  contactActions: PublicContactAction[]
}

export type PublicContactAction = {
  contactActionType: ContactActionType
  displayOrder: number
  displayValue?: string | null
  actionUrl?: string | null
}

export type PublicRenderResult =
  | { state: 'AVAILABLE'; view: PublicBusinessCardView }
  | { state: 'PUBLIC_CARD_UNAVAILABLE' | 'PUBLIC_CARD_NOT_FOUND'; view?: null }

export type BusinessCardTargetResolver = ShortLinkTargetResolver & {
  resolve(request: TargetResolverRequest): Promise<ResolvedTargetResult>
}

export const DEFAULT_VISIBILITY_CONFIG: VisibilityConfig = {
  showTitle: true,
  showDepartment: true,
  showCompany: true,
  showOfficialPhoto: true
}

export const TENANT_STANDARD_TEMPLATE_KEY = 'TENANT_STANDARD'

export { OperatorContext }
