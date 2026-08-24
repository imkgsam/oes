import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PermissionProxyService } from '../permission-service/permission-service.service'
import { OrgManagementService } from '../tenant-org-service/org-management.service'
import { EmployeeOfficialPhotoAssetGrpcAdapter } from './adapters/employee-official-photo-asset-grpc.adapter'
import { HrManagementGrpcAdapter } from './adapters/hr-management-grpc.adapter'
import {
  HrEmployeeSummary,
  HrOnboardingAccessProcessSummary,
  HrQueryGrpcAdapter
} from './adapters/hr-query-grpc.adapter'
import { PartyTenantQueryGrpcAdapter } from './adapters/party-tenant-query-grpc.adapter'

export interface EmployeeOfficialPhotoUploadFile {
  buffer: Buffer
  mimetype: string
  originalname: string
  size: number
}

@Injectable()
// Builds the tenant-scoped employee and employment management model for the gateway HR entry.
export class HrManagementService {
  private readonly logger = new Logger(HrManagementService.name)

  constructor(
    private readonly hrQueryAdapter: HrQueryGrpcAdapter,
    private readonly hrManagementAdapter: HrManagementGrpcAdapter,
    private readonly officialPhotoAssetAdapter: EmployeeOfficialPhotoAssetGrpcAdapter,
    private readonly identityQueryAdapter: IdentityQueryGrpcAdapter,
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly partyTenantQueryAdapter: PartyTenantQueryGrpcAdapter,
    private readonly permissionService: PermissionProxyService,
    private readonly orgManagementService: OrgManagementService
  ) {}

