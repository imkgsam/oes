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
      },
      {
        name: 'TenantMesMoldDesignDetail',
        path: '/mes/mold-designs/:moldDesignId',
        component: () => import('#/views/admin/mes-mold-design-detail.vue'),
        meta: {
          activePath: '/mes/mold-management',
          entryKey: 'mes.mold-management',
          hideInMenu: true,
          title: '模具方案详情'
        }
      },
      {
        name: 'TenantMesProductionMoldManagement',
        path: '/mes/production-molds',
        component: () => import('#/views/admin/mes-production-mold-management.vue'),
        meta: {
          activePath: '/mes/mold-management',
          entryKey: 'mes.mold-management',
          hideInMenu: true,
          title: '生产模具管理'
        }
      }
    ]
  }
]

export default mesRoutes
