import { describe, expect, it } from 'vitest';

import {
  buildActiveRoleTemplateSelectOptions,
  buildLandingPoliciesFromEditor,
  buildRoleTablePagination,
  buildVisibilityPayloadFromEditor,
  deriveLandingEditorState,
  deriveVisibilityEditorState,
  getRoleKindLabel,
  getRoleScopeLabel,
  groupNavigationEntriesByFeature,
  isRoleCodeFormatValid,
  validateNavigationEditorState,
} from './role-management.helpers';

describe('role management helpers', () => {
  it('builds explicit admin pagination settings', () => {
    const pagination = buildRoleTablePagination({
      current: 2,
      pageSize: 50,
      total: 120,
    });

    expect(pagination.current).toBe(2);
    expect(pagination.pageSize).toBe(50);
    expect(pagination.showQuickJumper).toBe(true);
    expect(pagination.showSizeChanger).toBe(true);
  });

  it('maps role facts to scope and kind labels', () => {
    expect(
      getRoleScopeLabel({
        code: 'SYSTEM_ADMIN',
        id: 'role-1',
        isEnabled: true,
        isSystem: true,
        name: 'System Admin',
        roleKind: 'SYSTEM_INSTANCE',
      }),
    ).toBe('SYSTEM');
    expect(
      getRoleKindLabel({
        code: 'TENANT_AUDITOR',
        id: 'role-2',
        isEnabled: true,
        isSystem: false,
        name: 'Tenant Auditor',
        roleKind: 'TENANT_INSTANCE',
      }),
    ).toBe('租户角色');
    expect(
      getRoleKindLabel({
        code: 'TENANT_AUDITOR_TEMPLATE',
        id: 'role-3',
        isEnabled: true,
        isSystem: false,
        name: 'Tenant Auditor Template',
        roleKind: 'SYSTEM_TEMPLATE',
      }),
    ).toBe('模板');
    expect(
      getRoleKindLabel({
        code: 'TENANT_AUDITOR_TEMPLATE',
        id: 'role-4',
        isEnabled: true,
        isSystem: false,
        name: 'Tenant Auditor Template',
        roleKind: 1 as any,
      }),
    ).toBe('模板');
    expect(
      getRoleKindLabel({
        code: 'TENANT_AUDITOR',
        id: 'role-5',
        isEnabled: true,
        isSystem: false,
        name: 'Tenant Auditor',
        roleKind: 2 as any,
      }),
    ).toBe('租户角色');
  });

  it('builds template selector options from enabled templates only', () => {
    expect(
      buildActiveRoleTemplateSelectOptions([
        {
          code: 'tenant.admin',
          id: 'template-active',
          isEnabled: true,
          isSystem: true,
          name: '租户管理员',
          roleKind: 'SYSTEM_TEMPLATE',
        },
        {
          code: 'tenant.disabled',
          id: 'template-disabled',
          isEnabled: false,
          isSystem: true,
          name: '停用模板',
          roleKind: 'SYSTEM_TEMPLATE',
        },
      ]),
    ).toEqual([
      {
        label: '租户管理员',
        value: 'template-active',
      },
    ]);
  });

  it('accepts the stable role code formats already used across role seeds and commands', () => {
    expect(isRoleCodeFormatValid('TENANT_ADMIN')).toBe(true);
    expect(isRoleCodeFormatValid('tenant.admin')).toBe(true);
    expect(isRoleCodeFormatValid('foreign-trade.manager')).toBe(true);
    expect(isRoleCodeFormatValid('tenant_admin')).toBe(true);
    expect(isRoleCodeFormatValid('1TENANT_ADMIN')).toBe(false);
    expect(isRoleCodeFormatValid('tenant admin')).toBe(false);
    expect(isRoleCodeFormatValid('TENANT/ADMIN')).toBe(false);
  });

  it('derives one base landing with terminal overrides from managed landing policies', () => {
    expect(
      deriveLandingEditorState({
        landingPolicies: [
          {
            defaultEntryKey: 'finance.dashboard',
            enabled: true,
            priority: 100,
            roleId: 'role-1',
            terminal: 'DEFAULT',
          },
          {
            defaultEntryKey: 'mobile.todo',
            enabled: true,
            priority: 100,
            roleId: 'role-1',
            terminal: 'MOBILE',
          },
        ],
        supportedTerminals: ['WEB', 'MOBILE'],
      }),
    ).toEqual({
      baseEntryKey: 'finance.dashboard',
      overrides: [
        {
          defaultEntryKey: 'mobile.todo',
          terminal: 'MOBILE',
        },
      ],
    });
  });

  it('builds full landing policy payload from one base landing and terminal overrides', () => {
    expect(
      buildLandingPoliciesFromEditor({
        baseEntryKey: 'finance.dashboard',
        overrides: [
          {
            defaultEntryKey: 'mobile.todo',
            terminal: 'MOBILE',
          },
        ],
        supportedTerminals: ['WEB', 'MOBILE'],
      }),
    ).toEqual([
      {
        defaultEntryKey: 'finance.dashboard',
        enabled: true,
        priority: 100,
        terminal: 'DEFAULT',
      },
      {
        defaultEntryKey: 'mobile.todo',
        enabled: true,
        priority: 100,
        terminal: 'MOBILE',
      },
    ]);
  });

  it('uses the WEB selection as the default visibility base and keeps terminal overrides separate', () => {
    expect(
      deriveVisibilityEditorState({
        supportedTerminals: ['WEB', 'MOBILE'],
        visibility: [
          {
            enabled: true,
            entryKey: 'finance.dashboard',
            roleId: 'role-1',
            terminal: 'DEFAULT',
          },
          {
            enabled: true,
            entryKey: 'shared.notice',
            roleId: 'role-1',
            terminal: 'DEFAULT',
          },
          {
            enabled: true,
            entryKey: 'mobile.todo',
            roleId: 'role-1',
            terminal: 'MOBILE',
          },
          {
            enabled: true,
            entryKey: 'shared.notice',
            roleId: 'role-1',
            terminal: 'MOBILE',
          },
        ],
      }),
    ).toEqual({
      baseEntryKeys: ['finance.dashboard', 'shared.notice'],
      overrides: [
        {
          entryKeys: ['mobile.todo', 'shared.notice'],
          terminal: 'MOBILE',
        },
      ],
    });
  });

  it('builds full visibility payload from one base selection and terminal overrides', () => {
    expect(
      buildVisibilityPayloadFromEditor({
        entries: [
          {
            enabled: true,
            entryKey: 'finance.dashboard',
            entryType: 'page',
            featureKey: 'finance',
            name: '财务驾驶舱',
            registryPriority: 100,
            supportedTerminals: ['WEB'],
          },
          {
            enabled: true,
            entryKey: 'shared.notice',
            entryType: 'page',
            featureKey: 'shared',
            name: '公告中心',
            registryPriority: 90,
            supportedTerminals: ['WEB', 'MOBILE'],
          },
          {
            enabled: true,
            entryKey: 'mobile.todo',
            entryType: 'page',
            featureKey: 'mobile',
            name: '移动待办',
            registryPriority: 80,
            supportedTerminals: ['MOBILE'],
          },
        ],
        baseEntryKeys: ['finance.dashboard', 'shared.notice'],
        overrides: [
          {
            entryKeys: ['mobile.todo', 'shared.notice'],
            terminal: 'MOBILE',
          },
        ],
        supportedTerminals: ['WEB', 'MOBILE'],
      }),
    ).toEqual([
      {
        enabled: true,
        entryKey: 'finance.dashboard',
        terminal: 'DEFAULT',
      },
      {
        enabled: true,
        entryKey: 'shared.notice',
        terminal: 'DEFAULT',
      },
      {
        enabled: true,
        entryKey: 'mobile.todo',
        terminal: 'MOBILE',
      },
      {
        enabled: true,
        entryKey: 'shared.notice',
        terminal: 'MOBILE',
      },
    ]);
  });

  it('groups navigation entries by feature and keeps each group sorted by registry priority', () => {
    expect(
      groupNavigationEntriesByFeature([
        {
          enabled: true,
          entryKey: 'finance.report',
          entryType: 'page',
          featureKey: 'finance',
          name: '财务报表',
          registryPriority: 80,
          supportedTerminals: ['WEB'],
        },
        {
          enabled: true,
          entryKey: 'shared.notice',
          entryType: 'page',
          featureKey: 'shared',
          name: '公告中心',
          registryPriority: 60,
          supportedTerminals: ['WEB', 'MOBILE'],
        },
        {
          enabled: true,
          entryKey: 'finance.dashboard',
          entryType: 'page',
          featureKey: 'finance',
          name: '财务驾驶舱',
          registryPriority: 100,
          supportedTerminals: ['WEB'],
        },
      ]),
    ).toEqual([
      {
        entries: ['finance.dashboard', 'finance.report'],
        featureKey: 'finance',
        label: 'finance',
      },
      {
        entries: ['shared.notice'],
        featureKey: 'shared',
        label: 'shared',
      },
    ]);
  });

  it('rejects saving when the default landing is missing for visible default entries', () => {
    expect(
      validateNavigationEditorState({
        baseEntryKeys: ['finance.dashboard'],
        baseLandingEntryKey: '',
        entries: [
          {
            enabled: true,
            entryKey: 'finance.dashboard',
            entryType: 'page',
            featureKey: 'finance',
            name: '财务驾驶舱',
            registryPriority: 100,
            supportedTerminals: ['WEB'],
          },
        ],
        landingOverrides: [],
        supportedTerminals: ['WEB'],
        visibilityOverrides: [],
      }),
    ).toEqual({
      message: '请为默认配置选择默认进入',
      valid: false,
    });
  });

  it('rejects saving when a terminal landing is not part of the visible entries', () => {
    expect(
      validateNavigationEditorState({
        baseEntryKeys: ['shared.notice'],
        baseLandingEntryKey: 'shared.notice',
        entries: [
          {
            enabled: true,
            entryKey: 'shared.notice',
            entryType: 'page',
            featureKey: 'shared',
            name: '公告中心',
            registryPriority: 90,
            supportedTerminals: ['WEB', 'MOBILE'],
          },
          {
            enabled: true,
            entryKey: 'mobile.todo',
            entryType: 'page',
            featureKey: 'mobile',
            name: '移动待办',
            registryPriority: 80,
            supportedTerminals: ['MOBILE'],
          },
        ],
        landingOverrides: [
          {
            defaultEntryKey: 'mobile.todo',
            terminal: 'MOBILE',
          },
        ],
        supportedTerminals: ['WEB', 'MOBILE'],
        visibilityOverrides: [],
      }),
    ).toEqual({
      message: 'MOBILE 的默认进入必须属于当前前端可见入口',
      valid: false,
    });
  });

  it('accepts a complete navigation editor state for default and terminal overrides', () => {
    expect(
      validateNavigationEditorState({
        baseEntryKeys: ['shared.notice'],
        baseLandingEntryKey: 'shared.notice',
        entries: [
          {
            enabled: true,
            entryKey: 'shared.notice',
            entryType: 'page',
            featureKey: 'shared',
            name: '公告中心',
            registryPriority: 90,
            supportedTerminals: ['WEB', 'MOBILE'],
          },
          {
            enabled: true,
            entryKey: 'mobile.todo',
            entryType: 'page',
            featureKey: 'mobile',
            name: '移动待办',
            registryPriority: 80,
            supportedTerminals: ['MOBILE'],
          },
        ],
        landingOverrides: [
          {
            defaultEntryKey: 'mobile.todo',
            terminal: 'MOBILE',
          },
        ],
        supportedTerminals: ['WEB', 'MOBILE'],
        visibilityOverrides: [
          {
            entryKeys: ['shared.notice', 'mobile.todo'],
            terminal: 'MOBILE',
          },
        ],
      }),
    ).toEqual({
      message: '',
      valid: true,
    });
  });
});
