/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal, message } from 'ant-design-vue';

const archiveManagedOrgUnitApi = vi.fn();
const createManagedOrgUnitApi = vi.fn();
const getManagedOrgTreeApi = vi.fn();
const getManagedOrgUnitByIdApi = vi.fn();
const listManagedTenantsApi = vi.fn();
const updateManagedOrgUnitApi = vi.fn();
const useRoute = vi.fn();
const replace = vi.fn();

const authContextState: any = {
  actionCodes: [
    'tenant_org.org_unit.list_tree',
    'tenant_org.org_unit.get_by_id',
    'tenant_org.org_unit.create',
    'tenant_org.org_unit.update',
    'tenant_org.org_unit.archive',
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
  archiveManagedOrgUnitApi,
  createManagedOrgUnitApi,
  getManagedOrgTreeApi,
  getManagedOrgUnitByIdApi,
  listManagedTenantsApi,
  updateManagedOrgUnitApi,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
}));

vi.mock('vue-router', () => ({
  useRoute: () => useRoute(),
  useRouter: () => ({
    replace,
  }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

describe('org management page', () => {
  beforeEach(() => {
    replace.mockReset();
    archiveManagedOrgUnitApi.mockReset();
    createManagedOrgUnitApi.mockReset();
    getManagedOrgTreeApi.mockReset();
    getManagedOrgUnitByIdApi.mockReset();
    listManagedTenantsApi.mockReset();
    updateManagedOrgUnitApi.mockReset();
    authContextState.isPlatformScope = true;
    authContextState.sessionContext = {
      tenant: {
        tenantId: 'tenant-1',
        name: 'Alpha Tenant',
      },
    };
    authContextState.tenantName = 'Alpha Tenant';
    listManagedTenantsApi.mockResolvedValue({
      items: [
        {
          code: 'tenant.alpha',
          id: 'tenant-1',
          name: 'Alpha Tenant',
          status: 'ACTIVE',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    getManagedOrgTreeApi.mockResolvedValue({
      roots: [
        {
          children: [
            {
              children: [],
              orgUnit: {
                depth: 1,
                id: 'org-dept-1',
                name: 'Manufacturing',
                parentOrgId: 'org-root-1',
                path: '/org-root-1/org-dept-1',
                sortOrder: 10,
                status: 'ACTIVE',
                tenantId: 'tenant-1',
                type: 'DEPARTMENT',
              },
            },
          ],
          orgUnit: {
            depth: 0,
            id: 'org-root-1',
            name: 'Alpha Root',
            organizationParty: {
              canonicalName: 'Alpha Holdings Co.',
              displayName: 'Alpha Holdings',
              id: 'party-root-1',
              status: 'ACTIVE',
              type: 'ORGANIZATION',
            },
            organizationPartyId: 'party-root-1',
            parentOrgId: undefined,
            path: '/org-root-1',
            sortOrder: 0,
            status: 'ACTIVE',
            tenantId: 'tenant-1',
            type: 'ROOT',
          },
        },
      ],
      scope: 'SYSTEM',
      tenant: {
        code: 'tenant.alpha',
        id: 'tenant-1',
        name: 'Alpha Tenant',
        status: 'ACTIVE',
      },
    });
    getManagedOrgUnitByIdApi.mockResolvedValue({
      orgUnit: {
        depth: 1,
        id: 'org-dept-1',
        name: 'Manufacturing',
        organizationParty: {
          canonicalName: 'Acme Manufacturing Ltd.',
          displayName: 'Acme Manufacturing',
          id: 'party-1',
          status: 'ACTIVE',
          type: 'ORGANIZATION',
        },
        organizationPartyId: 'party-1',
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-1',
        sortOrder: 10,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT',
      },
    });
    createManagedOrgUnitApi.mockResolvedValue({
      orgUnit: {
        depth: 1,
        id: 'org-dept-2',
        name: 'Quality',
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-2',
        sortOrder: 20,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT',
      },
    });
    updateManagedOrgUnitApi.mockResolvedValue({
      orgUnit: {
        depth: 1,
        id: 'org-dept-1',
        name: 'Manufacturing Updated',
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-1',
        sortOrder: 11,
        status: 'ACTIVE',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT',
      },
    });
    archiveManagedOrgUnitApi.mockResolvedValue({
      orgUnit: {
        depth: 1,
        id: 'org-dept-1',
        name: 'Manufacturing Updated',
        parentOrgId: 'org-root-1',
        path: '/org-root-1/org-dept-1',
        sortOrder: 11,
        status: 'ARCHIVED',
        tenantId: 'tenant-1',
        type: 'DEPARTMENT',
      },
    });
    useRoute.mockReturnValue({
      meta: {
        orgManagementMode: 'SYSTEM',
      },
    });
    vi.spyOn(message, 'success').mockImplementation(vi.fn());
    vi.spyOn(message, 'error').mockImplementation(vi.fn());
    vi.spyOn(Modal, 'confirm').mockImplementation((options: any) => {
      void options?.onOk?.();
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as any;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders the shared system-admin entry with tenant selector and org-only copy', async () => {
    const view = await import('./org-management.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('平台级组织架构管理');
    expect(wrapper.text()).toContain('这里只管理 org tree / org node');
    expect(wrapper.text()).toContain('不处理 employee');
    expect(wrapper.text()).toContain('不处理 account');
    expect(listManagedTenantsApi).toHaveBeenCalled();
    expect(getManagedOrgTreeApi).toHaveBeenCalledWith('tenant-1');
    expect(wrapper.text()).toContain('Alpha Root');
    expect(wrapper.text()).toContain('Manufacturing');
    expect(wrapper.text()).toContain('Alpha Holdings');
  });

  it('reuses the same page for tenant entry and reads the current tenant without a platform selector', async () => {
    authContextState.isPlatformScope = false;
    useRoute.mockReturnValue({
      meta: {
        orgManagementMode: 'TENANT',
      },
    });
    getManagedOrgTreeApi.mockResolvedValueOnce({
      roots: [],
      scope: 'TENANT',
    });

    const view = await import('./org-management.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('本租户组织架构管理');
    expect(wrapper.text()).not.toContain('指定 Tenant');
    expect(listManagedTenantsApi).not.toHaveBeenCalled();
    expect(getManagedOrgTreeApi).toHaveBeenCalledWith('tenant-1');
  });

  it('creates, updates, and archives org units from the shared detail workspace', async () => {
    const view = await import('./org-management.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    await wrapper.find('[data-testid="org-node-org-dept-1"]').trigger('click');
    await flushPromises();

    expect(getManagedOrgUnitByIdApi).toHaveBeenCalledWith('tenant-1', 'org-dept-1');
    expect(wrapper.text()).toContain('Acme Manufacturing');
    expect(wrapper.text()).toContain('party-1');

    await wrapper.find('[data-testid="org-create-open"]').trigger('click');
    await flushPromises();
    await wrapper.find('input[placeholder="输入组织节点名称"]').setValue('Quality');
    await wrapper.find('[data-testid="org-form-type"]').setValue('DEPARTMENT');
    await wrapper.find('input[placeholder="默认 0，可用于同级排序"]').setValue('20');
    await wrapper.find('[data-testid="org-form-submit"]').trigger('click');
    await flushPromises();

    expect(createManagedOrgUnitApi).toHaveBeenCalledWith('tenant-1', {
      name: 'Quality',
      parentOrgId: 'org-dept-1',
      sortOrder: 20,
      type: 'DEPARTMENT',
    });

    await wrapper.find('[data-testid="org-edit-open"]').trigger('click');
    await flushPromises();
    await wrapper.find('input[placeholder="输入组织节点名称"]').setValue('Manufacturing Updated');
    await wrapper.find('input[placeholder="默认 0，可用于同级排序"]').setValue('11');
    await wrapper.find('[data-testid="org-form-submit"]').trigger('click');
    await flushPromises();

    expect(updateManagedOrgUnitApi).toHaveBeenCalledWith('tenant-1', 'org-dept-1', {
      name: 'Manufacturing Updated',
      sortOrder: 11,
      type: 'DEPARTMENT',
    });

    await wrapper.find('[data-testid="org-archive"]').trigger('click');
    await flushPromises();

    expect(archiveManagedOrgUnitApi).toHaveBeenCalledWith('tenant-1', 'org-dept-1');
  });
});
