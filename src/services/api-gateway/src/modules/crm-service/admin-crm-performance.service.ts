import { ForbiddenException, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { CustomerManagementService } from './customer-management.service'

type PerformancePeriod = 'LAST_7_DAYS' | 'LAST_30_DAYS'

interface PerformanceQuery {
  employeeAccountId?: string
  period?: PerformancePeriod | string
  sourceType?: string
}

interface CrmAccountView {
  createdAt?: string
  createdBy?: string
  createdByDisplayName?: string
  crmAccountId?: string
  displayName?: string
  lifecycleStage?: string
  ownerAccountId?: string
  ownerDisplayName?: string
  recordStatus?: string
}

interface CrmSourceRecordView {
  capturedAt?: string
  capturedByAccountId?: string
  capturedByDisplayName?: string
  crmAccountId?: string
  externalReference?: string
  sourceRecordId?: string
  sourceType?: string
}

// Builds a read-only admin performance console view from existing CRM account and source facts.
@Injectable()
export class AdminCrmPerformanceService {
  constructor(private readonly customerManagementService: CustomerManagementService) {}

  /** getOverview returns one tenant-scoped employee performance view without owning CRM truth. */
  async getOverview(query: PerformanceQuery, source: DownstreamRequestSource) {
    const tenantId = resolveTenantId(source)
    const period = normalizePeriod(query.period)
    const accountPage = await this.customerManagementService.listCrmAccounts(
      tenantId,
      { page: 1, pageSize: 100 },
      source
    )
    const accounts = (accountPage.crmAccounts ?? []) as CrmAccountView[]
    const sourceRecords = await this.listSourceRecordsForAccounts(tenantId, accounts, source)
    const employees = buildEmployees(accounts)
    const selectedEmployee = resolveSelectedEmployee(query.employeeAccountId, source, employees)
    const periodStart = resolvePeriodStart(period)
    const selectedAccounts = accounts.filter((account) =>
      belongsToEmployee(account, selectedEmployee.accountId)
    )
    const selectedSourceRecords = sourceRecords
      .filter((record) => belongsToEmployeeSource(record, selectedEmployee.accountId, selectedAccounts))
      .filter((record) => isInPeriod(record.capturedAt, periodStart))
      .filter((record) => !query.sourceType || record.sourceType === query.sourceType)

    return {
      period,
      sourceType: query.sourceType || 'ALL',
      employees,
      selectedEmployee,
      overview: buildOverview(selectedAccounts, selectedSourceRecords, periodStart),
      sourceBreakdown: buildSourceBreakdown(selectedSourceRecords),
      trend: buildTrend(selectedSourceRecords),
      recentActivities: buildRecentActivities(selectedSourceRecords, selectedAccounts),
      unavailableMetrics: [
        {
          key: 'duplicateBlocks',
          reason: 'CRM duplicate-block audit aggregation is not exposed by the current read contract.'
        },
        {
          key: 'followUpCompletionRate',
          reason: 'CRM activity completion facts are not exposed by the current read contract.'
        }
      ]
    }
  }

  private async listSourceRecordsForAccounts(
    tenantId: string,
    accounts: CrmAccountView[],
    source: DownstreamRequestSource
  ): Promise<CrmSourceRecordView[]> {
    const nested = await Promise.all(
      accounts
        .filter((account) => normalize(account.crmAccountId))
        .map(async (account) => {
          const result = await this.customerManagementService.listSourceRecords(
            tenantId,
            account.crmAccountId!,
            source
          )
          return (result.sourceRecords ?? []) as CrmSourceRecordView[]
        })
    )

    return nested.flat()
  }
}

function resolveTenantId(source: DownstreamRequestSource): string {
  const tenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)
  if (!tenantId) {
    throw new ForbiddenException('admin CRM performance overview requires tenant context')
  }
  return tenantId
}

function normalizePeriod(value: string | undefined): PerformancePeriod {
  return value === 'LAST_30_DAYS' ? 'LAST_30_DAYS' : 'LAST_7_DAYS'
}

function resolvePeriodStart(period: PerformancePeriod): Date {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - (period === 'LAST_30_DAYS' ? 29 : 6))
  return date
}

function buildEmployees(accounts: CrmAccountView[]) {
  const employees = new Map<string, { accountId: string; displayName: string; newLeadCount: number }>()

  for (const account of accounts) {
    addEmployee(employees, account.ownerAccountId, account.ownerDisplayName)
    addEmployee(employees, account.createdBy, account.createdByDisplayName)
  }

  for (const account of accounts) {
    if (account.lifecycleStage !== 'LEAD') {
      continue
    }
    const leadEmployeeIds = new Set([normalize(account.ownerAccountId), normalize(account.createdBy)])
    for (const accountId of leadEmployeeIds) {
      if (accountId && employees.has(accountId)) {
        employees.get(accountId)!.newLeadCount += 1
      }
    }
  }

  return [...employees.values()].sort((left, right) => left.displayName.localeCompare(right.displayName))
}

