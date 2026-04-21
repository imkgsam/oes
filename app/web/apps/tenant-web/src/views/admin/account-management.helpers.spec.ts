import { describe, expect, it } from 'vitest';

import {
  buildAccountRows,
  getAccountScopeLabel,
  getAccountStatusLabel,
  getRoleKindLabel,
  getSelectedRoleSummary,
} from './account-management.helpers';

describe('account management helpers', () => {
  it('builds stable account table rows from the directory payload', () => {
    expect(
      buildAccountRows([
        {
          accountDisplayName: 'Alpha Admin',
          accountId: 'account-1',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          userId: 'user-1',
        },
      ]),
    ).toEqual([
      {
        accountDisplayName: 'Alpha Admin',
        accountId: 'account-1',
        isEnabled: true,
        key: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: 'Alpha Tenant',
        userId: 'user-1',
      },
    ]);
  });

  it('maps account scope, account status, and role kind labels', () => {
    expect(getAccountScopeLabel('SYSTEM')).toBe('系统账号');
    expect(getAccountScopeLabel('TENANT')).toBe('租户账号');
    expect(getAccountStatusLabel(true)).toBe('启用');
    expect(getAccountStatusLabel(false)).toBe('停用');
    expect(getRoleKindLabel(1)).toBe('模板');
    expect(getRoleKindLabel(2)).toBe('租户角色');
    expect(getRoleKindLabel(3)).toBe('系统角色');
    expect(getRoleKindLabel('TENANT_INSTANCE')).toBe('租户角色');
  });

  it('summarizes selected role count', () => {
    expect(getSelectedRoleSummary(0, 5)).toBe('已选择 0 / 5 个角色');
    expect(getSelectedRoleSummary(2, 5)).toBe('已选择 2 / 5 个角色');
  });
});
