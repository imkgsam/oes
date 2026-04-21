import type { TablePaginationConfig } from 'ant-design-vue';

export interface PolicyGovernancePaginationState {
  current: number;
  pageSize: number;
  total: number;
}

// Builds explicit pagination settings for the readonly policy governance table.
export function buildPolicyTablePagination(
  pagination: PolicyGovernancePaginationState,
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

// Maps policy effect facts into the stable label and visual intent used by the readonly page.
export function getPolicyEffectPresentation(effect: number | string) {
  const normalized = `${effect ?? ''}`.toUpperCase();

  if (normalized === '1' || normalized === 'ALLOW') {
    return {
      color: 'green',
      label: '允许',
    };
  }

  if (normalized === '2' || normalized === 'DENY') {
    return {
      color: 'red',
      label: '拒绝',
    };
  }

  return {
    color: 'default',
    label: normalized || '未知',
  };
}

// Maps policy subject-type facts into stable readonly labels.
export function getPolicySubjectTypeLabel(subjectType: number | string) {
  const normalized = `${subjectType ?? ''}`.toUpperCase();

  if (normalized === '1' || normalized === 'ROLE') {
    return '角色';
  }

  if (normalized === '2' || normalized === 'ACCOUNT') {
    return '账号';
  }

  if (normalized === '3' || normalized === 'ANY') {
    return '任意主体';
  }

  return normalized || '未知';
}

// Formats stored AST JSON into a readable code block without turning invalid payloads into empty strings.
export function formatPolicyConditionAst(conditionAstJson?: string) {
  const raw = `${conditionAstJson ?? ''}`.trim();

  if (!raw) {
    return '';
  }

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
