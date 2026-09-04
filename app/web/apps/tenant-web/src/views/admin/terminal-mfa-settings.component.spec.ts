/* @vitest-environment happy-dom */

import { Modal } from 'ant-design-vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getAdminTenantTerminalMfaPolicyApi = vi.fn();
const updateAdminTenantTerminalMfaPolicyApi = vi.fn();

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
  getAdminTenantTerminalMfaPolicyApi,
  updateAdminTenantTerminalMfaPolicyApi,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><h1>{{ title }}</h1><slot /></div>',
  },
}));

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />',
  },
}));

describe('terminal mfa settings page', () => {
  beforeEach(() => {
    getAdminTenantTerminalMfaPolicyApi.mockReset();
    updateAdminTenantTerminalMfaPolicyApi.mockReset();

    getAdminTenantTerminalMfaPolicyApi.mockResolvedValue({
      entries: [
        {
          allowedFactors: ['EMAIL_OTP'],
          factorPriority: ['EMAIL_OTP'],
          loginMfaRequired: false,
          newDeviceMfaRequired: false,
          source: 'PLATFORM_DEFAULT',
          terminal: 'PDA',
        },
        {
          allowedFactors: ['EMAIL_OTP', 'TOTP'],
          factorPriority: ['EMAIL_OTP', 'TOTP'],
          loginMfaRequired: true,
          newDeviceMfaRequired: true,
          source: 'TENANT_OVERRIDE',
          terminal: 'WEB',
        },
      ],
      tenantId: 'tenant-1',
    });
    updateAdminTenantTerminalMfaPolicyApi.mockImplementation(async (payload) => ({
      entries: payload.entries,
      tenantId: 'tenant-1',
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('loads the tenant-effective terminal MFA policy with source labels', async () => {
    const view = await import('./terminal-mfa-settings.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(getAdminTenantTerminalMfaPolicyApi).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('终端 MFA 配置');
    expect(document.body.textContent).toContain('Tenant ID: tenant-1');
    expect(document.body.textContent).toContain('平台默认');
    expect(document.body.textContent).toContain('租户覆盖');
  });

  it('requires operational confirmation when tenant enables PDA login MFA', async () => {
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config: any) => {
      config.onOk?.();
      return { destroy: vi.fn(), update: vi.fn() } as any;
    });
    const view = await import('./terminal-mfa-settings.vue');

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
    vm.updateMfaEntry('PDA', { loginMfaRequired: true });
    await vm.saveTenantTerminalMfaPolicy();
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(updateAdminTenantTerminalMfaPolicyApi).toHaveBeenCalledWith({
      confirmOperationalImpact: true,
      entries: [
        {
          allowedFactors: ['EMAIL_OTP', 'TOTP'],
          factorPriority: ['EMAIL_OTP', 'TOTP'],
          loginMfaRequired: true,
          newDeviceMfaRequired: true,
          terminal: 'WEB',
        },
        {
          allowedFactors: ['EMAIL_OTP'],
          factorPriority: ['EMAIL_OTP'],
          loginMfaRequired: true,
          newDeviceMfaRequired: false,
          terminal: 'PDA',
        },
      ],
    });
  });

  it('keeps factor priority aligned with allowed factors', async () => {
    const view = await import('./terminal-mfa-settings.vue');

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
    vm.updateAllowedFactors('PDA', ['TOTP', 'EMAIL_OTP']);

    expect(vm.entries.find((entry: any) => entry.terminal === 'PDA')).toMatchObject({
      allowedFactors: ['EMAIL_OTP', 'TOTP'],
      factorPriority: ['EMAIL_OTP', 'TOTP'],
    });
  });
});

