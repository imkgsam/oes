import { requestClient } from '#/api/request';

export namespace EmployeePerformanceApi {
  export type PerformancePeriod = 'LAST_7_DAYS' | 'LAST_30_DAYS';

  export interface EmployeePerformanceOverviewQuery {
    employeeAccountId?: string;
    period?: PerformancePeriod;
    sourceType?: string;
  }

  export interface EmployeePerformanceEmployee {
    accountId: string;
    displayName: string;
    newLeadCount: number;
  }

  export interface EmployeePerformanceMetric {
    key: string;
    label: string;
    unavailable: boolean;
    value: number | null;
  }

  export interface EmployeePerformanceSourceBreakdownItem {
    count: number;
    sourceType: string;
  }

  export interface EmployeePerformanceTrendRow {
    day: string;
    [sourceType: string]: number | string;
  }

  export interface EmployeePerformanceActivity {
    activityId: string;
    actorAccountId: string;
    actorDisplayName: string;
    crmAccountId: string;
    displayName: string;
    externalReference: string;
    happenedAt: string;
    sourceType: string;
  }

  export interface EmployeePerformanceUnavailableMetric {
    key: string;
    reason: string;
  }

  export interface EmployeePerformanceOverview {
    employees: EmployeePerformanceEmployee[];
    overview: EmployeePerformanceMetric[];
    period: PerformancePeriod;
    recentActivities: EmployeePerformanceActivity[];
    selectedEmployee: EmployeePerformanceEmployee;
    sourceBreakdown: EmployeePerformanceSourceBreakdownItem[];
    sourceType: string;
    trend: EmployeePerformanceTrendRow[];
    unavailableMetrics: EmployeePerformanceUnavailableMetric[];
  }
}

// Loads one tenant-scoped employee CRM performance console view from the API Gateway read facade.
export async function getEmployeePerformanceOverviewApi(
  params: EmployeePerformanceApi.EmployeePerformanceOverviewQuery,
) {
  return requestClient.get<EmployeePerformanceApi.EmployeePerformanceOverview>(
    '/admin/crm/performance/overview',
    {
      params,
    },
  );
}