  async listEmployees(
    tenantId: string,
    query: { keyword?: string; lifecycleStatus?: string; page?: number; pageSize?: number },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const result = await this.hrQueryAdapter.listEmployees(
      {
        tenantId: resolvedTenantId,
        keyword: normalize(query.keyword),
        lifecycleStatus: normalizeUpper(query.lifecycleStatus),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    const items = await Promise.all(
      result.items.map(async (employee) => ({
        employee,
        activeEmployment: await this.loadOptionalActiveEmployment(employee.id, source)
      }))
    )
    const [employeeDisplayNameMap, orgUnitMap] = await Promise.all([
      this.loadEmployeeDisplayNameMap(
        resolvedTenantId,
        items.map((item) => item.employee),
        source
      ),
      this.loadOrgUnitMap(
        resolvedTenantId,
        items.map((item) => item.activeEmployment?.orgUnitId),
        source
      )
    ])

    return {
      items: items.map((item) => ({
        employee: this.attachEmployeeDisplayName(item.employee, employeeDisplayNameMap),
        activeEmployment: this.attachOrgUnitSummary(item.activeEmployment, orgUnitMap)
      })),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    }
  }

  async getEmployeeDetail(tenantId: string, employeeId: string, source: DownstreamRequestSource) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const employee = await this.assertEmployeeInTenant(resolvedTenantId, employeeId, source)
    const [activeEmployment, employments] = await Promise.all([
      this.loadOptionalActiveEmployment(employee.id, source),
      this.hrQueryAdapter.listEmployments({ employeeId: employee.id }, source)
    ])
    const [employeeDisplayNameMap, orgUnitMap] = await Promise.all([
      this.loadEmployeeDisplayNameMap(resolvedTenantId, [employee], source),
      this.loadOrgUnitMap(
        resolvedTenantId,
        [activeEmployment?.orgUnitId, ...employments.map((employment) => employment.orgUnitId)],
        source
      )
    ])

    return {
      employee: this.attachEmployeeDisplayName(employee, employeeDisplayNameMap),
      activeEmployment: this.attachOrgUnitSummary(activeEmployment, orgUnitMap),
      employments: employments.map((employment) =>
        this.attachOrgUnitSummary(employment, orgUnitMap)
      )
    }
  }

  async getEmployeeAccountAccess(
    tenantId: string,
    employeeId: string,
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const employee = await this.assertEmployeeInTenant(resolvedTenantId, employeeId, source)
    const [activeEmployment, latestProcess] = await Promise.all([
      this.loadOptionalActiveEmployment(employee.id, source),
      this.hrQueryAdapter.getLatestOnboardingAccess(
        { tenantId: resolvedTenantId, employeeId: employee.id },
        source
      )
    ])

    const accountId = normalize(latestProcess?.accountId)
    const account = accountId ? await this.loadAccountSummary(accountId, source) : undefined
    const loginMethodResult = account?.userId
      ? await this.authAdapter.listLoginMethods(account.userId, source)
      : { loginMethods: [], passwordSetupRequired: false }
    const roles = accountId ? await this.loadRoleSummaries(accountId, resolvedTenantId, source) : []

    return this.buildEmployeeAccessSummary({
      activeEmploymentId: activeEmployment?.id,
      latestProcess,
      account,
      loginMethods: loginMethodResult.loginMethods ?? [],
      passwordSetupRequired: Boolean(loginMethodResult.passwordSetupRequired),
      roles
    })
  }

  /** uploadEmployeeOfficialPhoto coordinates Asset upload, HR truth update, Asset binding, and HR rollback on bind failure. */
  async uploadEmployeeOfficialPhoto(
    tenantId: string,
    employeeId: string,
    file: EmployeeOfficialPhotoUploadFile | undefined,
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary }> {
    if (!file) {
      throw new BadRequestException('official photo file is required')
    }

    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const employee = await this.assertEmployeeInTenant(resolvedTenantId, employeeId, source)
    const previousOfficialPhotoAssetId = normalize(employee.officialPhotoAssetId)
    const previousOfficialPhotoUrl = normalize(employee.officialPhotoUrl)
    const operatorId = this.resolveOperatorId(source)
    const uploadResult = await this.officialPhotoAssetAdapter.uploadEmployeeOfficialPhoto(
      {
        employeeId: requireNonBlank(employeeId, 'employeeId'),
        file: file.buffer,
        fileName: file.originalname,
        contentType: requireNonBlank(file.mimetype, 'contentType')
      },
      source
    )
    const officialPhotoAssetId = requireNonBlank(
      uploadResult.asset?.assetId,
      'officialPhotoAssetId'
    )
    const officialPhotoUrl = requireNonBlank(uploadResult.asset?.publicUrl, 'officialPhotoUrl')
    const updatedEmployee = await this.hrManagementAdapter.updateEmployeeOfficialPhoto(
      {
        tenantId: resolvedTenantId,
        employeeId: requireNonBlank(employeeId, 'employeeId'),
        officialPhotoAssetId,
        officialPhotoUrl
      },
      source
    )

    try {
      await this.officialPhotoAssetAdapter.bindEmployeeOfficialPhoto(
        {
          employeeId: requireNonBlank(employeeId, 'employeeId'),
          newAssetId: officialPhotoAssetId,
          previousAssetId: normalize(employee.officialPhotoAssetId)
        },
        source
      )
    } catch (error) {
      this.logger.warn(
        {
          tenantId: resolvedTenantId,
          employeeId,
          officialPhotoAssetId,
          error
        },
        'Failed to bind employee official photo asset after HR update'
      )
      await this.restorePreviousOfficialPhotoState(
        {
          tenantId: resolvedTenantId,
          employeeId: requireNonBlank(employeeId, 'employeeId'),
          previousOfficialPhotoAssetId,
          previousOfficialPhotoUrl
        },
        source
      )
      throw new BadGatewayException('employee official photo upload did not complete')
    }

    return updatedEmployee
  }

  /** removeEmployeeOfficialPhoto clears the HR-owned official photo reference without touching Identity avatar data. */
  async removeEmployeeOfficialPhoto(
    tenantId: string,
    employeeId: string,
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary }> {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    return this.hrManagementAdapter.removeEmployeeOfficialPhoto(
      {
        tenantId: resolvedTenantId,
        employeeId: requireNonBlank(employeeId, 'employeeId')
      },
      source
    )
  }

  async searchEmployeeUserCandidates(
    tenantId: string,
    query: { countryOrRegion?: string; keyword?: string },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const keyword = requireNonBlank(query.keyword ?? '', 'keyword')
    if (keyword.includes('@')) {
      if (!isCompleteEmailLookupKeyword(keyword)) {
        return { items: [] }
      }
      const result = await this.identityQueryAdapter.getUserByEmail(keyword.toLowerCase(), source)
      return toEmployeeUserCandidateResult(result.user)
    }

    const phoneCandidates = buildPhoneLookupCandidates(keyword, query.countryOrRegion)
    for (const phone of phoneCandidates) {
      const result = await this.identityQueryAdapter.getUserByPhone(phone, source)
      if (result.user?.id) {
        return toEmployeeUserCandidateResult(result.user)
      }
    }
    return { items: [] }
  }

  async previewNextEmployeeCode(tenantId: string, source: DownstreamRequestSource) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const [employeeCodePrefix, employeeResult] = await Promise.all([
      this.orgManagementService.getTenantEmployeeCodePrefix(resolvedTenantId, source),
      this.hrQueryAdapter.listEmployees(
        {
          tenantId: resolvedTenantId,
          page: 1,
          pageSize: 1
        },
        source
      )
    ])
    const sequence = Number(employeeResult.total ?? 0) + 1
    if (sequence > 0xffff) {
      throw new BadRequestException('employeeCode sequence exhausted for this tenant')
    }
    return {
      employeeCode: `EMP-${employeeCodePrefix}-${sequence.toString(16).toUpperCase().padStart(4, '0')}`
    }
  }

