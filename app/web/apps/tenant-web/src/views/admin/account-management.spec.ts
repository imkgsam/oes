/* @vitest-environment happy-dom */

import { defineComponent, h } from 'vue';

import { Modal, Select, message } from 'ant-design-vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listAdminAccountsApi = vi.fn();
const listAdminAccountTenantOptionsApi = vi.fn();
const createAdminAccountApi = vi.fn();
const deleteAdminAccountApi = vi.fn();
const disableAdminAccountLoginMethodApi = vi.fn();
const enableAdminAccountLoginMethodApi = vi.fn();
const getAdminAccountDeletionImpactApi = vi.fn();
const getAdminAccountBasicInfoApi = vi.fn();
const updateAdminAccountBasicInfoApi = vi.fn();
const getAccountRoleSelectionApi = vi.fn();
const listAdminAccountLoginMethodsApi = vi.fn();
const requireAdminAccountPasswordSetupApi = vi.fn();
const setAccountRolesApi = vi.fn();

const authContextState: any = {
  actionCodes: [
    'identity.account.create',
    'identity.account.delete',
    'identity.account.profile.update',
    'identity.account.update_status',
    'permission.account.get_roles',
    'permission.account.assign_roles',
  ],
  isPlatformScope: true,
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant',
    },
  },
  tenantName: 'Alpha Tenant',
};

