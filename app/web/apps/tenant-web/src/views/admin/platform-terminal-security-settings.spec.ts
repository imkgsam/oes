/* @vitest-environment happy-dom */

import { Modal } from 'ant-design-vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getAdminPlatformTerminalLoginPolicyApi = vi.fn();
const getAdminPlatformTerminalMfaPolicyApi = vi.fn();
const updateAdminPlatformTerminalLoginPolicyApi = vi.fn();
const updateAdminPlatformTerminalMfaPolicyApi = vi.fn();

const authContextState = {
  actionCodes: ['auth.platform_mfa_policy.manage'],
  sessionContext: {
    scopeLevel: 'SYSTEM',
  },
};

vi.mock('#/api', () => ({
  getAdminPlatformTerminalLoginPolicyApi,
  getAdminPlatformTerminalMfaPolicyApi,
  updateAdminPlatformTerminalLoginPolicyApi,
  updateAdminPlatformTerminalMfaPolicyApi,
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

describe('platform terminal security settings page', () => {
  beforeEach(() => {
    getAdminPlatformTerminalLoginPolicyApi.mockReset();
    getAdminPlatformTerminalMfaPolicyApi.mockReset();
    updateAdminPlatformTerminalLoginPolicyApi.mockReset();
    updateAdminPlatformTerminalMfaPolicyApi.mockReset();

    getAdminPlatformTerminalLoginPolicyApi.mockResolvedValue({
      entries: [
        {
          enabledLoginFlows: ['PASSWORD'],
          supportedLoginFlows: ['PASSWORD', 'EMPLOYEE_CODE_PIN'],
          terminal: 'PDA',
        },
        {
          enabledLoginFlows: ['EMAIL_PASSWORD', 'EMAIL_OTP'],
          supportedLoginFlows: ['EMAIL_PASSWORD', 'EMAIL_OTP', 'PHONE_PASSWORD', 'PHONE_OTP'],
          terminal: 'WEB',
        },
      ],
    });
    getAdminPlatformTerminalMfaPolicyApi.mockResolvedValue({
      entries: [
        {
          allowedFactors: ['EMAIL_OTP', 'TOTP'],
          factorPriority: ['EMAIL_OTP', 'TOTP'],
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
          source: 'PLATFORM_DEFAULT',
          terminal: 'WEB',
        },
      ],
    });
    updateAdminPlatformTerminalLoginPolicyApi.mockImplementation(async (payload) => ({
      entries: payload.entries,
    }));
    updateAdminPlatformTerminalMfaPolicyApi.mockImplementation(async (payload) => ({
      entries: payload.entries,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('loads platform terminal login policy and terminal MFA defaults', async () => {
    const view = await import('./platform-terminal-security-settings.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(getAdminPlatformTerminalLoginPolicyApi).toHaveBeenCalledTimes(1);
    expect(getAdminPlatformTerminalMfaPolicyApi).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('平台终端安全配置');
    expect(document.body.textContent).toContain('Web');
    expect(document.body.textContent).toContain('PDA');
    expect(document.body.textContent).toContain('邮箱 + 密码');
  });

  it('requires confirmation before saving a terminal with no enabled login flow', async () => {
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config: any) => {
      config.onOk?.();
      return { destroy: vi.fn(), update: vi.fn() } as any;
    });
    const view = await import('./platform-terminal-security-settings.vue');

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
    vm.updateLoginFlows('PDA', []);
    await vm.savePlatformTerminalLoginPolicy();
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(updateAdminPlatformTerminalLoginPolicyApi).toHaveBeenCalledWith({
      entries: [
        {
          enabledLoginFlows: ['EMAIL_PASSWORD', 'EMAIL_OTP'],
          terminal: 'WEB',
        },
        {
          enabledLoginFlows: [],
          terminal: 'PDA',
        },
      ],
    });
  });

  it('passes operational confirmation when enabling PDA terminal MFA defaults', async () => {
    vi.spyOn(Modal, 'confirm').mockImplementation((config: any) => {
      config.onOk?.();
      return { destroy: vi.fn(), update: vi.fn() } as any;
    });
    const view = await import('./platform-terminal-security-settings.vue');

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
    await vm.savePlatformTerminalMfaPolicy();
    await flushPromises();

    expect(updateAdminPlatformTerminalMfaPolicyApi).toHaveBeenCalledWith({
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
          allowedFactors: ['EMAIL_OTP', 'TOTP'],
          factorPriority: ['EMAIL_OTP', 'TOTP'],
          loginMfaRequired: true,
          newDeviceMfaRequired: false,
          terminal: 'PDA',
        },
      ],
    });
  });
});

