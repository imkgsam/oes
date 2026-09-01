import {
  BusinessCardResourceFacts,
  ContactActionType,
  ContactActionTargetRefType,
  OperatorContext
} from '../../domain/types/business-card.types'

export type BusinessCardEmployeeSummary = {
  tenantId: string
  employeeId: string
  accountId?: string | null
  displayName?: string | null
  englishName?: string | null
  title?: string | null
  department?: string | null
  orgUnitId?: string | null
  officialPhotoUrl?: string | null
  contactValues?: ContactActionPublicSafeValue[]
  status: 'ACTIVE' | 'INACTIVE' | 'OFFBOARDED'
}

export type BusinessCardCompanyDisplaySummary = {
  tenantId: string
  companyDisplayName?: string | null
  websiteUrl?: string | null
  departmentDisplayName?: string | null
  logoUrl?: string | null
}

export type ContactActionPublicSafeValue = {
  contactActionType: ContactActionType
  targetRefType: ContactActionTargetRefType
  targetRefId?: string | null
  contactAssetKind?:
    | 'WORK_PHONE'
    | 'WORK_EMAIL'
    | 'WECHAT'
    | 'WHATSAPP'
    | 'EXTERNAL_COMMUNICATION_ACCOUNT'
    | 'OTHER_SOCIAL'
    | 'TENANT_WEBSITE'
  displayValue?: string | null
  actionUrl?: string | null
  available: boolean
  includeInVCardAllowed: boolean
}

export type ContactActionResolveRef = {
  contactActionType: ContactActionType
  targetRefType: ContactActionTargetRefType
  targetRefId?: string | null
}

export type BusinessCardQueryScope = {
  tenantId: string
  employeeIds?: string[]
}

// BusinessCardEmployeePort reads employee and account-binding facts from upstream services.
export interface BusinessCardEmployeePort {
  getEmployeeSummary(input: {
    tenantId: string
    employeeId: string
    actionRefs?: ContactActionResolveRef[]
    traceId?: string
  }): Promise<BusinessCardEmployeeSummary | null>
  getEmployeeByAccount(input: {
    tenantId: string
    accountId: string
    traceId?: string
  }): Promise<BusinessCardEmployeeSummary | null>
}

// BusinessCardContactAssetPort resolves Contact Asset references into public-safe action values.
export interface BusinessCardContactAssetPort {
  resolvePublicSafeValues(input: {
    tenantId: string
    employeeId: string
    actionRefs: ContactActionResolveRef[]
    traceId?: string
  }): Promise<ContactActionPublicSafeValue[]>
}

// BusinessCardTenantProfilePort reads company display facts without making BusinessCard own tenant truth.
export interface BusinessCardTenantProfilePort {
  getCompanyDisplaySummary(input: {
    tenantId: string
    orgUnitId?: string | null
    traceId?: string
  }): Promise<BusinessCardCompanyDisplaySummary | null>
}

// BusinessCardAuthorizationPort enforces Phase 1 permission codes with tenant-wide admin scope.
export interface BusinessCardAuthorizationPort {
  checkPermission(input: {
    tenantId: string
    permissionCode: string
    operatorContext: OperatorContext
  }): Promise<boolean>
  buildQueryScope(input: {
    tenantId: string
    permissionCode: string
    operatorContext: OperatorContext
  }): Promise<BusinessCardQueryScope>
  checkResource(input: {
    tenantId: string
    permissionCode: string
    resource: BusinessCardResourceFacts
    operatorContext: OperatorContext
  }): Promise<boolean>
}
