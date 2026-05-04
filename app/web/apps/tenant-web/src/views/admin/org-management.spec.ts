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

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

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

vi.mock('@vben/common-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vben/common-ui')>();
  return {
    ...actual,
    Page: {
      name: 'Page',
      props: ['title'],
      template: '<div><div v-if="title">{{ title }}</div><slot /></div>',
    },
  };
});

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
              id: 'party-root-1',
              legalName: 'Alpha Holdings Co.',
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
          id: 'party-1',
          legalName: 'Acme Manufacturing Ltd.',
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
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: '',
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    });
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
    expect(wrapper.text()).toContain('Alpha Tenant');
    expect(listManagedTenantsApi).toHaveBeenCalled();
    expect(getManagedOrgTreeApi).toHaveBeenCalledWith('tenant-1');
    expect(wrapper.text()).toContain('Alpha Root');
    expect(wrapper.text()).not.toContain('Alpha Holdings');
    expect(wrapper.text()).not.toContain('OrganizationParty');
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
    expect(listManagedTenantsApi).not.toHaveBeenCalled();
    expect(getManagedOrgTreeApi).toHaveBeenCalledWith('tenant-1');
  });

  it('does not write the selected org node back into the route query on mount', async () => {
    const view = await import('./org-management.vue');

    mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(replace).not.toHaveBeenCalled();
  });

  it('mounts the shared workspace without rewriting the route or skipping org bootstrap', async () => {
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

    expect(wrapper.text()).toContain('组织列表');
    expect(wrapper.text()).toContain('Alpha Tenant');
    expect(wrapper.text()).not.toContain('新建 OrgUnit');
    expect(replace).not.toHaveBeenCalled();
    expect(getManagedOrgTreeApi).toHaveBeenCalledWith('tenant-1');
  });
});