function addEmployee(
  employees: Map<string, { accountId: string; displayName: string; newLeadCount: number }>,
  accountId: string | undefined,
  displayName: string | undefined
): void {
  const normalizedAccountId = normalize(accountId)
  if (!normalizedAccountId || employees.has(normalizedAccountId)) {
    return
  }
  employees.set(normalizedAccountId, {
    accountId: normalizedAccountId,
    displayName: normalize(displayName) ?? normalizedAccountId,
    newLeadCount: 0
  })
}

function resolveSelectedEmployee(
  requestedAccountId: string | undefined,
  source: DownstreamRequestSource,
  employees: Array<{ accountId: string; displayName: string; newLeadCount: number }>
) {
  const requested = normalize(requestedAccountId)
  if (requested) {
    return employees.find((employee) => employee.accountId === requested) ?? {
      accountId: requested,
      displayName: requested,
      newLeadCount: 0
    }
  }

  const currentAccountId = normalize(source.user?.aid) ?? normalize(source.user?.id)
  if (currentAccountId) {
    return employees.find((employee) => employee.accountId === currentAccountId) ?? {
      accountId: currentAccountId,
      displayName: currentAccountId,
      newLeadCount: 0
    }
  }

  return employees[0] ?? { accountId: '', displayName: '', newLeadCount: 0 }
}

function belongsToEmployee(account: CrmAccountView, accountId: string): boolean {
  return account.ownerAccountId === accountId || account.createdBy === accountId
}

function belongsToEmployeeSource(
  record: CrmSourceRecordView,
  accountId: string,
  selectedAccounts: CrmAccountView[]
): boolean {
  return record.capturedByAccountId === accountId ||
    selectedAccounts.some((account) => account.crmAccountId === record.crmAccountId)
}

function buildOverview(
  selectedAccounts: CrmAccountView[],
  selectedSourceRecords: CrmSourceRecordView[],
  periodStart: Date
) {
  const periodAccounts = selectedAccounts.filter((account) => isInPeriod(account.createdAt, periodStart))
  return [
    {
      key: 'newLeads',
      label: '新增 Lead',
      value: periodAccounts.filter((account) => account.lifecycleStage === 'LEAD').length,
      unavailable: false
    },
    {
      key: 'browserExtensionRecognitions',
      label: '插件识别',
      value: selectedSourceRecords.filter((record) => record.sourceType === 'BROWSER_EXTENSION').length,
      unavailable: false
    },
    {
      key: 'duplicateBlocks',
      label: '重复阻止',
      value: null,
      unavailable: true
    },
    {
      key: 'followUpCompletionRate',
      label: '有效跟进率',
      value: null,
      unavailable: true
    }
  ]
}

function buildSourceBreakdown(records: CrmSourceRecordView[]) {
  const counts = new Map<string, number>()
  for (const record of records) {
    const sourceType = normalize(record.sourceType) ?? 'OTHER'
    counts.set(sourceType, (counts.get(sourceType) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([sourceType, count]) => ({ sourceType, count }))
}

function buildTrend(records: CrmSourceRecordView[]) {
  const rows = new Map<string, Record<string, number | string>>()
  for (const record of records) {
    const day = normalize(record.capturedAt)?.slice(0, 10) ?? 'unknown'
    const sourceType = normalize(record.sourceType) ?? 'OTHER'
    const row = rows.get(day) ?? { day }
    row[sourceType] = Number(row[sourceType] ?? 0) + 1
    rows.set(day, row)
  }
  return [...rows.values()].sort((left, right) => String(left.day).localeCompare(String(right.day)))
}

function buildRecentActivities(records: CrmSourceRecordView[], accounts: CrmAccountView[]) {
  return records
    .slice()
    .sort((left, right) => String(right.capturedAt).localeCompare(String(left.capturedAt)))
    .slice(0, 8)
    .map((record) => {
      const account = accounts.find((item) => item.crmAccountId === record.crmAccountId)
      return {
        activityId: record.sourceRecordId ?? `${record.crmAccountId}:${record.capturedAt}`,
        happenedAt: record.capturedAt ?? '',
        sourceType: record.sourceType ?? 'OTHER',
        actorAccountId: record.capturedByAccountId ?? '',
        actorDisplayName: record.capturedByDisplayName ?? '',
        crmAccountId: record.crmAccountId ?? '',
        displayName: account?.displayName ?? record.externalReference ?? '',
        externalReference: record.externalReference ?? ''
      }
    })
}

function isInPeriod(value: string | undefined, periodStart: Date): boolean {
  const date = new Date(value ?? '')
  return Number.isNaN(date.getTime()) ? true : date >= periodStart
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}
