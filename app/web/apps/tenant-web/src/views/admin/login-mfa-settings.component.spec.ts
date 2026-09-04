/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAdminTenantMfaPolicyApi = vi.fn();
const updateAdminTenantMfaPolicyApi = vi.fn();
const initializeSortable = vi.fn();
const useSortable = vi.fn(() => ({ initializeSortable }));

const authContextState = {
  actionCodes: ['auth.mfa_policy.manage'],
  sessionContext: {
    scopeLevel: 'TENANT',
    tenant: {
      name: '潮州市美隆陶瓷实业有限公司',
      tenantId: 'tenant-1',
    },
  },
};

vi.mock('#/api', () => ({
  getAdminTenantMfaPolicyApi,
  updateAdminTenantMfaPolicyApi,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
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

vi.mock('@vben/hooks', () => ({
  useSortable,
}));

describe('login mfa settings page', () => {
  beforeEach(() => {
    getAdminTenantMfaPolicyApi.mockReset();
    updateAdminTenantMfaPolicyApi.mockReset();
    initializeSortable.mockReset();
    initializeSortable.mockResolvedValue({
      destroy: vi.fn(),
    });

    getAdminTenantMfaPolicyApi.mockResolvedValue({
      factors: [
        { enabled: true, factor: 'EMAIL_OTP', priority: 1 },
        { enabled: true, factor: 'TOTP', priority: 2 },
        { enabled: false, factor: 'BACKUP_CODE', priority: 3 },
      ],
      loginRequired: true,
      scenarioRequirements: [
        { required: true, scenario: 'LOGIN' },
        { required: false, scenario: 'CHANGE_PASSWORD' },
        { required: true, scenario: 'CHANGE_CONTACT' },
        { required: false, scenario: 'NEW_DEVICE_LOGIN' },
      ],
      tenantId: 'tenant-1',
    });
    updateAdminTenantMfaPolicyApi.mockResolvedValue({
      factors: [
        { enabled: false, factor: 'BACKUP_CODE', priority: 1 },
        { enabled: true, factor: 'EMAIL_OTP', priority: 2 },
        { enabled: true, factor: 'TOTP', priority: 3 },
      ],
      loginRequired: true,
      scenarioRequirements: [
        { required: true, scenario: 'LOGIN' },
        { required: false, scenario: 'CHANGE_PASSWORD' },
        { required: true, scenario: 'CHANGE_CONTACT' },
        { required: false, scenario: 'NEW_DEVICE_LOGIN' },
      ],
      tenantId: 'tenant-1',
    });
  });

  it('loads one dedicated tenant settings page instead of sharing policy governance chrome', async () => {
    const view = await import('./login-mfa-settings.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(getAdminTenantMfaPolicyApi).toHaveBeenCalledTimes(1);
    expect(useSortable).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        draggable: '.login-mfa-settings__factor-row',
        forceFallback: true,
        handle: '.login-mfa-settings__drag-handle',
      }),
    );
    expect(document.body.textContent).toContain('租户 MFA 配置');
    expect(document.body.textContent).toContain('账号安全场景');
    expect(document.body.textContent).toContain('修改密码');
    expect(document.body.textContent).toContain('更换邮箱 / 手机');
    expect(document.body.textContent).not.toContain('新设备登录');
    expect(document.body.textContent).toContain('拖拽排序');
    expect(document.body.textContent).not.toContain('策略治理');
  });

  it('reorders factors through the drag handler and saves the recomputed priorities', async () => {
    const view = await import('./login-mfa-settings.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const vm = wrapper.vm as any;
    vm.handleFactorDragEnd({ newIndex: 0, oldIndex: 2 });
    await flushPromises();

    expect(vm.editableFactors.map((factor: any) => factor.factor)).toEqual([
      'BACKUP_CODE',
      'EMAIL_OTP',
      'TOTP',
    ]);
    expect(vm.editableFactors.map((factor: any) => factor.priority)).toEqual([1, 2, 3]);

    await vm.saveTenantMfaPolicy();
    await flushPromises();

    expect(updateAdminTenantMfaPolicyApi).toHaveBeenCalledWith({
      factors: [
        { enabled: false, factor: 'BACKUP_CODE', priority: 1 },
        { enabled: true, factor: 'EMAIL_OTP', priority: 2 },
        { enabled: true, factor: 'TOTP', priority: 3 },
      ],
      loginRequired: true,
      scenarioRequirements: [
        { required: true, scenario: 'LOGIN' },
        { required: false, scenario: 'CHANGE_PASSWORD' },
        { required: true, scenario: 'CHANGE_CONTACT' },
        { required: false, scenario: 'NEW_DEVICE_LOGIN' },
      ],
    });
  });
});