vi.mock('#/api', () => ({
  createAdminAccountApi,
  deleteAdminAccountApi,
  disableAdminAccountLoginMethodApi,
  enableAdminAccountLoginMethodApi,
  getAdminAccountDeletionImpactApi,
  getAdminAccountBasicInfoApi,
  getAccountRoleSelectionApi,
  listAdminAccountLoginMethodsApi,
  listAdminAccountsApi,
  listAdminAccountTenantOptionsApi,
  requireAdminAccountPasswordSetupApi,
  setAccountRolesApi,
  updateAdminAccountBasicInfoApi,
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

vi.mock('ant-design-vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ant-design-vue')>();

  const MockTable = defineComponent({
    name: 'MockAntTable',
    props: {
      columns: {
        type: Array,
        default: () => [],
      },
      dataSource: {
        type: Array,
        default: () => [],
      },
      expandable: {
        type: Object,
        default: undefined,
      },
      locale: {
        type: Object,
        default: () => ({}),
      },
      pagination: {
        type: [Boolean, Object],
        default: false,
      },
      rowKey: {
        type: [Function, String],
        default: 'key',
      },
    },
    setup(props, { attrs }) {
      const resolveRowKey = (record: any) =>
        typeof props.rowKey === 'function' ? props.rowKey(record) : record?.[props.rowKey as string];

      const renderCell = (column: any, record: any) => {
        if (column.customRender) {
          return column.customRender({ record });
        }
        if (column.dataIndex) {
          return record?.[column.dataIndex];
        }
        return record?.[column.key];
      };

      const triggerPageChange = (nextPage: number) => {
        const pageSize =
          typeof props.pagination === 'object' ? props.pagination?.pageSize ?? 20 : 20;
        const handler = attrs.onChange as
          | ((pagination: { current: number; pageSize: number }) => void)
          | undefined;

        handler?.({ current: nextPage, pageSize });
      };

      return () => {
        const rows = props.dataSource as any[];
        const currentPage =
          typeof props.pagination === 'object' ? props.pagination?.current ?? 1 : 1;

        return h('div', { class: 'mock-ant-table' }, [
          rows.length === 0
            ? h('div', { class: 'mock-ant-table__empty' }, props.locale?.emptyText ?? '暂无数据')
            : rows.map((record) => {
                const rowKey = resolveRowKey(record);
                const isExpanded = Boolean(
                  props.expandable?.expandedRowKeys?.includes?.(rowKey),
                );

                return h('div', { key: rowKey, class: 'mock-ant-table__entry' }, [
                  h(
                    'div',
                    { class: 'mock-ant-table__row' },
                    (props.columns as any[]).map((column) =>
                      h(
                        'div',
                        {
                          class: `mock-ant-table__cell mock-ant-table__cell--${column.key || column.dataIndex || 'col'}`,
                        },
                        renderCell(column, record),
                      ),
                    ),
                  ),
                  isExpanded && props.expandable?.expandedRowRender
                    ? h(
                        'div',
                        { class: 'mock-ant-table__expanded' },
                        props.expandable.expandedRowRender(record),
                      )
                    : null,
                ]);
              }),
          h(
            'button',
            {
              class: 'mock-ant-table__page-2',
              type: 'button',
              onClick: () => triggerPageChange(2),
            },
            'Go page 2',
          ),
          h('div', { class: 'mock-ant-table__pagination-state' }, `page:${currentPage}`),
        ]);
      };
    },
  });

  return {
    ...actual,
    Table: MockTable,
  };
});

describe('account management page', () => {
  let confirmOptions: Parameters<typeof Modal.confirm>[0] | undefined;

  function collectNodeText(node: unknown): string[] {
    if (typeof node === 'string') {
      return [node];
    }

    if (Array.isArray(node)) {
      return node.flatMap((item) => collectNodeText(item));
    }

    if (node && typeof node === 'object' && 'children' in node) {
      return collectNodeText((node as { children?: unknown }).children);
    }

    return [];
  }

  function findPrimaryButtonWithinModal(title: string) {
    const modal = Array.from(document.body.querySelectorAll('.ant-modal')).find((element) =>
      element.textContent?.includes(title),
    ) as HTMLElement | undefined;

    return modal?.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement | null;
  }

  async function clickAccountAction(label: string, index = 0) {
    const trigger = document.body.querySelectorAll(
      'button[aria-label="账号操作"]',
    )[index] as HTMLButtonElement | undefined;

    trigger?.click();
    await flushPromises();

    const action = Array.from(
      document.body.querySelectorAll('.ant-dropdown-menu-item, .ant-menu-item'),
    ).find((element) => element.textContent?.includes(label)) as HTMLElement | undefined;

    action?.click();
    await flushPromises();
  }

  beforeEach(() => {
    listAdminAccountsApi.mockReset();
    listAdminAccountTenantOptionsApi.mockReset();
    createAdminAccountApi.mockReset();
    deleteAdminAccountApi.mockReset();
    disableAdminAccountLoginMethodApi.mockReset();
    enableAdminAccountLoginMethodApi.mockReset();
    getAdminAccountDeletionImpactApi.mockReset();
    getAdminAccountBasicInfoApi.mockReset();
    updateAdminAccountBasicInfoApi.mockReset();
    getAccountRoleSelectionApi.mockReset();
    listAdminAccountLoginMethodsApi.mockReset();
    requireAdminAccountPasswordSetupApi.mockReset();
    setAccountRolesApi.mockReset();
    authContextState.actionCodes = [
      'identity.account.create',
      'identity.account.delete',
      'identity.account.profile.update',
      'identity.account.update_status',
      'auth.account_login_methods.manage',
      'permission.account.get_roles',
      'permission.account.assign_roles',
    ];
    authContextState.isPlatformScope = true;
    authContextState.sessionContext = {
      account: {
        accountId: 'account-current',
      },
      tenant: {
        tenantId: 'tenant-1',
        name: 'Alpha Tenant',
      },
    };
    authContextState.tenantName = 'Alpha Tenant';
    listAdminAccountsApi.mockResolvedValue({
      items: [
        {
          accountDisplayName: 'Legacy Account / Alpha Tenant tenant-1',
          accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          userDisplayName: '陈双武',
          userId: 'user-1',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    getAccountRoleSelectionApi.mockResolvedValue({
      availableRoles: [
        {
          code: 'tenant.admin',
          id: 'role-1',
          isEnabled: true,
          isSystem: false,
          name: '租户管理员',
          roleKind: 2,
        },
        {
          code: 'tenant.viewer',
          id: 'role-2',
          isEnabled: true,
          isSystem: false,
          name: '租户观察员',
          roleKind: 2,
        },
      ],
      selectedRoleIds: ['role-1'],
    });
    setAccountRolesApi.mockResolvedValue({
      roles: [],
    });
    listAdminAccountTenantOptionsApi.mockResolvedValue({
      items: [
        {
          id: 'tenant-1',
          code: 'alpha',
          name: 'Alpha Tenant',
          isActive: true,
        },
        {
          id: 'tenant-2',
          code: 'beta',
          name: 'Beta Tenant',
          isActive: true,
        },
      ],
    });
    createAdminAccountApi.mockResolvedValue({
      accountDisplayName: 'New User',
      accountId: 'account-2',
      isEnabled: true,
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      userId: 'user-2',
    });
    getAdminAccountBasicInfoApi.mockResolvedValue({
      accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
      userId: 'user-1',
      displayName: '陈双武',
      email: 'chen@example.com',
      phone: '+8613800138000',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      scopeLevel: 'TENANT',
      isEnabled: true,
    });
    updateAdminAccountBasicInfoApi.mockResolvedValue({
      accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
      userId: 'user-1',
      displayName: '陈双武（新）',
      email: 'new@example.com',
      phone: '+8613900139000',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      scopeLevel: 'TENANT',
      isEnabled: true,
    });
    listAdminAccountLoginMethodsApi.mockResolvedValue({
      passwordSetupRequired: false,
      loginMethods: [
        {
          methodId: 'method-email',
          type: 'EMAIL',
          identifier: 'chen@example.com',
          maskedIdentifier: 'c***@example.com',
          enabled: true,
          verified: true,
          hasPassword: true,
        },
        {
          methodId: 'method-phone',
          type: 'PHONE',
          identifier: '+8613800138000',
          maskedIdentifier: '+86 138****8000',
          enabled: false,
          verified: true,
          hasPassword: false,
        },
      ],
    });
    requireAdminAccountPasswordSetupApi.mockResolvedValue({});
    getAdminAccountDeletionImpactApi.mockResolvedValue({
      accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
      canDelete: true,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteContactAssets: true,
      },
      blockingReasons: [],
      contactAssetCount: 2,
    });
    deleteAdminAccountApi.mockResolvedValue({
      accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
      success: true,
      deletedSessionCount: 3,
      clearedRoleCount: 2,
      deletedContactAssetCount: 2,
      userRetained: true,
    });
    confirmOptions = undefined;
    vi.spyOn(Modal, 'confirm').mockImplementation((options) => {
      confirmOptions = options;
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as never;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('uses the same toolbar and filter-card rhythm as role management before rendering the account list', async () => {
    listAdminAccountsApi.mockResolvedValueOnce({
      items: [
        {
          accountDisplayName: 'Tenant A Account',
          accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          userDisplayName: '陈双武',
          userId: 'user-1',
        },
        {
          accountDisplayName: 'Tenant B Account',
          accountId: '1894c123-0f4b-452e-812f-f7cc9eed6010',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-2',
          tenantName: 'Beta Tenant',
          userDisplayName: '陈双武',
          userId: 'user-1',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 2,
    });

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(document.body.textContent).toContain('账号管理');
    expect(
      document.body.querySelector('input[placeholder="搜索账号名称、用户姓名或租户名称"]'),
    ).not.toBeNull();
    expect(document.body.querySelector('.account-management__filter-panel')).not.toBeNull();
    expect(document.body.querySelector('.account-management__filter-card')).toBeNull();
    const filterPanel = document.body.querySelector(
      '.account-management__filter-panel',
    ) as HTMLElement | null;
    expect(filterPanel?.textContent).not.toContain('筛选条件');
    expect(filterPanel?.querySelectorAll('.account-management__filter-control').length).toBeGreaterThanOrEqual(3);
    expect(filterPanel?.querySelector('.account-management__filter-buttons')).not.toBeNull();
    const pageText = document.body.textContent?.replaceAll(/\s+/g, '') || '';
    expect(pageText).toContain('查询');
    expect(pageText).toContain('重置');
    expect(listAdminAccountsApi).toHaveBeenCalledWith({
      keyword: undefined,
      page: 1,
      pageSize: 20,
      scopeLevel: undefined,
      status: undefined,
    });
    expect(document.body.textContent).toContain('陈双武');
    expect(document.body.textContent).toContain('Alpha Tenant');
    expect(document.body.textContent).toContain('Beta Tenant');
    expect(document.body.textContent).toContain('Tenant A Account');
    await clickAccountAction('角色配置');

    expect(getAccountRoleSelectionApi).toHaveBeenCalledWith('9894c123-0f4b-452e-812f-f7cc9eed6006', {
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
    const roleDrawer = Array.from(document.body.querySelectorAll('.ant-drawer')).find((element) =>
      element.textContent?.includes('保存角色'),
    ) as HTMLElement | undefined;
    expect(roleDrawer?.textContent).toContain('租户管理员');
    expect(roleDrawer?.textContent).toContain('租户观察员');
    expect(roleDrawer?.textContent).not.toContain('用户 ID');
    expect(roleDrawer?.textContent).not.toContain('Scope');
    expect(roleDrawer?.textContent).toContain('Alpha Tenant');

    const roleSearchInput = document.body.querySelector(
      'input[placeholder="搜索角色名称或角色码"]',
    ) as HTMLInputElement | null;
    expect(roleSearchInput).not.toBeNull();

    roleSearchInput!.value = 'viewer';
    roleSearchInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    expect(roleDrawer?.textContent).toContain('租户观察员');
    expect(roleDrawer?.textContent).not.toContain('租户管理员');

    const saveButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('保存角色'),
    ) as HTMLButtonElement | undefined;
    saveButton?.click();
    await flushPromises();

    expect(setAccountRolesApi).toHaveBeenCalledWith('9894c123-0f4b-452e-812f-f7cc9eed6006', {
      accountType: 'USER',
      roleIds: ['role-1'],
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
    });
  });

  it('filters the system-admin account directory by selected tenant', async () => {
    const view = await import('./account-management.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          access: {},
        },
      },
    });
    await flushPromises();

    const tenantFilter = wrapper
      .findAllComponents(Select)
      .find((select) => select.attributes('data-testid') === 'account-tenant-filter');
    tenantFilter?.vm.$emit('update:value', 'tenant-2');
    await flushPromises();

    const searchButton = document.body.querySelector(
      '.account-management__filter-button',
    ) as HTMLButtonElement | null;
    searchButton?.click();
    await flushPromises();

    expect(listAdminAccountTenantOptionsApi).toHaveBeenCalledWith({
      keyword: undefined,
      pageSize: 20,
    });
    expect(listAdminAccountsApi).toHaveBeenLastCalledWith({
      keyword: undefined,
      page: 1,
      pageSize: 20,
      scopeLevel: undefined,
      status: undefined,
      tenantId: 'tenant-2',
    });
  });

  it('renders the role drawer with an account summary before the role list', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('角色配置');

    const roleDrawer = Array.from(document.body.querySelectorAll('.ant-drawer')).find((element) =>
      element.textContent?.includes('保存角色'),
    ) as HTMLElement | undefined;
    const roleSummary = roleDrawer?.querySelector('.account-management__role-hero');
    const roleStats = roleDrawer?.querySelector('.account-management__role-summary-grid');
    const roleList = roleDrawer?.querySelector('.account-management__role-list-shell');

    expect(roleSummary).not.toBeNull();
    expect(roleSummary?.textContent).toContain('角色授权');
    expect(roleSummary?.textContent).toContain('陈双武');
    expect(roleSummary?.textContent).toContain('Alpha Tenant');
    expect(roleStats?.textContent).toContain('已选择');
    expect(roleStats?.textContent).toContain('1');
    expect(roleStats?.textContent).toContain('可分配');
    expect(roleStats?.textContent).toContain('2');
    expect(
      (roleSummary as HTMLElement).compareDocumentPosition(roleList as HTMLElement)
      & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('opens the create modal without showing the tenant column to tenant administrators', async () => {
    authContextState.isPlatformScope = false;

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(document.body.textContent).not.toContain('系统管理员范围');

    const createButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('新增账号'),
    ) as HTMLButtonElement | undefined;
    createButton?.click();
    await flushPromises();

    const displayNameInput = document.body.querySelector(
      'input[placeholder="请输入用户姓名"]',
    ) as HTMLInputElement | null;
    expect(displayNameInput).not.toBeNull();
  });

  it('does not render delete for the current login account row', async () => {
    listAdminAccountsApi.mockResolvedValueOnce({
      items: [
        {
          accountDisplayName: 'Current Account',
          accountId: 'account-current',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          userDisplayName: '当前用户',
          userId: 'user-current',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    const view = await import('./account-management.vue');

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
      'button[aria-label="账号操作"]',
    ) as HTMLButtonElement | null;
    trigger?.click();
    await flushPromises();

    expect(document.body.textContent).not.toContain('删除账号');
  });

  it('hides permission-gated account actions instead of rendering disabled menu items', async () => {
    authContextState.actionCodes = [
      'identity.account.create',
      'identity.account.profile.update',
      'identity.account.update_status',
    ];

    const view = await import('./account-management.vue');

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
      'button[aria-label="账号操作"]',
    ) as HTMLButtonElement | null;
    trigger?.click();
    await flushPromises();

    expect(document.body.textContent).toContain('基本信息');
    expect(document.body.textContent).not.toContain('登录方式');
    expect(document.body.textContent).not.toContain('角色配置');
    expect(document.body.textContent).not.toContain('删除账号');
  });

  it('shows blocker reasons returned by deletion impact and does not delete', async () => {
    getAdminAccountDeletionImpactApi.mockResolvedValueOnce({
      accountId: '9894c123-0f4b-452e-812f-f7cc9eed6006',
      canDelete: false,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteContactAssets: true,
      },
      blockingReasons: [
        {
          resourceType: 'sales_order_owner',
          resourceCount: 4,
          message: '账号仍有业务归属',
        },
      ],
      contactAssetCount: 2,
    });

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('删除账号');

    expect(getAdminAccountDeletionImpactApi).toHaveBeenCalledWith('9894c123-0f4b-452e-812f-f7cc9eed6006');
    expect(document.body.textContent).toContain('账号仍有业务归属');
    expect(deleteAdminAccountApi).not.toHaveBeenCalled();
  });

  it('confirms delete with account context and cleanup summary before deleting', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('删除账号');
    await flushPromises();

    expect(confirmOptions?.title).toContain('确认删除');
    expect(confirmOptions?.okType).toBe('danger');
    const deleteCopy = collectNodeText(confirmOptions?.content).join(' ');
    expect(deleteCopy).toContain('账号名称')
    expect(deleteCopy).toContain('Legacy Account / Alpha Tenant tenant-1')
    expect(deleteCopy).toContain('账号上下文')
    expect(deleteCopy).toContain('Alpha Tenant')
    expect(deleteCopy).toContain('将清理当前账号下的会话与角色绑定')
    expect(deleteCopy).toContain('同步删除 2 条工作联系资产')
    expect(deleteCopy).toContain('不会删除底层 user')
    await confirmOptions?.onOk?.();
    await flushPromises();

    expect(deleteAdminAccountApi).toHaveBeenCalledWith('9894c123-0f4b-452e-812f-f7cc9eed6006');
    expect(listAdminAccountsApi).toHaveBeenCalledTimes(2);
  });

  it('shows the cleanup summary in the delete success toast', async () => {
    const successSpy = vi.spyOn(message, 'success')
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('删除账号');
    await confirmOptions?.onOk?.();
    await flushPromises();

    expect(successSpy).toHaveBeenCalledWith(
      '账号已删除，已清理 3 个会话、2 个角色绑定、2 条工作联系资产',
    )
  });

  it('falls back to the previous page when deleting the last row on the current page', async () => {
    listAdminAccountsApi.mockReset()
    listAdminAccountsApi
      .mockResolvedValueOnce({
        items: [
          {
            accountDisplayName: 'Page One Account',
            accountId: 'account-page-1',
            isEnabled: true,
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1',
            tenantName: 'Alpha Tenant',
            userDisplayName: '第一页用户',
            userId: 'user-page-1',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 21,
      })
      .mockResolvedValueOnce({
        items: [
          {
            accountDisplayName: 'Last Page Account',
            accountId: 'account-last-page',
            isEnabled: true,
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1',
            tenantName: 'Alpha Tenant',
            userDisplayName: '末页用户',
            userId: 'user-last-page',
          },
        ],
        page: 2,
        pageSize: 20,
        total: 21,
      })
      .mockResolvedValueOnce({
        items: [],
        page: 2,
        pageSize: 20,
        total: 20,
      })
      .mockResolvedValueOnce({
        items: [
          {
            accountDisplayName: 'Page One Account',
            accountId: 'account-page-1',
            isEnabled: true,
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1',
            tenantName: 'Alpha Tenant',
            userDisplayName: '第一页用户',
            userId: 'user-page-1',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 20,
      });
    getAdminAccountDeletionImpactApi.mockResolvedValueOnce({
      accountId: 'account-last-page',
      canDelete: true,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteContactAssets: true,
      },
      blockingReasons: [],
      contactAssetCount: 0,
    });
    deleteAdminAccountApi.mockResolvedValueOnce({
      accountId: 'account-last-page',
      success: true,
      deletedSessionCount: 1,
      clearedRoleCount: 1,
      deletedContactAssetCount: 0,
      userRetained: true,
    });

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const pageButton = document.body.querySelector(
      '.mock-ant-table__page-2',
    ) as HTMLButtonElement | null;
    pageButton?.click();
    await flushPromises();

    expect(document.body.textContent).toContain('Last Page Account');
    await clickAccountAction('删除账号');
    await confirmOptions?.onOk?.();
    await flushPromises();

    expect(listAdminAccountsApi).toHaveBeenNthCalledWith(2, {
      keyword: undefined,
      page: 2,
      pageSize: 20,
      scopeLevel: undefined,
      status: undefined,
    });
    expect(listAdminAccountsApi).toHaveBeenNthCalledWith(3, {
      keyword: undefined,
      page: 2,
      pageSize: 20,
      scopeLevel: undefined,
      status: undefined,
    });
    expect(listAdminAccountsApi).toHaveBeenNthCalledWith(4, {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      scopeLevel: undefined,
      status: undefined,
    });
    expect(document.body.textContent).toContain('Page One Account');
    expect(document.body.textContent).not.toContain('Last Page Account');
  });

  it('only deletes after the confirmation callback is executed', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('删除账号');

    expect(confirmOptions?.title).toContain('确认删除');
    expect(deleteAdminAccountApi).not.toHaveBeenCalled();
  });

  it('submits create-account phone numbers in the same normalized format used by the login page', async () => {
    authContextState.isPlatformScope = false;

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const createButton = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('新增账号'),
    ) as HTMLButtonElement | undefined;
    createButton?.click();
    await flushPromises();

    const displayNameInput = document.body.querySelector(
      'input[placeholder="请输入用户姓名"]',
    ) as HTMLInputElement | null;
    displayNameInput!.value = '李测试';
    displayNameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    const phoneInput = document.body.querySelector(
      'input[placeholder="请输入手机号"]',
    ) as HTMLInputElement | null;
    phoneInput!.value = '138 0013 8000';
    phoneInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    const submitButton = findPrimaryButtonWithinModal('新增账号');
    submitButton?.click();
    await flushPromises();

    expect(createAdminAccountApi).toHaveBeenCalledWith({
      displayName: '李测试',
      email: undefined,
      phone: '+8613800138000',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      username: '李测试',
    });
  });

  it('does not render legacy account display names when user display name is unavailable', async () => {
    listAdminAccountsApi.mockResolvedValueOnce({
      items: [
        {
          accountDisplayName: 'Legacy Account / Alpha Tenant tenant-1',
          accountId: 'account-1',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant',
          userId: 'user-1',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(document.body.textContent).toContain('Legacy Account / Alpha Tenant tenant-1');
  });

  it('opens the basic-info modal from the action menu and submits only maintainable profile fields', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('基本信息');

    expect(getAdminAccountBasicInfoApi).toHaveBeenCalledWith(
      '9894c123-0f4b-452e-812f-f7cc9eed6006',
    );

    const nameInput = document.body.querySelector(
      'input[placeholder="请输入用户姓名"]',
    ) as HTMLInputElement | null;
    nameInput!.value = '陈双武（新）';
    nameInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();

    expect(document.body.querySelector('input[placeholder="请输入手机号"]')).toBeNull();
    expect(document.body.querySelector('input[placeholder="请输入邮箱"]')).toBeNull();

    const submitButton = findPrimaryButtonWithinModal('基本信息');
    submitButton?.click();
    await flushPromises();

    expect(updateAdminAccountBasicInfoApi).toHaveBeenCalledWith(
      '9894c123-0f4b-452e-812f-f7cc9eed6006',
      {
        displayName: '陈双武（新）',
        isEnabled: true,
      },
    );
    expect(listAdminAccountsApi).toHaveBeenCalledTimes(2);
  });

  it('renders the basic-info editor with an identity summary before editable fields', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('基本信息');

    const modal = Array.from(document.body.querySelectorAll('.ant-modal')).find((element) =>
      element.textContent?.includes('基本信息'),
    ) as HTMLElement | undefined;
    const identitySummary = modal?.querySelector('.account-management__basic-hero');
    const editPanel = modal?.querySelector('.account-management__basic-editor');

    expect(identitySummary).not.toBeNull();
    expect(identitySummary?.textContent).toContain('身份档案');
    expect(identitySummary?.textContent).toContain('陈双武');
    expect(identitySummary?.textContent).toContain('Alpha Tenant');
    expect(identitySummary?.textContent).toContain('启用');
    expect(editPanel).not.toBeNull();
    expect(modal?.textContent).not.toContain('账号 ID');
    expect(modal?.textContent).not.toContain('用户 ID');
    expect(modal?.textContent).not.toContain('Scope');
    expect(modal?.querySelector('.account-management__basic-contact-panel')).not.toBeNull();
    expect(modal?.textContent).toContain('+8613800138000');
    expect(modal?.textContent).toContain('chen@example.com');
    expect(modal?.textContent).toContain('联系方式需通过登录方式或绑定流程维护');
    expect(
      (identitySummary as HTMLElement).compareDocumentPosition(editPanel as HTMLElement)
      & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the login-method modal with a concise security summary before the table', async () => {
    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();
    await clickAccountAction('登录方式');

    expect(listAdminAccountLoginMethodsApi).toHaveBeenCalledWith(
      '9894c123-0f4b-452e-812f-f7cc9eed6006',
    );

    const modal = Array.from(document.body.querySelectorAll('.ant-modal')).find((element) =>
      element.textContent?.includes('登录方式'),
    ) as HTMLElement | undefined;
    const securitySummary = modal?.querySelector('.account-management__login-hero');
    const summaryGrid = modal?.querySelector('.account-management__login-summary-grid');
    const tableShell = modal?.querySelector('.account-management__login-method-table-shell');

    expect(securitySummary).not.toBeNull();
    expect(securitySummary?.textContent).toContain('登录安全');
    expect(securitySummary?.textContent).toContain('陈双武');
    expect(securitySummary?.textContent).toContain('状态正常');
    expect(summaryGrid?.textContent).toContain('登录方式数');
    expect(summaryGrid?.textContent).toContain('2');
    expect(
      (securitySummary as HTMLElement).compareDocumentPosition(tableShell as HTMLElement)
      & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('falls back to the previous page when a status update removes the last row under the current filter', async () => {
    listAdminAccountsApi.mockReset();
    listAdminAccountsApi
      .mockResolvedValueOnce({
        items: [
          {
            accountDisplayName: 'Page One Enabled Account',
            accountId: 'account-page-1',
            isEnabled: true,
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1',
            tenantName: 'Alpha Tenant',
            userDisplayName: '第一页启用用户',
            userId: 'user-page-1',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 21,
      })
      .mockResolvedValueOnce({
        items: [
          {
            accountDisplayName: 'Last Enabled Account',
            accountId: 'account-last-enabled',
            isEnabled: true,
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1',
            tenantName: 'Alpha Tenant',
            userDisplayName: '末页启用用户',
            userId: 'user-last-enabled',
          },
        ],
        page: 2,
        pageSize: 20,
        total: 21,
      })
      .mockResolvedValueOnce({
        items: [],
        page: 2,
        pageSize: 20,
        total: 20,
      })
      .mockResolvedValueOnce({
        items: [
          {
            accountDisplayName: 'Page One Enabled Account',
            accountId: 'account-page-1',
            isEnabled: true,
            scopeLevel: 'TENANT',
            tenantId: 'tenant-1',
            tenantName: 'Alpha Tenant',
            userDisplayName: '第一页启用用户',
            userId: 'user-page-1',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 20,
      });
    getAdminAccountBasicInfoApi.mockResolvedValueOnce({
      accountId: 'account-last-enabled',
      userId: 'user-last-enabled',
      displayName: '末页启用用户',
      email: 'enabled@example.com',
      phone: '+8613800138000',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      scopeLevel: 'TENANT',
      isEnabled: true,
    });
    updateAdminAccountBasicInfoApi.mockResolvedValueOnce({
      accountId: 'account-last-enabled',
      userId: 'user-last-enabled',
      displayName: '末页启用用户',
      email: 'enabled@example.com',
      phone: '+8613800138000',
      tenantId: 'tenant-1',
      tenantName: 'Alpha Tenant',
      scopeLevel: 'TENANT',
      isEnabled: false,
    });

    const view = await import('./account-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    const statusSelect = document.body.querySelectorAll('.ant-select-selector')[2] as HTMLElement | undefined;
    statusSelect?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flushPromises();
    const enabledOption = Array.from(
      document.body.querySelectorAll('.ant-select-item-option-content'),
    ).find((element) => element.textContent?.includes('启用')) as HTMLElement | undefined;
    enabledOption?.click();
    await flushPromises();

    const pageButton = document.body.querySelector(
      '.mock-ant-table__page-2',
    ) as HTMLButtonElement | null;
    pageButton?.click();
    await flushPromises();

    expect(document.body.textContent).toContain('Last Enabled Account');
    await clickAccountAction('基本信息');

    const switchButton = document.body.querySelector(
      '.ant-switch',
    ) as HTMLButtonElement | null;
    switchButton?.click();
    await flushPromises();

    const submitButton = findPrimaryButtonWithinModal('基本信息');
    submitButton?.click();
    await flushPromises();

    expect(listAdminAccountsApi).toHaveBeenNthCalledWith(2, {
      keyword: undefined,
      page: 2,
      pageSize: 20,
      scopeLevel: undefined,
      status: 'ENABLED',
    });
    expect(listAdminAccountsApi).toHaveBeenNthCalledWith(3, {
      keyword: undefined,
      page: 2,
      pageSize: 20,
      scopeLevel: undefined,
      status: 'ENABLED',
    });
    expect(listAdminAccountsApi).toHaveBeenNthCalledWith(4, {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      scopeLevel: undefined,
      status: 'ENABLED',
    });
    expect(document.body.textContent).toContain('Page One Enabled Account');
    expect(document.body.textContent).not.toContain('Last Enabled Account');
  });
});
