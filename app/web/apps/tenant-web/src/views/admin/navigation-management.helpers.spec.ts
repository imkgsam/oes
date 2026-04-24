import type { PermissionManagementApi } from '#/api';

import { describe, expect, it } from 'vitest';

import {
  buildNavigationPreviewEntryRows,
  buildNavigationTerminalList,
  buildRoleOptionLabel,
  buildRoleNavigationEditorModel,
  buildRoleNavigationSavePayload,
  inferNavigationPreviewScopeLevel,
} from './navigation-management.helpers';

const entries: PermissionManagementApi.NavigationEntry[] = [
  {
    description: 'A',
    enabled: true,
    entryKey: 'admin.high',
    entryType: 'page',
    featureKey: 'admin',
    name: '高优先级',
    registryPriority: 200,
    supportedTerminals: ['WEB'],
  },
  {
    description: 'B',
    enabled: true,
    entryKey: 'workbench.home',
    entryType: 'page',
    featureKey: 'workbench',
    name: '工作台',
    registryPriority: 100,
    supportedTerminals: ['WEB'],
  },
  {
    description: 'C',
    enabled: true,
    entryKey: 'mobile.home',
    entryType: 'page',
    featureKey: 'mobile',
    name: '移动首页',
    registryPriority: 80,
    supportedTerminals: ['WEB'],
  },
];

describe('navigation management helpers', () => {
  it('builds a priority-sorted role editor list and falls back to default config for web', () => {
    const result = buildRoleNavigationEditorModel({
      entries: [...entries],
      landingPolicies: [
        {
          defaultEntryKey: 'admin.high',
          enabled: true,
          priority: 100,
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
      terminal: 'WEB',
      visibility: [
        {
          enabled: true,
          entryKey: 'workbench.home',
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
        {
          enabled: true,
          entryKey: 'admin.high',
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
    });

    expect(result.entries.map((entry) => entry.entryKey)).toEqual([
      'admin.high',
      'workbench.home',
      'mobile.home',
    ]);
    expect(result.visibleEntryKeys).toEqual(['admin.high', 'workbench.home']);
    expect(result.landingEntryKey).toBe('admin.high');
  });

  it('preserves default config while writing a web-specific override payload', () => {
    const result = buildRoleNavigationSavePayload({
      entries: [...entries],
      landingEntryKey: 'workbench.home',
      landingPolicies: [
        {
          defaultEntryKey: 'admin.high',
          enabled: true,
          priority: 100,
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
      terminal: 'WEB',
      visibility: [
        {
          enabled: true,
          entryKey: 'admin.high',
          roleId: 'role-1',
          terminal: 'DEFAULT',
        },
      ],
      visibleEntryKeys: ['workbench.home'],
    });

    expect(result.valid).toBe(true);
    expect(result.visibility).toEqual([
      {
        enabled: true,
        entryKey: 'admin.high',
        terminal: 'DEFAULT',
      },
      {
        enabled: true,
        entryKey: 'workbench.home',
        terminal: 'WEB',
      },
    ]);
    expect(result.landingPolicies).toEqual([
      {
        defaultEntryKey: 'admin.high',
        enabled: true,
        priority: 100,
        terminal: 'DEFAULT',
      },
      {
        defaultEntryKey: 'workbench.home',
        enabled: true,
        priority: 100,
        terminal: 'WEB',
      },
    ]);
  });

  it('infers tenant preview scope from tenant roles without exposing manual scope selection', () => {
    const result = inferNavigationPreviewScopeLevel([
      {
        code: 'tenant.admin',
        description: '',
        id: 'role-1',
        isEnabled: true,
        isSystem: false,
        name: '租户管理员',
        roleKind: 'TENANT_INSTANCE',
        tenantId: 'tenant-1',
      } as any,
    ]);

    expect(result).toBe('TENANT');
  });

  it('adds tenant name to tenant-scoped role labels for preview selection', () => {
    expect(
      buildRoleOptionLabel({
        code: 'tenant.admin',
        id: 'role-1',
        isEnabled: true,
        isSystem: false,
        name: '租户管理员',
        roleKind: 'TENANT_INSTANCE',
        tenantId: 'tenant-1',
        tenantName: '华东事业部',
      } as any),
    ).toBe('租户管理员 · 华东事业部');

    expect(
      buildRoleOptionLabel({
        code: 'system.admin',
        id: 'role-2',
        isEnabled: true,
        isSystem: true,
        name: '系统管理员',
        roleKind: 'SYSTEM_INSTANCE',
      } as any),
    ).toBe('系统管理员 · 系统');
  });

  it('builds terminal options from the full entry registry while keeping web and mobile first', () => {
    expect(
      buildNavigationTerminalList([
        {
          description: 'A',
          enabled: true,
          supportedTerminals: ['DESKTOP', 'WEB'],
          entryKey: 'desktop.home',
          entryType: 'page',
          featureKey: 'desktop',
          name: '桌面首页',
          registryPriority: 100,
        },
        {
          description: 'B',
          enabled: true,
          supportedTerminals: ['POS'],
          entryKey: 'pos.home',
          entryType: 'page',
          featureKey: 'pos',
          name: '收银首页',
          registryPriority: 90,
        },
      ]),
    ).toEqual(['WEB', 'MOBILE', 'DESKTOP', 'POS']);
  });

  it('builds a priority-sorted preview entry list with default markers', () => {
    const result = buildNavigationPreviewEntryRows({
      entries: [
        {
          description: 'A',
          enabled: true,
          entryKey: 'workbench.home',
          entryType: 'page',
          featureKey: 'workbench',
          name: '工作台首页',
          registryPriority: 100,
          supportedTerminals: ['WEB'],
        },
        {
          description: 'B',
          enabled: true,
          entryKey: 'mes.work-order-board',
          entryType: 'page',
          featureKey: 'mes',
          name: '工单看板',
          registryPriority: 200,
          supportedTerminals: ['WEB', 'MOBILE'],
        },
      ],
      previewResult: {
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home', 'mes.work-order-board'],
      },
    });

    expect(result).toEqual([
      {
        entryKey: 'mes.work-order-board',
        isDefault: false,
        name: '工单看板',
        registryPriority: 200,
        supportedTerminals: ['WEB', 'MOBILE'],
      },
      {
        entryKey: 'workbench.home',
        isDefault: true,
        name: '工作台首页',
        registryPriority: 100,
        supportedTerminals: ['WEB'],
      },
    ]);
  });
});
