import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  EmployeeLifecycleStatus,
  EmploymentStatus,
  HR_QUERY_SERVICE_NAME,
  HrQueryServiceClient
} from '@oes/common/generated/hr_service'
import {
  IDENTITY_QUERY_SERVICE_NAME,
  ResolvedContactActionTarget,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import {
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  BusinessCardCompanyDisplaySummary,
  BusinessCardContactAssetPort,
  BusinessCardEmployeePort,
  BusinessCardEmployeeSummary,
  BusinessCardTenantProfilePort,
  ContactActionPublicSafeValue,
  ContactActionResolveRef
} from '../../application/ports/business-card.ports'
import { PublicEntryFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

export const PUBLIC_ENTRY_HR_GRPC_CLIENT = Symbol('PUBLIC_ENTRY_HR_GRPC_CLIENT')
export const PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT = Symbol('PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT')
export const PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT = Symbol('PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT')

// BusinessCardEmployeeGrpcAdapter composes employee display facts from HR, Identity, and Tenant Org contracts.
@Injectable()
export class BusinessCardEmployeeGrpcAdapter implements BusinessCardEmployeePort, OnModuleInit {
  private hrQueryService!: HrQueryServiceClient
  private identityQueryService!: IdentityQueryServiceClient
  private tenantOrgQueryService!: TenantOrgQueryServiceClient
  private readonly trusted = new PublicEntryFoundationTrustedGrpcExecutionProducer()

  constructor(
    @Inject(PUBLIC_ENTRY_HR_GRPC_CLIENT) private readonly hrClient: ClientGrpc,
    @Inject(PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT) private readonly identityClient: ClientGrpc,
    @Inject(PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT) private readonly tenantOrgClient: ClientGrpc
  ) {}

  onModuleInit(): void {
    this.hrQueryService = this.hrClient.getService<HrQueryServiceClient>(HR_QUERY_SERVICE_NAME)
    this.identityQueryService = this.identityClient.getService<IdentityQueryServiceClient>(
      IDENTITY_QUERY_SERVICE_NAME
    )
    this.tenantOrgQueryService = this.tenantOrgClient.getService<TenantOrgQueryServiceClient>(
      TENANT_ORG_QUERY_SERVICE_NAME
    )
  }

  async getEmployeeSummary(input: {
    tenantId: string
    employeeId: string
    traceId?: string
  }): Promise<BusinessCardEmployeeSummary | null> {
    try {
      const employeeResponse = await safeGrpcCall(
        this.hrQueryService.getEmployeeById(
          { employeeId: input.employeeId },
          await this.trusted.forBusinessCall('hr-service', ['hr.employee.get_by_id'])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'HrQueryService.getEmployeeById'
        }
      )
      const employee = employeeResponse.employee
      if (!employee?.id || employee.tenantId !== input.tenantId) return null

      const [account, employment] = await Promise.all([
        this.resolveEmployeeAccount(input),
        this.resolveActiveEmployment(input.employeeId, input.traceId)
      ])
      if (account && account.tenantId !== input.tenantId) return null
      if (account && account.accountEnabled === false) return null
      const accountProfile = account?.accountId
        ? await this.resolveAccountProfile(account.accountId, input.traceId)
        : null
      if (accountProfile && accountProfile.tenantId !== input.tenantId) return null
      if (accountProfile && !accountProfile.isEnabled) return null

      const department = employment?.orgUnitId
        ? await this.resolveOrgName(input.tenantId, employment.orgUnitId, input.traceId)
        : null

      return {
        tenantId: input.tenantId,
        employeeId: employee.id,
        accountId: normalizeOptional(account?.accountId) ?? null,
        displayName:
          normalizeOptional(accountProfile?.displayName) ??
          normalizeOptional(account?.displayName) ??
          null,
        englishName: null,
        title: normalizeOptional(employment?.positionName) ?? null,
        department,
        officialPhotoUrl: normalizeOptional(employee.officialPhotoUrl) ?? null,
        status: mapEmployeeStatus(employee.lifecycleStatus)
      }
    } catch {
      return null
    }
  }

  async getEmployeeByAccount(input: {
    tenantId: string
    accountId: string
    traceId?: string
  }): Promise<BusinessCardEmployeeSummary | null> {
    try {
      const [bindingResponse, accountResponse] = await Promise.all([
        safeGrpcCall(
          this.identityQueryService.getEmployeeBindingByAccountId(
            { accountId: input.accountId },
            await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
          ),
          {
            caller: SERVICE_NAMES.PUBLIC_ENTRY,
            method: 'IdentityQueryService.getEmployeeBindingByAccountId'
          }
        ),
        safeGrpcCall(
          this.identityQueryService.getAccountById(
            { accountId: input.accountId },
            await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
          ),
          {
            caller: SERVICE_NAMES.PUBLIC_ENTRY,
            method: 'IdentityQueryService.getAccountById'
          }
        )
      ])
      const binding = bindingResponse.binding
      const account = accountResponse.account
      if (!binding?.employeeId || binding.tenantId !== input.tenantId) return null
      if (!account?.id || account.tenantId !== input.tenantId || !account.isEnabled) return null
      return this.getEmployeeSummary({
        tenantId: input.tenantId,
        employeeId: binding.employeeId,
        traceId: input.traceId
      })
    } catch {
      return null
    }
  }

  private async resolveEmployeeAccount(input: {
    tenantId: string
    employeeId: string
    traceId?: string
  }) {
    try {
      const response = await safeGrpcCall(
        this.identityQueryService.resolveEmployeeLoginAccount(
          {
            tenantId: input.tenantId,
            employeeId: input.employeeId
          },
          await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'IdentityQueryService.resolveEmployeeLoginAccount'
        }
      )
      return response.account ?? null
    } catch {
      return null
    }
  }

  private async resolveAccountProfile(accountId: string, traceId?: string) {
    try {
      const response = await safeGrpcCall(
        this.identityQueryService.getAccountById(
          { accountId },
          await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'IdentityQueryService.getAccountById'
        }
      )
      return response.account ?? null
    } catch {
      return null
    }
  }

  private async resolveActiveEmployment(employeeId: string, traceId?: string) {
    try {
      const response = await safeGrpcCall(
        this.hrQueryService.getActiveEmployment(
          { employeeId },
          await this.trusted.forBusinessCall('hr-service', ['hr.employee.get_by_id'])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'HrQueryService.getActiveEmployment'
        }
      )
      const employment = response.employment
      if (
        !employment?.employeeId ||
        employment.status !== EmploymentStatus.EMPLOYMENT_STATUS_ACTIVE
      ) {
        return null
      }
      return employment
    } catch {
      return null
    }
  }

  private async resolveOrgName(
    tenantId: string,
    orgUnitId: string,
    traceId?: string
  ): Promise<string | null> {
    try {
      const response = await safeGrpcCall(
        this.tenantOrgQueryService.getOrgReferenceSummary(
          { tenantId, orgUnitId },
          await this.trusted.forBusinessCall('tenant-org-service', [
            'tenant_org.org_unit.list_tree'
          ])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'TenantOrgQueryService.getOrgReferenceSummary'
        }
      )
      return normalizeOptional(response.orgUnit?.name) ?? null
    } catch {
      return null
    }
  }
}

// BusinessCardContactAssetGrpcAdapter resolves existing identity Contact Asset refs into public-safe action values.
@Injectable()
export class BusinessCardContactAssetGrpcAdapter
  implements BusinessCardContactAssetPort, OnModuleInit
{
  private identityQueryService!: IdentityQueryServiceClient
  private readonly trusted = new PublicEntryFoundationTrustedGrpcExecutionProducer()

  constructor(
    @Inject(PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT) private readonly identityClient: ClientGrpc
  ) {}

  onModuleInit(): void {
    this.identityQueryService = this.identityClient.getService<IdentityQueryServiceClient>(
      IDENTITY_QUERY_SERVICE_NAME
    )
  }

  async resolvePublicSafeValues(input: {
    tenantId: string
    employeeId: string
    actionRefs: ContactActionResolveRef[]
    traceId?: string
  }): Promise<ContactActionPublicSafeValue[]> {
    try {
      const account = await safeGrpcCall(
        this.identityQueryService.resolveEmployeeLoginAccount(
          {
            tenantId: input.tenantId,
            employeeId: input.employeeId
          },
          await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'IdentityQueryService.resolveEmployeeLoginAccount'
        }
      )
      const accountId = normalizeOptional(account.account?.accountId)
      if (
        !accountId ||
        account.account?.tenantId !== input.tenantId ||
        account.account?.accountEnabled === false
      ) {
        return []
      }

      const response = await safeGrpcCall(
        this.identityQueryService.resolveContactActionTargets(
          {
            tenantId: input.tenantId,
            accountId,
            employeeId: input.employeeId,
            targetRefs: input.actionRefs.map((ref) => ({
              contactActionType: ref.contactActionType,
              targetRefType: ref.targetRefType,
              targetRefId: ref.targetRefId ?? ''
            }))
          },
          await this.trusted.forBusinessCall('identity-service', ['identity.account.self.read'])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'IdentityQueryService.resolveContactActionTargets'
        }
      )

      return (response.targets ?? [])
        .filter((target) => target.renderable && target.publicValueSummary)
        .map((target) => toPublicSafeContactValue(target))
        .filter((value): value is ContactActionPublicSafeValue => Boolean(value))
    } catch {
      return []
    }
  }
}

// toPublicSafeContactValue maps identity public-safe resolver output into BusinessCard action values.
function toPublicSafeContactValue(
  target: ResolvedContactActionTarget
): ContactActionPublicSafeValue | null {
  const summary = target.publicValueSummary
  if (!summary?.type || !summary.actionUri || !summary.displayValue) {
    return null
  }

  return {
    targetRefType: normalizeTargetRefType(target.targetRefType),
    targetRefId: normalizeOptional(target.targetRefId) ?? null,
    contactAssetKind: normalizeContactAssetKind(summary.type),
    displayValue: summary.displayValue,
    actionUrl: summary.actionUri,
    available: true
  }
}

// normalizeTargetRefType keeps transport strings inside the BusinessCard target ref union.
function normalizeTargetRefType(value?: string | null): ContactActionResolveRef['targetRefType'] {
  if (value === 'TENANT_PUBLIC_PROFILE') return 'TENANT_PUBLIC_PROFILE'
  if (value === 'NONE') return 'NONE'
  return 'CONTACT_ASSET'
}

// normalizeContactAssetKind keeps identity Contact Asset types inside the BusinessCard public value union.
function normalizeContactAssetKind(
  value: string
): NonNullable<ContactActionPublicSafeValue['contactAssetKind']> {
  if (
    value === 'WORK_PHONE' ||
    value === 'WORK_EMAIL' ||
    value === 'WECHAT' ||
    value === 'WHATSAPP' ||
    value === 'EXTERNAL_COMMUNICATION_ACCOUNT' ||
    value === 'OTHER_SOCIAL'
  ) {
    return value
  }
  return 'OTHER_SOCIAL'
}
// BusinessCardTenantProfileGrpcAdapter reads tenant display references without making BusinessCard own them.
@Injectable()
export class BusinessCardTenantProfileGrpcAdapter
  implements BusinessCardTenantProfilePort, OnModuleInit
{
  private tenantOrgQueryService!: TenantOrgQueryServiceClient
  private readonly trusted = new PublicEntryFoundationTrustedGrpcExecutionProducer()

  constructor(
    @Inject(PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT) private readonly tenantOrgClient: ClientGrpc
  ) {}

  onModuleInit(): void {
    this.tenantOrgQueryService = this.tenantOrgClient.getService<TenantOrgQueryServiceClient>(
      TENANT_ORG_QUERY_SERVICE_NAME
    )
  }

  async getCompanyDisplaySummary(input: {
    tenantId: string
    traceId?: string
  }): Promise<BusinessCardCompanyDisplaySummary | null> {
    try {
      const response = await safeGrpcCall(
        this.tenantOrgQueryService.getTenantById(
          { tenantId: input.tenantId },
          await this.trusted.forBusinessCall('tenant-org-service', ['tenant_org.tenant.get_by_id'])
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'TenantOrgQueryService.getTenantById'
        }
      )
      const tenant = response.tenant
      if (!tenant?.id || tenant.id !== input.tenantId) return null
      return {
        tenantId: tenant.id,
        companyDisplayName: normalizeOptional(tenant.name) ?? null,
        websiteUrl: normalizeOptional(tenant.websiteUrl) ?? null,
        logoUrl: null
      }
    } catch {
      return null
    }
  }
}

// mapEmployeeStatus converts HR lifecycle status into the BusinessCard public readiness status.
function mapEmployeeStatus(
  status?: EmployeeLifecycleStatus
): BusinessCardEmployeeSummary['status'] {
  if (status === EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE) return 'ACTIVE'
  if (status === EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_OFFBOARDED) return 'OFFBOARDED'
  return 'INACTIVE'
}

// normalizeOptional trims transport strings and maps empty values to undefined.
function normalizeOptional(value?: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
