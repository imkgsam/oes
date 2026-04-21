import type { PermissionManagementApi } from '#/api';

import { describe, expect, it } from 'vitest';

import {
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
});
