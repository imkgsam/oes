import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PermissionProxyService } from '../permission-service/permission-service.service'
import { OrgManagementService } from '../tenant-org-service/org-management.service'
import { HrManagementGrpcAdapter } from './adapters/hr-management-grpc.adapter'
import {
  HrEmployeeSummary,
  HrOnboardingAccessProcessSummary,
  HrQueryGrpcAdapter
} from './adapters/hr-query-grpc.adapter'

@Injectable()
// Builds the tenant-scoped employee and employment management model for the gateway HR entry.
export class HrManagementService {
  constructor(
    private readonly hrQueryAdapter: HrQueryGrpcAdapter,
    private readonly hrManagementAdapter: HrManagementGrpcAdapter,
    private readonly identityQueryAdapter: IdentityQueryGrpcAdapter,
    private readonly authAdapter: AuthGrpcAdapter,
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
    const orgUnitMap = await this.loadOrgUnitMap(
      resolvedTenantId,
      items.map((item) => item.activeEmployment?.orgUnitId),
      source
    )

    return {
      items: items.map((item) => ({
        ...item,
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
    const orgUnitMap = await this.loadOrgUnitMap(
      resolvedTenantId,
      [activeEmployment?.orgUnitId, ...employments.map((employment) => employment.orgUnitId)],
      source
    )

    return {
      employee,
      activeEmployment: this.attachOrgUnitSummary(activeEmployment, orgUnitMap),
      employments: employments.map((employment) => this.attachOrgUnitSummary(employment, orgUnitMap))
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
    const account = accountId
      ? await this.loadAccountSummary(accountId, source)
      : undefined
    const loginMethodResult =
      account?.userId
        ? await this.authAdapter.listLoginMethods(account.userId, source)
        : { loginMethods: [], passwordSetupRequired: false }
    const roles = accountId
      ? await this.loadRoleSummaries(accountId, resolvedTenantId, source)
      : []

    return this.buildEmployeeAccessSummary({
      activeEmploymentId: activeEmployment?.id,
      latestProcess,
      account,
      loginMethods: loginMethodResult.loginMethods ?? [],
      passwordSetupRequired: Boolean(loginMethodResult.passwordSetupRequired),
      roles
    })
  }

  async createEmployee(
    tenantId: string,
    input: { tenantPartyId: string; partyId?: string; employeeCode: string },
    source: DownstreamRequestSource
  ) {
    return this.hrManagementAdapter.createEmployee(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        tenantPartyId: requireNonBlank(input.tenantPartyId, 'tenantPartyId'),
        partyId: normalize(input.partyId),
        employeeCode: requireNonBlank(input.employeeCode, 'employeeCode')
      },
      source
    )
  }

  async createEmployment(
    tenantId: string,
    employeeId: string,
    input: { orgUnitId: string; effectiveFrom: string },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    await this.assertEmployeeInTenant(resolvedTenantId, employeeId, source)

    return this.hrManagementAdapter.createEmployment(
      {
        tenantId: resolvedTenantId,
        employeeId,
        orgUnitId: requireNonBlank(input.orgUnitId, 'orgUnitId'),
        effectiveFrom: requireNonBlank(input.effectiveFrom, 'effectiveFrom')
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
        endedReason: normalize(input.endedReason)
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
      }
    },
    source: DownstreamRequestSource
  ) {
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    await this.assertEmployeeInTenant(resolvedTenantId, employeeId, source)

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
              phone: normalize(input.createAccount.phone)
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
    const employee = await this.hrQueryAdapter.getEmployeeById(requireNonBlank(employeeId, 'employeeId'), source)
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
    const employment = employments.find((item) => item.id === requireNonBlank(employmentId, 'employmentId'))
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

  /** loadOrgUnitMap reuses tenant-org read models to attach optional org summaries without changing HR ownership. */
  private async loadOrgUnitMap(
    tenantId: string,
    orgUnitIds: Array<string | undefined>,
    source: DownstreamRequestSource
  ) {
    const uniqueOrgUnitIds = [...new Set(orgUnitIds.map((orgUnitId) => normalize(orgUnitId)).filter(Boolean))]
    const entries = await Promise.all(
      uniqueOrgUnitIds.map(async (orgUnitId) => {
        try {
          const result = await this.orgManagementService.getOrgUnitDetail(tenantId, orgUnitId!, source)
          return result.orgUnit?.id ? ([orgUnitId!, result.orgUnit] as const) : undefined
        } catch (error) {
          if (error instanceof NotFoundException) {
            return undefined
          }
          throw error
        }
      })
    )

    return new Map(entries.filter(Boolean) as Array<readonly [string, Awaited<ReturnType<OrgManagementService['getOrgUnitDetail']>>['orgUnit']]>)
  }

  /** attachOrgUnitSummary decorates one employment read model with an optional org summary projection. */
  private attachOrgUnitSummary<TEmployment extends { orgUnitId?: string }>(
    employment: TEmployment | undefined,
    orgUnitMap: Map<string, Awaited<ReturnType<OrgManagementService['getOrgUnitDetail']>>['orgUnit']>
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

  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException('Tenant administrators can only manage employees in their current tenant')
    }

    return operatorTenantId
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

function requireNonBlank(value: string, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new NotFoundException(`${fieldName} is required`)
  }
  return normalized
}
