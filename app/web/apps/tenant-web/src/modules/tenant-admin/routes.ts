import type { RouteRecordRaw } from 'vue-router';

// Tenant administration exposes platform and tenant governance pages that are backed by explicit BFF visibility entries.
const ORGANIZATION_PEOPLE_PAGE_KEY = 'tenant-settings.organization-people';

const tenantAdminRoutes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 10,
      title: '权限治理',
    },
    name: 'TenantAdminGovernance',
    path: '/admin',
    children: [
      {
        name: 'AdminTenantManagement',
        path: '/admin/tenant-management',
        component: () => import('#/views/admin/tenant-management.vue'),
        meta: {
          entryKey: 'admin.tenant-management',
          icon: 'lucide:building-2',
          title: '租户管理',
        },
      },
      {
        name: 'AdminOrgManagement',
        path: '/admin/org-management',
        component: () => import('#/views/admin/org-management.vue'),
        meta: {
          entryKey: 'admin.org-management',
          fullPathKey: false,
          icon: 'lucide:git-branch-plus',
          orgManagementMode: 'SYSTEM',
          title: '组织架构管理',
        },
      },
      {
        name: 'AdminRoleManagement',
        path: '/admin/role-management',
        component: () => import('#/views/admin/role-management.vue'),
        meta: {
          entryKey: 'admin.role-management',
          icon: 'lucide:shield-user',
          title: '角色管理',
        },
      },
      {
        name: 'AdminAccountManagement',
        path: '/admin/account-management',
        component: () => import('#/views/admin/account-management.vue'),
        meta: {
          entryKey: 'admin.account-management',
          icon: 'lucide:users',
          title: '账号管理',
        },
      },
      {
        name: 'AdminPlatformMfaSettings',
        path: '/admin/platform-mfa',
        component: () => import('#/views/admin/platform-mfa-settings.vue'),
        meta: {
          entryKey: 'admin.platform-mfa',
          icon: 'lucide:shield-check',
          title: '平台 MFA 配置',
        },
      },
      {
        name: 'AdminPermissionManagement',
        path: '/admin/permission-management',
        component: () => import('#/views/admin/permission-management.vue'),
        meta: {
          entryKey: 'admin.permission-management',
          icon: 'lucide:key-round',
          title: '权限管理',
        },
      },
      {
        name: 'AdminPolicyGovernance',
        path: '/admin/policy-governance',
        component: () => import('#/views/admin/policy-governance.vue'),
        meta: {
          entryKey: 'admin.policy-governance',
          icon: 'lucide:scale',
          title: '策略治理',
        },
      },
      {
        name: 'AdminNavigationManagement',
        path: '/admin/navigation-management',
        component: () => import('#/views/admin/navigation-management.vue'),
        meta: {
          entryKey: 'admin.navigation-management',
          icon: 'lucide:map',
          title: '导航管理',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 11,
      title: '租户设置',
    },
    name: 'TenantSettings',
    path: '/settings',
    children: [
      {
        name: 'TenantOrganizationPeople',
        path: '/settings/organization-people',
        component: () => import('#/views/admin/organization-people.vue'),
        meta: {
          entryKey: ORGANIZATION_PEOPLE_PAGE_KEY,
          fullPathKey: false,
          icon: 'lucide:users-round',
          title: '组织与人员',
        },
      },
      {
        name: 'TenantOrganizationPeopleMembers',
        path: '/settings/organization-people/members',
        redirect: (to) => ({
          name: 'TenantOrganizationPeople',
          query: {
            ...to.query,
            pageKey: ORGANIZATION_PEOPLE_PAGE_KEY,
            tab: 'members',
          },
        }),
        meta: {
          activePath: '/settings/organization-people',
          entryKey: ORGANIZATION_PEOPLE_PAGE_KEY,
          hideInMenu: true,
          title: '组织与人员',
        },
      },
      {
        name: 'TenantOrganizationPeopleDepartments',
        path: '/settings/organization-people/departments',
        redirect: (to) => ({
          name: 'TenantOrganizationPeople',
          query: {
            ...to.query,
            pageKey: ORGANIZATION_PEOPLE_PAGE_KEY,
            tab: 'departments',
          },
        }),
        meta: {
          activePath: '/settings/organization-people',
          entryKey: ORGANIZATION_PEOPLE_PAGE_KEY,
          hideInMenu: true,
          title: '组织与人员',
        },
      },
      {
        name: 'TenantOrgStructureManagement',
        path: '/settings/org-structure',
        redirect: (to) => ({
          name: 'TenantOrganizationPeople',
          query: {
            ...to.query,
            pageKey: ORGANIZATION_PEOPLE_PAGE_KEY,
            tab: 'departments',
          },
        }),
        meta: {
          entryKey: 'tenant-settings.org-structure',
          hideInMenu: true,
          icon: 'lucide:network',
          title: '本租户组织架构',
        },
      },
      {
        name: 'TenantEmployeeEmploymentManagement',
        path: '/settings/employee-employment',
        redirect: (to) => ({
          name: 'TenantOrganizationPeople',
          query: {
            ...to.query,
            pageKey: ORGANIZATION_PEOPLE_PAGE_KEY,
            tab: 'members',
          },
        }),
        meta: {
          entryKey: 'tenant-settings.employee-employment',
          hideInMenu: true,
          icon: 'lucide:badge-id-card',
          title: '员工与任职管理',
        },
      },
      {
        name: 'TenantMfaSettings',
        path: '/settings/tenant-mfa',
        alias: '/settings/login-mfa',
        component: () => import('#/views/admin/login-mfa-settings.vue'),
        meta: {
          entryKey: 'tenant-settings.login-mfa',
          icon: 'lucide:shield-check',
          title: '租户 MFA 配置',
        },
      },
    ],
  },
];

export { tenantAdminRoutes };
export default tenantAdminRoutes;
