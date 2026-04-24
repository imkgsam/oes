import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const workbenchRoutes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'TenantWorkbench',
    path: '/workbench',
    children: [
      {
        name: 'TenantWorkbenchHome',
        path: '/workbench/home',
        component: () => import('#/views/workbench/index.vue'),
        meta: {
          affixTab: true,
          entryKey: 'workbench.home',
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace'),
        },
      },
      {
        name: 'PlatformAnalyticsHome',
        path: '/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: true,
          entryKey: 'platform.home',
          icon: 'lucide:area-chart',
          title: 'Platform Analytics',
        },
      },
      {
        name: 'PersonalCenter',
        path: '/account/profile',
        component: () => import('#/views/_core/profile/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:user-round',
          title: '个人中心',
        },
      },
      {
        name: 'SelfSecurityCenter',
        path: '/account/security',
        component: () => import('#/views/_core/profile/security-center.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:shield-check',
          title: '账户安全',
        },
      },
      {
        name: 'AdminAuthSessionManagement',
        path: '/admin/auth-session-management',
        component: () => import('#/views/admin/auth-session-management.vue'),
        meta: {
          entryKey: 'admin.auth-session-management',
          icon: 'lucide:shield',
          title: '认证与会话管理',
        },
      },
    ],
  },
];

export { workbenchRoutes };
export default workbenchRoutes;
