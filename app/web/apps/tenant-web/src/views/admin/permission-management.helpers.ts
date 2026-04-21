import type { TablePaginationConfig } from 'ant-design-vue';
import type { PermissionManagementApi } from '#/api';

export interface PermissionManagementPaginationState {
  current: number;
  pageSize: number;
  total: number;
}

export interface PermissionModuleOption {
  label: string;
  value: string;
}

export interface PermissionModulePageResult {
  page: number;
  pageSize: number;
  permissions: PermissionManagementApi.Permission[];
  total: number;
}

export type PermissionCodeSortOrder = 'ascend' | 'descend' | null;

const PERMISSION_MODULE_OPTIONS_PAGE_SIZE = 100;

// Merges existing module options with the current draft value so create/edit forms stay selection-based.
export function buildPermissionModuleSelectOptions(
  options: PermissionModuleOption[],
  draftModule = '',
): PermissionModuleOption[] {
  const optionMap = new Map(
    options.map((option) => [option.value.trim(), option] as const).filter(([value]) => value),
  );

  const normalizedDraftModule = draftModule.trim();

  if (normalizedDraftModule) {
    optionMap.set(normalizedDraftModule, {
      label: normalizedDraftModule,
      value: normalizedDraftModule,
    });
  }

  return [...optionMap.values()].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

// Builds stable module select options from the visible permission catalog and active filter.
export function buildPermissionModuleOptions(
  permissions: PermissionManagementApi.Permission[],
  selectedModule = '',
): PermissionModuleOption[] {
  const modules = new Set<string>();

  for (const permission of permissions) {
    const moduleName = permission.module?.trim();

    if (moduleName) {
      modules.add(moduleName);
    }
  }

  const activeModule = selectedModule.trim();

  if (activeModule) {
    modules.add(activeModule);
  }

  return [...modules]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({
      label: value,
      value,
    }));
}

// Collects module options by reading paged permission data without violating downstream page-size limits.
export async function collectPermissionModuleOptions(
  loadPage: (params: {
    page: number;
    pageSize: number;
  }) => Promise<PermissionModulePageResult>,
  selectedModule = '',
) {
  const permissions: PermissionManagementApi.Permission[] = [];
  let page = 1;

  while (true) {
    const result = await loadPage({
      page,
      pageSize: PERMISSION_MODULE_OPTIONS_PAGE_SIZE,
    });

    permissions.push(...(result.permissions ?? []));

    const currentPage = result.page || page;
    const currentPageSize = result.pageSize || PERMISSION_MODULE_OPTIONS_PAGE_SIZE;
    const reachedLastPage =
      currentPage * currentPageSize >= (result.total ?? permissions.length) ||
      (result.permissions?.length ?? 0) < currentPageSize;

    if (reachedLastPage) {
      break;
    }

    page = currentPage + 1;
  }

  return buildPermissionModuleOptions(permissions, selectedModule);
}

// Keeps permission tables on an explicit paged interaction model for administrators.
export function buildPermissionTablePagination(
  pagination: PermissionManagementPaginationState,
): TablePaginationConfig {
  return {
    current: pagination.current,
    hideOnSinglePage: false,
    pageSize: pagination.pageSize,
    pageSizeOptions: ['20', '50', '100'],
    position: ['bottomRight'],
    showQuickJumper: true,
    showSizeChanger: true,
    showTotal: (total: number) => `共 ${total} 条`,
    total: pagination.total,
  };
}

// Sorts one loaded permission page by stable permission code order for front-end table interactions.
export function sortPermissionsByCode(
  permissions: PermissionManagementApi.Permission[],
  order: PermissionCodeSortOrder,
): PermissionManagementApi.Permission[] {
  if (!order) {
    return [...permissions];
  }

  const direction = order === 'ascend' ? 1 : -1;

  return [...permissions].sort((left, right) => {
    const codeCompare = left.code.localeCompare(right.code) * direction;

    if (codeCompare !== 0) {
      return codeCompare;
    }

    return left.id.localeCompare(right.id) * direction;
  });
}
