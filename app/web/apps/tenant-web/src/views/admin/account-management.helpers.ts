import type { AdminSecurityApi } from '#/api';

export type AccountScopeFilter = '' | 'SYSTEM' | 'TENANT';
export type AccountStatusFilter = '' | 'DISABLED' | 'ENABLED';

export interface AccountManagementRow
  extends AdminSecurityApi.AccountDirectoryItem {
  key: string;
}

export interface AccountManagementGroup {
  key: string;
  userId: string;
  userDisplayName?: string;
  accountCount: number;
  tenantNames: string[];
  accounts: AccountManagementRow[];
}

// Builds stable table rows from the account directory response payload.
export function buildAccountRows(
  accounts: AdminSecurityApi.AccountDirectoryItem[],
): AccountManagementRow[] {
  return accounts.map((account) => ({
    ...account,
    key: account.accountId,
  }));
}

// Groups flat account rows by user so the admin directory can present one identity with multiple account contexts.
export function buildAccountGroups(rows: AccountManagementRow[]): AccountManagementGroup[] {
  const groups = new Map<string, AccountManagementGroup>();

  for (const row of rows) {
    const groupKey = row.userId || row.accountId;
    const group = groups.get(groupKey);

    if (group) {
      group.accounts.push(row);
      if (row.tenantName && !group.tenantNames.includes(row.tenantName)) {
        group.tenantNames.push(row.tenantName);
      }
      continue;
    }

    groups.set(groupKey, {
      key: groupKey,
      userId: row.userId,
      userDisplayName: row.userDisplayName,
      accountCount: 1,
      tenantNames: row.tenantName ? [row.tenantName] : [],
      accounts: [row],
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    accountCount: group.accounts.length,
  }));
}

// Converts account scope into a user-facing label for account management tables.
export function getAccountScopeLabel(scopeLevel: 'SYSTEM' | 'TENANT') {
  return scopeLevel === 'SYSTEM' ? '系统账号' : '租户账号';
}

// Converts account enabled state into a user-facing label for account management tables.
export function getAccountStatusLabel(isEnabled: boolean) {
  return isEnabled ? '启用' : '停用';
}

// Converts role kind values into the labels used by the account role drawer.
export function getRoleKindLabel(roleKind?: number | string) {
  switch (roleKind as unknown) {
    case 1:
    case 'ROLE_KIND_PROTO_SYSTEM_TEMPLATE':
    case 'SYSTEM_TEMPLATE': {
      return '模板';
    }
    case 2:
    case 'ROLE_KIND_PROTO_TENANT_INSTANCE':
    case 'TENANT_INSTANCE': {
      return '租户角色';
    }
    case 3:
    case 'ROLE_KIND_PROTO_SYSTEM_INSTANCE':
    case 'SYSTEM_INSTANCE': {
      return '系统角色';
    }
    default: {
      return '-';
    }
  }
}

// Summarizes how many roles are currently selected in the account role editor.
export function getSelectedRoleSummary(selectedCount: number, totalCount: number) {
  return `已选择 ${selectedCount} / ${totalCount} 个角色`;
}
