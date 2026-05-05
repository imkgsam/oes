import type { RouteRecordRaw } from 'vue-router'

const mesRoutes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:factory',
      order: 17,
      title: 'MES'
    },
    name: 'TenantMes',
    path: '/mes',
    children: [
      {
        name: 'TenantMesMoldManagement',
        path: '/mes/mold-management',
        component: () => import('#/views/admin/mes-mold-management.vue'),
        meta: {
          entryKey: 'mes.mold-management',
          fullPathKey: false,
          icon: 'lucide:scan-line',
          title: '模具管理'
        }
      }
    ]
  }
]

export default mesRoutes
