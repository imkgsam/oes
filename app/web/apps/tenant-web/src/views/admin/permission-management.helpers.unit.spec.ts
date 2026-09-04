import { describe, expect, it } from 'vitest';

import {
  buildPermissionModuleOptions,
  buildPermissionModuleSelectOptions,
  buildPermissionTablePagination,
  collectPermissionModuleOptions,
  sortPermissionsByCode,
} from './permission-management.helpers';

// Verifies permission-management UI helpers keep module filters and pagination behavior stable.
describe('permission-management helpers', () => {
  it('builds unique sorted module options and preserves the current filter value', () => {
    const options = buildPermissionModuleOptions(
      [
        {
          code: 'permission.list',
          id: 'permission-1',
          module: 'PERMISSION_SERVICE',
        },
        {
          code: 'permission.create',
          id: 'permission-2',
          module: 'AUTH_SERVICE',
        },
        {
          code: 'permission.update',
          id: 'permission-3',
          module: 'PERMISSION_SERVICE',
        },
      ],
      'TENANT_ADMIN',
    );

    expect(options).toEqual([
      { label: 'AUTH_SERVICE', value: 'AUTH_SERVICE' },
      { label: 'PERMISSION_SERVICE', value: 'PERMISSION_SERVICE' },
      { label: 'TENANT_ADMIN', value: 'TENANT_ADMIN' },
    ]);
  });

  it('keeps table pagination explicit for permission-management tables', () => {
    const pagination = buildPermissionTablePagination({
      current: 2,
      pageSize: 50,
      total: 118,
    });

    expect(pagination.current).toBe(2);
    expect(pagination.pageSize).toBe(50);
    expect(pagination.total).toBe(118);
    expect(pagination.hideOnSinglePage).toBe(false);
    expect(pagination.position).toEqual(['bottomRight']);
    expect(pagination.pageSizeOptions).toEqual(['20', '50', '100']);
    expect(pagination.showQuickJumper).toBe(true);
  });

  it('adds the current draft module into selectable form options', () => {
    const options = buildPermissionModuleSelectOptions(
      [
        { label: 'AUTH_SERVICE', value: 'AUTH_SERVICE' },
        { label: 'PERMISSION_SERVICE', value: 'PERMISSION_SERVICE' },
      ],
      'NEW_MODULE',
    );

    expect(options).toEqual([
      { label: 'AUTH_SERVICE', value: 'AUTH_SERVICE' },
      { label: 'NEW_MODULE', value: 'NEW_MODULE' },
      { label: 'PERMISSION_SERVICE', value: 'PERMISSION_SERVICE' },
    ]);
  });

  it('collects module options through bounded paged reads', async () => {
    const calls: Array<{ page: number; pageSize: number }> = [];

    const options = await collectPermissionModuleOptions(
      async ({ page, pageSize }) => {
        calls.push({ page, pageSize });

        if (page === 1) {
          return {
            page: 1,
            pageSize,
            permissions: [
              { code: 'permission.list', id: 'p-1', module: 'AUTH_SERVICE' },
              { code: 'permission.update', id: 'p-2', module: 'PERMISSION_SERVICE' },
              ...Array.from({ length: 98 }, (_, index) => ({
                code: `permission.seed.${index + 3}`,
                id: `p-${index + 3}`,
                module: index % 2 === 0 ? 'AUTH_SERVICE' : 'PERMISSION_SERVICE',
              })),
            ],
            total: 120,
          };
        }

        return {
          page: 2,
          pageSize,
          permissions: [
            { code: 'permission.role_instance.list', id: 'p-3', module: 'PERMISSION_SERVICE' },
          ],
          total: 120,
        };
      },
      'LEGACY_MODULE',
    );

    expect(calls).toEqual([
      { page: 1, pageSize: 100 },
      { page: 2, pageSize: 100 },
    ]);
    expect(options).toEqual([
      { label: 'AUTH_SERVICE', value: 'AUTH_SERVICE' },
      { label: 'LEGACY_MODULE', value: 'LEGACY_MODULE' },
      { label: 'PERMISSION_SERVICE', value: 'PERMISSION_SERVICE' },
    ]);
  });

  it('sorts one loaded permission page by code in ascending and descending order', () => {
    const permissions = [
      { code: 'permission.update', id: 'p-3', module: 'PERMISSION_SERVICE' },
      { code: 'permission.create', id: 'p-2', module: 'PERMISSION_SERVICE' },
      { code: 'permission.list', id: 'p-1', module: 'PERMISSION_SERVICE' },
    ];

    expect(sortPermissionsByCode(permissions, 'ascend').map((item) => item.code)).toEqual([
      'permission.create',
      'permission.list',
      'permission.update',
    ]);
    expect(sortPermissionsByCode(permissions, 'descend').map((item) => item.code)).toEqual([
      'permission.update',
      'permission.list',
      'permission.create',
    ]);
    expect(sortPermissionsByCode(permissions, null).map((item) => item.code)).toEqual([
      'permission.update',
      'permission.create',
      'permission.list',
    ]);
  });
});
