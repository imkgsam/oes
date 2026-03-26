import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
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
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace'),
        },
      },
    ],
  },
];

export default routes;
