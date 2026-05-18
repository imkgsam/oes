import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(__dirname, '../../../../..');
const tenantWebSrc = join(repoRoot, 'apps/tenant-web/src');

const tableMigrationTargets = [
  'views/admin/customer-management.vue',
  'views/admin/finance-account-detail.vue',
  'views/admin/finance-management.vue',
  'views/admin/finance-receivable-schedule-detail.vue',
  'views/admin/org-management-workspace.vue',
  'views/admin/procurement-management.vue',
  'views/admin/sales-quote-order-workspace.vue',
  'views/admin/supplier-management.vue',
  'views/admin/wms-management.vue',
];

const operationColumnTargets = [
  'views/_core/profile/security-center.vue',
  'views/admin/account-management.vue',
  'views/admin/auth-session-management.vue',
  'views/admin/employee-management-workspace.vue',
  'views/admin/item-attribute-detail.vue',
  'views/admin/item-attribute-management.vue',
  'views/admin/item-category-management.vue',
  'views/admin/item-management.vue',
  'views/admin/mes-mold-management.vue',
  'views/admin/mes-production-mold-management.vue',
  'views/admin/navigation-management.vue',
  'views/admin/org-management-workspace.vue',
  'views/admin/permission-management.vue',
  'views/admin/policy-governance.vue',
  'views/admin/role-management.vue',
  'views/admin/tenant-management.vue',
  'views/admin/terminal-device-management/index.vue',
  ...tableMigrationTargets,
];

function readTenantWebFile(relativePath: string) {
  return readFileSync(join(tenantWebSrc, relativePath), 'utf8');
}

// Keeps list surfaces on the Ant Design Vue Table contract instead of ad-hoc HTML tables.
describe('tenant-web table action consistency', () => {
  it('does not leave raw html table markup in migrated admin pages', () => {
    const rawTableFiles = tableMigrationTargets.filter((file) =>
      /<table\b/.test(readTenantWebFile(file)),
    );

    expect(rawTableFiles.map((file) => relative(tenantWebSrc, join(tenantWebSrc, file)))).toEqual([]);
  });

  it('uses native Ant Design dropdown primitives for operation columns', () => {
    const filesWithoutNativeDropdown = [...new Set(operationColumnTargets)].filter((file) => {
      const source = readTenantWebFile(file);

      return (
        (/operationColumnTitle|title:\s*['"](操作|Action|Workbench)['"]|<th>\s*操作\s*<\/th>/.test(source)) &&
        !/\bDropdown\b/.test(source) &&
        !/\bMenu\b/.test(source)
      );
    });

    expect(
      filesWithoutNativeDropdown.map((file) =>
        relative(tenantWebSrc, join(tenantWebSrc, file)),
      ),
    ).toEqual([]);
  });

  it('does not use the removed table action dropdown wrapper', () => {
    const legacyWrapperFiles = [...new Set(operationColumnTargets)].filter((file) => {
      const source = readTenantWebFile(file);

      return /table-action-dropdown|TableActionDropdown|renderTableActionDropdown|createTableActionColumn/.test(
        source,
      );
    });

    expect(
      legacyWrapperFiles.map((file) =>
        relative(tenantWebSrc, join(tenantWebSrc, file)),
      ),
    ).toEqual([]);
  });
});
