/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getPolicyByIdApi = vi.fn();
const listPermissionPoliciesApi = vi.fn();
const listPoliciesApi = vi.fn();

vi.mock('#/api', () => ({
  getPolicyByIdApi,
  listPermissionPoliciesApi,
  listPoliciesApi,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    actionCodes: ['permission.policy.list', 'permission.create', 'permission.update'],
  }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

describe('policy governance page', () => {
  beforeEach(() => {
    listPoliciesApi.mockReset();
    getPolicyByIdApi.mockReset();
    listPermissionPoliciesApi.mockReset();

    listPoliciesApi.mockResolvedValue({
      page: 1,
      pageSize: 20,
      policies: [
        {
          conditionAstJson: '{"all":[{"fact":"tenantId","op":"eq","value":"tenant-1"}]}',
          description: 'Only tenant admins can update roles in tenant-1.',
          effect: 'DENY',
          id: 'policy-1',
          isEnabled: true,
          name: 'Deny Tenant Role Update',
          permissionCode: 'permission.role_instance.update',
          priority: 10,
          resourceType: 'ROLE',
          subjectId: 'tenant.admin',
          subjectType: 'ROLE',
          tenantId: 'tenant-1',
        },
      ],
      total: 1,
    });
    getPolicyByIdApi.mockResolvedValue({
      conditionAstJson: '{"all":[{"fact":"tenantId","op":"eq","value":"tenant-1"}]}',
      description: 'Only tenant admins can update roles in tenant-1.',
      effect: 'DENY',
      id: 'policy-1',
      isEnabled: true,
      name: 'Deny Tenant Role Update',
      permissionCode: 'permission.role_instance.update',
      priority: 10,
      resourceType: 'ROLE',
      subjectId: 'tenant.admin',
      subjectType: 'ROLE',
      tenantId: 'tenant-1',
    });
    listPermissionPoliciesApi.mockResolvedValue({
      policies: [
        {
          id: 'policy-1',
          name: 'Deny Tenant Role Update',
        },
      ],
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('loads the readonly policy list on mount', async () => {
    const view = await import('./policy-governance.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(listPoliciesApi).toHaveBeenCalledWith({
      isEnabled: undefined,
      keyword: undefined,
      page: 1,
      pageSize: 20,
      permissionCode: undefined,
      tenantId: undefined,
    });
  });

  it('submits filters and forwards the normalized query', async () => {
    const view = await import('./policy-governance.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    await wrapper.find('input[aria-label="策略关键字"]').setValue('deny');
    await wrapper.find('input[aria-label="权限码过滤"]').setValue(
      'permission.role_instance.update',
    );
    await wrapper.find('input[aria-label="租户过滤"]').setValue('tenant-1');
    await wrapper
      .find('.policy-governance__status-select select')
      .setValue('false');
    await wrapper
      .find('.policy-governance__search-button')
      .trigger('click');

    await flushPromises();

    expect(listPoliciesApi).toHaveBeenLastCalledWith({
      isEnabled: false,
      keyword: 'deny',
      page: 1,
      pageSize: 20,
      permissionCode: 'permission.role_instance.update',
      tenantId: 'tenant-1',
    });
  });

  it('opens readonly detail and renders formatted condition ast json', async () => {
    const view = await import('./policy-governance.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    Array.from(document.body.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('查看详情'))
      ?.click();

    await flushPromises();

    expect(getPolicyByIdApi).toHaveBeenCalledWith('policy-1');
    expect(listPermissionPoliciesApi).toHaveBeenCalledWith('permission.role_instance.update', {
      tenantId: undefined,
    });
    expect(document.body.textContent).toContain('策略详情');
    expect(document.body.textContent).toContain('同权限策略');
    expect(document.body.textContent).toContain('conditionAstJson');
    expect(document.body.textContent).toContain('"tenantId"');
  });

  it('uses framework-aligned management chrome with focused tooltip triggers and stays readonly', async () => {
    const view = await import('./policy-governance.vue');

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
      '.policy-governance__section-title--primary',
    );
    const filterCard = document.body.querySelector('.policy-governance__filters-card');
    const tableCard = document.body.querySelector('.policy-governance__table-card');
    const helpDot = document.body.querySelector('.policy-governance__help-dot');

    expect(sectionTitle).not.toBeNull();
    expect(sectionTitle?.textContent).toContain('策略治理');
    expect(filterCard).not.toBeNull();
    expect(tableCard).not.toBeNull();
    expect(helpDot).not.toBeNull();
    expect(document.body.textContent).toContain('策略目录');
    expect(document.body.textContent).toContain('查看详情');
    expect(document.body.textContent).not.toContain('登录 MFA 策略');
    expect(document.body.textContent).not.toContain('因子优先级');

    expect(document.body.textContent).not.toContain('创建');
    expect(document.body.textContent).not.toContain('编辑');
    expect(document.body.textContent).not.toContain('删除');
    expect(document.body.textContent).not.toContain('启停');
  });
});
