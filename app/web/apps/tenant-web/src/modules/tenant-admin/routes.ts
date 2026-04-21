import type { RouteRecordRaw } from 'vue-router';

// Tenant administration exposes platform and tenant governance pages that are backed by explicit BFF visibility entries.
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
];

export { tenantAdminRoutes };
export default tenantAdminRoutes;