  async createEmployee(
    tenantId: string,
    input: {
      account?: {
        displayName: string
        email?: string
        existingUserId?: string
        phone?: string
      }
      employeeCode?: string
      idempotencyKey?: string
      person?: {
        gender?: string
        identifiers?: Array<{
          identifierType: string
          issuerCountryOrRegion?: string
          normalizedValue: string
          rawValue?: string
        }>
        legalName: string
      }
      primaryEmployment?: {
        effectiveFrom: string
        orgUnitId: string
        positionName?: string
      }
      tenantPartyId?: string
    },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)

    if (!input.person) {
      return this.hrManagementAdapter.createEmployee(
        {
          tenantId: resolvedTenantId,
          tenantPartyId: requireNonBlank(input.tenantPartyId, 'tenantPartyId'),
          employeeCode: normalize(input.employeeCode)
        },
        source
      )
    }

    return this.hrManagementAdapter.createEmployeeOnboarding(
      {
        tenantId: resolvedTenantId,
        idempotencyKey:
          normalize(input.idempotencyKey) ||
          buildEmployeeOnboardingIdempotencyKey(resolvedTenantId, input.person),
        employeeCode: normalize(input.employeeCode),
        person: {
          legalName: requireNonBlank(input.person.legalName, 'person.legalName'),
          identifiers: normalizePersonIdentifiers(input.person.identifiers)
        },
        primaryEmployment: input.primaryEmployment
          ? {
              effectiveFrom: requireNonBlank(
                input.primaryEmployment.effectiveFrom,
                'primaryEmployment.effectiveFrom'
              ),
              orgUnitId: normalize(input.primaryEmployment.orgUnitId),
              positionName: normalize(input.primaryEmployment.positionName)
            }
          : undefined,
        createAccount: input.account
          ? {
              displayName: requireNonBlank(input.account.displayName, 'account.displayName'),
              email: normalize(input.account.email),
              existingUserId: normalize(input.account.existingUserId),
              phone: normalize(input.account.phone)
            }
          : undefined
      },
      source
    )
  }

  async createEmployment(
    tenantId: string,
    employeeId: string,
    input: { orgUnitId: string; effectiveFrom: string; positionName?: string },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    await this.assertEmployeeInTenant(resolvedTenantId, employeeId, source)

    return this.hrManagementAdapter.createEmployment(
      {
        tenantId: resolvedTenantId,
        employeeId,
        orgUnitId: requireNonBlank(input.orgUnitId, 'orgUnitId'),
        effectiveFrom: requireNonBlank(input.effectiveFrom, 'effectiveFrom'),
        positionName: normalize(input.positionName)
      },
      source
    )
  }

  async endEmployment(
    tenantId: string,
    employeeId: string,
    employmentId: string,
    input: { effectiveTo: string; endedReason?: string },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    await this.assertEmploymentInTenant(resolvedTenantId, employeeId, employmentId, source)

    return this.hrManagementAdapter.endEmployment(
      {
        employmentId: requireNonBlank(employmentId, 'employmentId'),
        effectiveTo: requireNonBlank(input.effectiveTo, 'effectiveTo'),
        endedReason: normalize(input.endedReason)
      },
      source
    )
  }

  async changePrimaryEmployment(
    tenantId: string,
    employeeId: string,
    input: {
      fromEmploymentId: string
      toOrgUnitId: string
      effectiveFrom: string
      endedReason?: string
      positionName?: string
    },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    await this.assertEmploymentInTenant(
      resolvedTenantId,
      employeeId,
      input.fromEmploymentId,
      source
    )

    return this.hrManagementAdapter.changePrimaryEmployment(
      {
        tenantId: resolvedTenantId,
        employeeId: requireNonBlank(employeeId, 'employeeId'),
        fromEmploymentId: requireNonBlank(input.fromEmploymentId, 'fromEmploymentId'),
        toOrgUnitId: requireNonBlank(input.toOrgUnitId, 'toOrgUnitId'),
        effectiveFrom: requireNonBlank(input.effectiveFrom, 'effectiveFrom'),
        endedReason: normalize(input.endedReason),
        positionName: normalize(input.positionName)
      },
      source
    )
  }

  async completeEmployeeAccess(
    tenantId: string,
    employeeId: string,
    input: {
      employmentId: string
      roleIds: string[]
      reason?: string
      existingAccountId?: string
      createAccount?: {
        displayName: string
        email?: string
        phone?: string
        tenantPartyId?: string
      }
    },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const employee = await this.assertEmployeeInTenant(resolvedTenantId, employeeId, source)

    await this.hrManagementAdapter.completeEmployeeAccess(
      {
        tenantId: resolvedTenantId,
        employeeId: requireNonBlank(employeeId, 'employeeId'),
        employmentId: requireNonBlank(input.employmentId, 'employmentId'),
        roleIds: input.roleIds ?? [],
        reason: normalize(input.reason),
        existingAccountId: normalize(input.existingAccountId),
        createAccount: input.createAccount
          ? {
              displayName: requireNonBlank(input.createAccount.displayName, 'displayName'),
              email: normalize(input.createAccount.email),
              phone: normalize(input.createAccount.phone),
              tenantPartyId: requireNonBlank(employee.tenantPartyId, 'employee.tenantPartyId')
            }
          : undefined
      },
      source
    )

    return this.getEmployeeAccountAccess(resolvedTenantId, employeeId, source)
  }

  private async assertEmployeeInTenant(
    tenantId: string,
    employeeId: string,
    source: DownstreamRequestSource
  ): Promise<HrEmployeeSummary> {
    const employee = await this.hrQueryAdapter.getEmployeeById(
      requireNonBlank(employeeId, 'employeeId'),
      source
    )
    if (employee.tenantId !== tenantId) {
      throw new ForbiddenException('Employee does not belong to the requested tenant')
    }
    return employee
  }

  private async assertEmploymentInTenant(
    tenantId: string,
    employeeId: string,
    employmentId: string,
    source: DownstreamRequestSource
  ) {
    await this.assertEmployeeInTenant(tenantId, employeeId, source)
    const employments = await this.hrQueryAdapter.listEmployments(
      { employeeId: requireNonBlank(employeeId, 'employeeId') },
      source
    )
    const employment = employments.find(
      (item) => item.id === requireNonBlank(employmentId, 'employmentId')
    )
    if (!employment) {
      throw new NotFoundException(`Employment ${employmentId} not found`)
    }
    return employment
  }

  private async loadOptionalActiveEmployment(employeeId: string, source: DownstreamRequestSource) {
    try {
      return await this.hrQueryAdapter.getActiveEmployment(employeeId, source)
    } catch (error) {
      if (error instanceof NotFoundException) {
        return undefined
      }
      throw error
    }
  }

  /** loadAccountSummary reads a bounded account snapshot for the HR member access block without shifting account ownership. */
  private async loadAccountSummary(accountId: string, source: DownstreamRequestSource) {
    const result = await this.identityQueryAdapter.getAccountById(accountId, source)
    if (!result.account?.id) {
      return undefined
    }

    return {
      accountId: result.account.id,
      userId: result.account.userId ?? '',
      tenantId: normalize(result.account.tenantId),
      displayName: normalize(result.account.displayName),
      isEnabled: Boolean(result.account.isEnabled),
      scopeLevel: (result.account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT') as
        | 'SYSTEM'
        | 'TENANT'
    }
  }

  /** loadRoleSummaries reads compact role summaries and degrades to an empty list when role visibility is unavailable. */
  private async loadRoleSummaries(
    accountId: string,
    tenantId: string,
    source: DownstreamRequestSource
  ) {
    try {
      const result = await this.permissionService.listAccountRoles(
        {
          accountId,
          tenantId,
          scopeLevel: 'TENANT'
        },
        source
      )

      return (result.roles ?? []).map((role) => ({
        id: role.id ?? '',
        code: role.code ?? '',
        name: role.name ?? ''
      }))
    } catch {
      return []
    }
  }

  /** buildEmployeeAccessSummary maps cross-owner facts into the bounded member-context account-and-access block. */
  private buildEmployeeAccessSummary(input: {
    activeEmploymentId?: string
    latestProcess: HrOnboardingAccessProcessSummary | null
    account?: {
      accountId: string
      userId: string
      tenantId?: string
      displayName?: string
      isEnabled: boolean
      scopeLevel: 'SYSTEM' | 'TENANT'
    }
    loginMethods: Array<{
      methodId?: string
      type?: string
      maskedIdentifier?: string
      enabled?: boolean
      verified?: boolean
      hasPassword?: boolean
    }>
    passwordSetupRequired: boolean
    roles: Array<{ id: string; code: string; name: string }>
  }) {
    const onboardingStatus = normalize(input.latestProcess?.status)
    const status =
      onboardingStatus === 'ACCOUNT_BINDING_PENDING' || onboardingStatus === 'ACCESS_GRANT_PENDING'
        ? 'PENDING'
        : input.account
          ? 'ACTIVE'
          : onboardingStatus === 'COMPLETED'
            ? 'PENDING'
            : 'NOT_ENABLED'

    return {
      status,
      onboardingStatus,
      canContinue: status === 'PENDING',
      activeEmploymentId: input.activeEmploymentId,
      failureReason: normalize(input.latestProcess?.failureReason),
      account: input.account,
      loginMethods: input.loginMethods.map((method) => ({
        methodId: method.methodId ?? '',
        type: method.type ?? '',
        maskedIdentifier: normalize(method.maskedIdentifier),
        enabled: Boolean(method.enabled),
        verified: Boolean(method.verified),
        hasPassword: Boolean(method.hasPassword)
      })),
      passwordSetupRequired: input.passwordSetupRequired,
      roles: input.roles
    }
  }

  /** loadEmployeeDisplayNameMap hydrates employee display names from tenant-party truth without changing HR ownership. */
  private async loadEmployeeDisplayNameMap(
    tenantId: string,
    employees: HrEmployeeSummary[],
    source: DownstreamRequestSource
  ) {
    const uniqueTenantPartyIds = [
      ...new Set(employees.map((employee) => normalize(employee.tenantPartyId)).filter(Boolean))
    ]
    const entries = await Promise.all(
      uniqueTenantPartyIds.map(async (tenantPartyId) => {
        try {
          const tenantParty = await this.partyTenantQueryAdapter.getTenantPartyById(
            tenantId,
            tenantPartyId!,
            source
          )
          return tenantParty?.displayName
            ? ([tenantPartyId!, tenantParty.displayName] as const)
            : undefined
        } catch (error) {
          if (error instanceof NotFoundException) {
            return undefined
          }
          throw error
        }
      })
    )

    return new Map(entries.filter(Boolean) as Array<readonly [string, string]>)
  }

  /** loadOrgUnitMap reuses tenant-org read models to attach optional org summaries without changing HR ownership. */
  private async loadOrgUnitMap(
    tenantId: string,
    orgUnitIds: Array<string | undefined>,
    source: DownstreamRequestSource
  ) {
    const uniqueOrgUnitIds = [
      ...new Set(orgUnitIds.map((orgUnitId) => normalize(orgUnitId)).filter(Boolean))
    ]
    const entries = await Promise.all(
      uniqueOrgUnitIds.map(async (orgUnitId) => {
        try {
          const result = await this.orgManagementService.getOrgUnitDetailForInternalTenant(
            tenantId,
            orgUnitId!,
            source
          )
          return result.orgUnit?.id ? ([orgUnitId!, result.orgUnit] as const) : undefined
        } catch (error) {
          if (error instanceof NotFoundException) {
            return undefined
          }
          throw error
        }
      })
    )

    return new Map(
      entries.filter(Boolean) as Array<
        readonly [string, Awaited<ReturnType<OrgManagementService['getOrgUnitDetail']>>['orgUnit']]
      >
    )
  }

  /** attachOrgUnitSummary decorates one employment read model with an optional org summary projection. */
  private attachOrgUnitSummary<TEmployment extends { orgUnitId?: string }>(
    employment: TEmployment | undefined,
    orgUnitMap: Map<
      string,
      Awaited<ReturnType<OrgManagementService['getOrgUnitDetail']>>['orgUnit']
    >
  ) {
    if (!employment) {
      return employment
    }

    const orgUnitId = normalize(employment.orgUnitId)
    return {
      ...employment,
      orgUnit: orgUnitId ? orgUnitMap.get(orgUnitId) : undefined
    }
  }

  /** attachEmployeeDisplayName decorates one HR employee summary with an optional tenant-party display name. */
  private attachEmployeeDisplayName<TEmployee extends { tenantPartyId?: string }>(
    employee: TEmployee,
    employeeDisplayNameMap: Map<string, string>
  ) {
    const tenantPartyId = normalize(employee.tenantPartyId)
    return {
      ...employee,
      displayName: tenantPartyId ? employeeDisplayNameMap.get(tenantPartyId) : undefined
    }
  }

  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage employees in their current tenant'
      )
    }

    return operatorTenantId
  }

  private resolveOperatorId(source: DownstreamRequestSource): string {
    return requireNonBlank(
      source.user?.holderId ?? source.user?.aid ?? source.user?.id ?? source.user?.sub,
      'operatorId'
    )
  }

  /** restorePreviousOfficialPhotoState reverts HR photo truth to the pre-upload state after Asset binding fails. */
  private async restorePreviousOfficialPhotoState(
    input: {
      tenantId: string
      employeeId: string
      previousOfficialPhotoAssetId?: string
      previousOfficialPhotoUrl?: string
    },
    source: DownstreamRequestSource
  ): Promise<void> {
    try {
      if (input.previousOfficialPhotoAssetId && input.previousOfficialPhotoUrl) {
        await this.hrManagementAdapter.updateEmployeeOfficialPhoto(
          {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            officialPhotoAssetId: input.previousOfficialPhotoAssetId,
            officialPhotoUrl: input.previousOfficialPhotoUrl
          },
          source
        )
        return
      }

      await this.hrManagementAdapter.removeEmployeeOfficialPhoto(
        {
          tenantId: input.tenantId,
          employeeId: input.employeeId
        },
        source
      )
    } catch (error) {
      this.logger.warn(
        {
          tenantId: input.tenantId,
          employeeId: input.employeeId,
          previousOfficialPhotoAssetId: input.previousOfficialPhotoAssetId,
          error
        },
        'Failed to restore HR official photo state after asset bind failure'
      )
    }
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeUpper(value?: string): string | undefined {
  const normalized = normalize(value)
  return normalized ? normalized.toUpperCase() : undefined
}

function maskEmail(value?: string): string | undefined {
  const email = normalize(value)
  if (!email) return undefined
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  return `${name.slice(0, 2)}***@${domain}`
}

function maskPhone(value?: string): string | undefined {
  const phone = normalize(value)
  if (!phone) return undefined
  return phone.length > 6 ? `${phone.slice(0, 3)}***${phone.slice(-4)}` : phone
}

function isCompleteEmailLookupKeyword(keyword: string): boolean {
  return /^[^\s@]+@(?:[^\s@.]+\.)+[A-Za-z]{2,}$/.test(keyword.trim())
}

// buildPhoneLookupCandidates maps common phone input formats to canonical identity login phones.
function buildPhoneLookupCandidates(keyword: string, countryOrRegion?: string): string[] {
  const compact = keyword.trim().replace(/[\s().-]/g, '')
  const digits = compact.replace(/\D/g, '')
  if (!digits) return []

  const candidates: string[] = []
  const country = normalize(countryOrRegion)?.toUpperCase()
  if (compact.startsWith('+')) {
    const candidate = `+${digits}`
    if (isCanonicalLookupPhone(candidate)) candidates.push(candidate)
  } else if (compact.startsWith('00') && digits.length > 2) {
    const candidate = `+${digits.slice(2)}`
    if (isCanonicalLookupPhone(candidate)) candidates.push(candidate)
  } else {
    if ((country === 'US' || country === 'CA') && digits.length === 10) {
      candidates.push(`+1${digits}`)
    }
    if ((country === 'US' || country === 'CA') && digits.length === 11 && digits.startsWith('1')) {
      candidates.push(`+${digits}`)
    }
    if (country === 'CN' && digits.length === 11 && digits.startsWith('1')) {
      candidates.push(`+86${digits}`)
    }
    if (country === 'SG' && digits.length === 8) {
      candidates.push(`+65${digits}`)
    }
  }

  return [...new Set(candidates)]
}

function isCanonicalLookupPhone(phone: string): boolean {
  return /^\+[1-9]\d{5,19}$/.test(phone)
}

function toEmployeeUserCandidateResult(user: {
  id?: string
  username?: string
  personalEmail?: string
  personalPhone?: string
  isActive?: boolean
}) {
  if (!user?.id) return { items: [] }
  return {
    items: [
      {
        userId: user.id,
        displayName:
          normalize(user.username) ??
          normalize(user.personalEmail) ??
          normalize(user.personalPhone) ??
          user.id,
        maskedEmail: maskEmail(user.personalEmail),
        maskedPhone: maskPhone(user.personalPhone),
        isActive: user.isActive !== false
      }
    ]
  }
}

function normalizePersonIdentifiers(
  identifiers?: Array<{
    identifierType: string
    issuerCountryOrRegion?: string
    normalizedValue: string
    rawValue?: string
  }>
) {
  return (identifiers ?? []).map((identifier) => ({
    identifierType: requireNonBlank(identifier.identifierType, 'person.identifiers.identifierType'),
    issuerCountryOrRegion: normalize(identifier.issuerCountryOrRegion),
    normalizedValue: requireNonBlank(
      identifier.normalizedValue,
      'person.identifiers.normalizedValue'
    ),
    rawValue: normalize(identifier.rawValue)
  }))
}

function buildEmployeeOnboardingIdempotencyKey(
  tenantId: string,
  person: {
    identifiers?: Array<{
      identifierType: string
      issuerCountryOrRegion?: string
      normalizedValue: string
    }>
    legalName: string
  }
) {
  const identifier = person.identifiers?.[0]
  const stableKey = identifier
    ? [
        identifier.identifierType,
        identifier.issuerCountryOrRegion ?? '',
        identifier.normalizedValue
      ].join(':')
    : person.legalName

  return `hr:create-employee-person:${tenantId}:${stableKey}`
}

function requireNonBlank(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}
