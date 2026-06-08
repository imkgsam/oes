import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { GRPC_METADATA_PROPAGATION_FACTORY, GrpcMetadataPropagationFactory } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  EmployeeLifecycleStatus,
  EmploymentStatus,
  HR_QUERY_SERVICE_NAME,
  HrQueryServiceClient
} from '@oes/common/generated/hr_service'
import {
  AccountContactAsset,
  IDENTITY_QUERY_SERVICE_NAME,
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

export const PUBLIC_ENTRY_HR_GRPC_CLIENT = Symbol('PUBLIC_ENTRY_HR_GRPC_CLIENT')
export const PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT = Symbol('PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT')
export const PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT = Symbol('PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT')

type MetadataInput = {
  traceId?: string
}

// BusinessCardEmployeeGrpcAdapter composes employee display facts from HR, Identity, and Tenant Org contracts.
@Injectable()
export class BusinessCardEmployeeGrpcAdapter implements BusinessCardEmployeePort, OnModuleInit {
  private hrQueryService!: HrQueryServiceClient
  private identityQueryService!: IdentityQueryServiceClient
  private tenantOrgQueryService!: TenantOrgQueryServiceClient

  constructor(
    @Inject(PUBLIC_ENTRY_HR_GRPC_CLIENT) private readonly hrClient: ClientGrpc,
    @Inject(PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT) private readonly identityClient: ClientGrpc,
    @Inject(PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT) private readonly tenantOrgClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.hrQueryService = this.hrClient.getService<HrQueryServiceClient>(HR_QUERY_SERVICE_NAME)
    this.identityQueryService =
      this.identityClient.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
    this.tenantOrgQueryService =
      this.tenantOrgClient.getService<TenantOrgQueryServiceClient>(TENANT_ORG_QUERY_SERVICE_NAME)
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
          this.metadata(input)
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
        displayName: normalizeOptional(accountProfile?.displayName) ?? normalizeOptional(account?.displayName) ?? null,
        englishName: null,
        title: normalizeOptional(employment?.positionName) ?? null,
        department,
        officialPhotoUrl: normalizeOptional(accountProfile?.avatarUrl) ?? null,
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
            this.metadata(input)
          ),
          {
            caller: SERVICE_NAMES.PUBLIC_ENTRY,
            method: 'IdentityQueryService.getEmployeeBindingByAccountId'
          }
        ),
        safeGrpcCall(
          this.identityQueryService.getAccountById({ accountId: input.accountId }, this.metadata(input)),
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

  private async resolveEmployeeAccount(input: { tenantId: string; employeeId: string; traceId?: string }) {
    try {
      const response = await safeGrpcCall(
        this.identityQueryService.resolveEmployeeLoginAccount(
          {
            tenantId: input.tenantId,
            employeeId: input.employeeId
          },
          this.metadata(input)
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
        this.identityQueryService.getAccountById({ accountId }, this.metadata({ traceId })),
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
        this.hrQueryService.getActiveEmployment({ employeeId }, this.metadata({ traceId })),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'HrQueryService.getActiveEmployment'
        }
      )
      const employment = response.employment
      if (!employment?.employeeId || employment.status !== EmploymentStatus.EMPLOYMENT_STATUS_ACTIVE) {
        return null
      }
      return employment
    } catch {
      return null
    }
  }

  private async resolveOrgName(tenantId: string, orgUnitId: string, traceId?: string): Promise<string | null> {
    try {
      const response = await safeGrpcCall(
        this.tenantOrgQueryService.getOrgReferenceSummary(
          { tenantId, orgUnitId },
          this.metadata({ traceId })
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

  private metadata(input: MetadataInput) {
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.PUBLIC_ENTRY,
      traceId: input.traceId
    })
  }
}

// BusinessCardContactAssetGrpcAdapter resolves existing identity Contact Asset refs into public-safe action values.
@Injectable()
export class BusinessCardContactAssetGrpcAdapter implements BusinessCardContactAssetPort, OnModuleInit {
  private identityQueryService!: IdentityQueryServiceClient

  constructor(
    @Inject(PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT) private readonly identityClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.identityQueryService =
      this.identityClient.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
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
          this.metadata(input)
        ),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'IdentityQueryService.resolveEmployeeLoginAccount'
        }
      )
      const accountId = normalizeOptional(account.account?.accountId)
      if (!accountId || account.account?.tenantId !== input.tenantId || account.account?.accountEnabled === false) {
        return []
      }

      const [emailAssets, phoneAssets] = await Promise.all([
        this.listWorkEmailAssets(accountId, input.traceId),
        this.listWorkPhoneAssets(accountId, input.traceId)
      ])
      return input.actionRefs.flatMap((ref) =>
        this.resolveActionRef(input.tenantId, ref, emailAssets, phoneAssets)
      )
    } catch {
      return []
    }
  }

  private async listWorkEmailAssets(accountId: string, traceId?: string): Promise<AccountContactAsset[]> {
    try {
      const response = await safeGrpcCall(
        this.identityQueryService.listAccountWorkEmailAssets({ accountId }, this.metadata({ traceId })),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'IdentityQueryService.listAccountWorkEmailAssets'
        }
      )
      return response.assets ?? []
    } catch {
      return []
    }
  }

  private async listWorkPhoneAssets(accountId: string, traceId?: string): Promise<AccountContactAsset[]> {
    try {
      const response = await safeGrpcCall(
        this.identityQueryService.listAccountWorkPhoneAssets({ accountId }, this.metadata({ traceId })),
        {
          caller: SERVICE_NAMES.PUBLIC_ENTRY,
          method: 'IdentityQueryService.listAccountWorkPhoneAssets'
        }
      )
      return response.assets ?? []
    } catch {
      return []
    }
  }

  private resolveActionRef(
    tenantId: string,
    ref: ContactActionResolveRef,
    emailAssets: AccountContactAsset[],
    phoneAssets: AccountContactAsset[]
  ): ContactActionPublicSafeValue[] {
    if (ref.contactActionType === 'SEND_EMAIL') {
      const asset = findAvailableAsset(tenantId, emailAssets, ref.targetRefId)
      if (!asset) return []
      return [toPublicSafeEmailValue(ref, asset)]
    }
    if (ref.contactActionType === 'CALL_PHONE') {
      const asset = findAvailableAsset(tenantId, phoneAssets, ref.targetRefId)
      if (!asset) return []
      return [toPublicSafePhoneValue(ref, asset)]
    }
    return []
  }

  private metadata(input: MetadataInput) {
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.PUBLIC_ENTRY,
      traceId: input.traceId
    })
  }
}

