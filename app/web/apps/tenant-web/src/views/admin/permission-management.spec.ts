/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listPermissionsApi = vi.fn();

vi.mock('#/api', () => ({
  createPermissionApi: vi.fn(),
  deletePermissionApi: vi.fn(),
  getPermissionByIdApi: vi.fn(),
  listPermissionRolesApi: vi.fn(),
  listPermissionsApi,
  updatePermissionApi: vi.fn(),
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    actionCodes: [
      'permission.create',
      'permission.delete',
      'permission.list',
      'permission.role.list',
      'permission.update',
    ],
  }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />',
  },
}));

describe('permission management page', () => {
  beforeEach(() => {
    listPermissionsApi.mockReset();
    listPermissionsApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      permissions: [
        {
          code: 'permission.audit.list',
          description: 'List permission audit records',
          id: 'perm-1',
          module: 'PERMISSION_SERVICE',
        },
      ],
      total: 1,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the row action dropdown when the trigger button is clicked', async () => {
    const view = await import('./permission-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const trigger = document.body.querySelector(
      'button[aria-label="权限操作"]',
    ) as HTMLButtonElement | null;

    expect(trigger).not.toBeNull();

    trigger?.click();
    await flushPromises();

    expect(document.body.textContent).toContain('引用角色');
    expect(document.body.textContent).toContain('编辑');
    expect(document.body.textContent).toContain('删除');
  });

  it('renders the catalog header with a primary section title and a narrower create modal', async () => {
    const view = await import('./permission-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const sectionTitle = document.body.querySelector(
      '.permission-management__section-title',
    );

    expect(sectionTitle).not.toBeNull();
    expect(sectionTitle?.textContent).toContain('权限目录');
    expect(sectionTitle?.className).toContain(
      'permission-management__section-title--primary',
    );

    const createButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('创建权限'),
    ) as HTMLButtonElement | undefined;

    createButton?.click();
    await flushPromises();

    const createModalWrap = document.body.querySelector(
      '.permission-management__create-modal-wrap',
    );

    expect(createModalWrap).not.toBeNull();
  });
});