// BusinessCardTenantProfileGrpcAdapter reads tenant display references without making BusinessCard own them.
@Injectable()
export class BusinessCardTenantProfileGrpcAdapter implements BusinessCardTenantProfilePort, OnModuleInit {
  private tenantOrgQueryService!: TenantOrgQueryServiceClient

  constructor(
    @Inject(PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT) private readonly tenantOrgClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.tenantOrgQueryService =
      this.tenantOrgClient.getService<TenantOrgQueryServiceClient>(TENANT_ORG_QUERY_SERVICE_NAME)
  }

  async getCompanyDisplaySummary(input: {
    tenantId: string
    traceId?: string
  }): Promise<BusinessCardCompanyDisplaySummary | null> {
    try {
      const response = await safeGrpcCall(
        this.tenantOrgQueryService.getTenantById(
          { tenantId: input.tenantId },
          this.metadata(input)
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
        websiteUrl: null,
        logoUrl: null
      }
    } catch {
      return null
    }
  }

  private metadata(input: MetadataInput) {
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.PUBLIC_ENTRY,
      traceId: input.traceId
    })
  }
}

// mapEmployeeStatus converts HR lifecycle status into the BusinessCard public readiness status.
function mapEmployeeStatus(status?: EmployeeLifecycleStatus): BusinessCardEmployeeSummary['status'] {
  if (status === EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE) return 'ACTIVE'
  if (status === EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_OFFBOARDED) return 'OFFBOARDED'
  return 'INACTIVE'
}

// normalizeOptional trims transport strings and maps empty values to undefined.
function normalizeOptional(value?: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

// findAvailableAsset selects only tenant-matching active Contact Assets by explicit target ref.
function findAvailableAsset(
  tenantId: string,
  assets: AccountContactAsset[],
  targetRefId?: string | null
): AccountContactAsset | null {
  const asset = assets.find((item) => item.id === targetRefId)
  if (!asset || asset.tenantId !== tenantId || asset.status !== 'ACTIVE' || !asset.value?.trim()) {
    return null
  }
  return asset
}

// toPublicSafeEmailValue maps a work email Contact Asset into the public action contract.
function toPublicSafeEmailValue(
  ref: ContactActionResolveRef,
  asset: AccountContactAsset
): ContactActionPublicSafeValue {
  const value = asset.value?.trim() ?? ''
  return {
    targetRefType: ref.targetRefType,
    targetRefId: ref.targetRefId ?? null,
    contactAssetKind: 'WORK_EMAIL',
    displayValue: value,
    actionUrl: `mailto:${value}`,
    available: true
  }
}

// toPublicSafePhoneValue maps a work phone Contact Asset into the public action contract.
function toPublicSafePhoneValue(
  ref: ContactActionResolveRef,
  asset: AccountContactAsset
): ContactActionPublicSafeValue {
  const value = asset.value?.trim() ?? ''
  return {
    targetRefType: ref.targetRefType,
    targetRefId: ref.targetRefId ?? null,
    contactAssetKind: 'WORK_PHONE',
    displayValue: value,
    actionUrl: `tel:${value.replace(/[^\d+]/g, '')}`,
    available: true
  }
}
