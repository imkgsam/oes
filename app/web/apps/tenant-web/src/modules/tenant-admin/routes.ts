import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

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
          title: 'MFA 因子配置',
        },
      },
      {
        name: 'AdminPlatformTerminalSecuritySettings',
        path: '/admin/platform-terminal-security',
        component: () => import('#/views/admin/platform-terminal-security-settings.vue'),
        meta: {
          entryKey: 'admin.platform-terminal-security',
          icon: 'lucide:monitor-check',
          title: 'Terminal 登录策略',
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
        name: 'AdminPolicyInstanceManagement',
        path: '/admin/policy-instance-management',
        component: () => import('#/views/admin/policy-instance-management.vue'),
        meta: {
          entryKey: 'admin.policy-instance-management',
          icon: 'lucide:sliders-horizontal',
          title: '资源授权实例',
        },
      },
      {
        name: 'AdminPolicyInstancePreview',
        path: '/admin/policy-instance-preview',
        component: () => import('#/views/admin/policy-instance-preview.vue'),
        meta: {
          entryKey: 'admin.policy-instance-preview',
          icon: 'lucide:scan-search',
          title: '资源授权预览',
        },
      },
      {
        name: 'AdminTerminalDeviceManagement',
        path: '/admin/terminal-device-management',
        component: () => import('#/views/admin/terminal-device-management/index.vue'),
        meta: {
          entryKey: 'admin.terminal-device-management',
          icon: 'lucide:smartphone',
          title: '终端设备管理',
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
      {
        name: 'AdminBrowserActivityAuditWorkbench',
        path: '/admin/browser-activity-audit-workbench',
        component: () => import('#/views/admin/browser-activity-audit-workbench.vue'),
        meta: {
          entryKey: 'browser-activity.audit-workbench',
          icon: 'lucide:history',
          title: '浏览器访问审计',
        },
      },
      {
        name: 'AdminSiteManagement',
        path: '/admin/site-management',
        component: () => import('#/views/admin/site-management.vue'),
        meta: {
          entryKey: 'admin.site-management',
          icon: 'lucide:globe-2',
          title: $t('page.siteManagement.title'),
        },
      },
      {
        name: 'AdminSiteManagementDetail',
        path: '/admin/site-management/:siteId',
        component: () => import('#/views/admin/site-management-detail.vue'),
        meta: {
          activePath: '/admin/site-management',
          entryKey: 'admin.site-management',
          hideInMenu: true,
          title: $t('page.siteManagement.siteDetail'),
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:radio-tower',
      order: 11,
      title: '公开触点',
    },
    name: 'TenantPublicEntry',
    path: '/public-entry',
    children: [
      {
        name: 'AdminBusinessCards',
        path: '/public-entry/business-cards',
        component: () => import('#/views/admin/business-card-management.vue'),
        meta: {
          entryKey: 'public-entry.business-cards',
          icon: 'lucide:contact-round',
          title: '员工数字名片',
        },
      },
      {
        name: 'AdminPublicEntryShortLinks',
        path: '/public-entry/short-links',
        component: () => import('#/views/admin/public-entry-short-link-management.vue'),
        meta: {
          entryKey: 'public-entry.short-links',
          icon: 'lucide:link',
          title: '公开短链',
        },
      },
    ],
  },
  {
    name: 'AdminBusinessCardsLegacyRedirect',
    path: '/admin/business-cards',
    redirect: '/settings/employee-employment/business-cards',
    meta: {
      entryKey: 'tenant-settings.employee-employment',
      hideInMenu: true,
      title: '员工数字名片',
    },
  },
  {
    name: 'AdminPublicEntryShortLinksLegacyRedirect',
    path: '/admin/public-entry-short-links',
    redirect: '/public-entry/short-links',
    meta: {
      hideInMenu: true,
      title: '公开短链',
    },
  },
  {
    name: 'AdminEmployeePerformanceConsoleLegacyRedirect',
    path: '/admin/employee-performance-console',
    redirect: '/crm/employee-performance-console',
    meta: {
      hideInMenu: true,
      title: 'CRM 员工绩效分析',
    },
  },
  {
    name: 'EmployeeBusinessCardSelfView',
    path: '/profile/business-card',
    alias: ['/admin/business-card-self-view', '/admin/business-card-self'],
    component: () => import('#/views/admin/business-card-self-view.vue'),
    meta: {
      hideInMenu: true,
      icon: 'lucide:badge-check',
      title: '我的名片',
    },
  },
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 12,
      title: '租户设置',
    },
    name: 'TenantSettings',
    path: '/settings',
    children: [
      {
        name: 'TenantOrgStructureManagement',
        path: '/settings/org-structure',
        component: () => import('#/views/admin/org-management.vue'),
        meta: {
          entryKey: 'tenant-settings.org-structure',
          icon: 'lucide:network',
          title: '组织架构',
        },
      },
      {
        name: 'TenantOrgUnitDetail',
        path: '/settings/org-structure/:orgUnitId',
        component: () => import('#/views/admin/org-management-detail.vue'),
        meta: {
          activePath: '/settings/org-structure',
          entryKey: 'tenant-settings.org-structure',
          hideInMenu: true,
          title: '部门详情',
        },
      },
      {
        name: 'TenantEmployeeEmploymentManagement',
        path: '/settings/employee-employment',
        component: () => import('#/views/admin/employee-management.vue'),
        meta: {
          entryKey: 'tenant-settings.employee-employment',
          icon: 'lucide:id-card',
          title: '员工管理',
        },
      },
      {
        name: 'TenantEmployeeBusinessCards',
        path: '/settings/employee-employment/business-cards',
        component: () => import('#/views/admin/business-card-management.vue'),
        meta: {
          activePath: '/settings/employee-employment',
          entryKey: 'tenant-settings.employee-employment',
          hideInMenu: true,
          icon: 'lucide:contact-round',
          title: '员工数字名片',
        },
      },
      {
        name: 'TenantEmployeeDetail',
        path: '/settings/employee-employment/:employeeId',
        component: () => import('#/views/admin/employee-management-detail.vue'),
        meta: {
          activePath: '/settings/employee-employment',
          entryKey: 'tenant-settings.employee-employment',
          hideInMenu: true,
          title: '员工详情',
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
      {
        name: 'TenantTerminalMfaSettings',
        path: '/settings/terminal-mfa',
        component: () => import('#/views/admin/terminal-mfa-settings.vue'),
        meta: {
          entryKey: 'tenant-settings.terminal-mfa',
          icon: 'lucide:shield-check',
          title: '终端 MFA 配置',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:handshake',
      order: 12,
      title: 'CRM',
    },
    name: 'TenantCrm',
    path: '/crm',
    children: [
      {
        name: 'TenantCrmAccounts',
        path: '/crm/accounts',
        component: () => import('#/views/admin/customer-management.vue'),
        meta: {
          entryKey: 'crm.accounts',
          fullPathKey: false,
          icon: 'lucide:users-round',
          title: '客户资源',
        },
      },
      {
        name: 'TenantCrmPool',
        path: '/crm/pool',
        component: () => import('#/views/admin/crm-pool-management.vue'),
        meta: {
          entryKey: 'crm.pool',
          fullPathKey: false,
          icon: 'lucide:radar',
          title: '公海',
        },
      },
      {
        name: 'AdminEmployeePerformanceConsole',
        path: '/crm/employee-performance-console',
        component: () => import('#/views/admin/employee-performance-console.vue'),
        meta: {
          entryKey: 'admin.employee-performance-console',
          icon: 'lucide:chart-no-axes-combined',
          title: 'CRM 员工绩效分析',
        },
      },
      {
        name: 'TenantCrmAccountDetail',
        path: '/crm/accounts/:crmAccountId',
        component: () => import('#/views/admin/customer-management-detail.vue'),
        meta: {
          activePath: '/crm/accounts',
          entryKey: 'crm.accounts',
          hideInMenu: true,
          title: '客户资源详情',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:boxes',
      order: 13,
      title: '主数据',
    },
    name: 'TenantMasterData',
    path: '/master-data',
    children: [
      {
        name: 'TenantItemManagement',
        path: '/master-data/items',
        component: () => import('#/views/admin/item-management.vue'),
        meta: {
          entryKey: 'master-data.item-management',
          fullPathKey: false,
          icon: 'lucide:package-2',
          title: 'ItemModel 管理',
        },
      },
      {
        name: 'TenantItemCategoryManagement',
        path: '/master-data/item-categories',
        component: () => import('#/views/admin/item-category-management.vue'),
        meta: {
          entryKey: 'master-data.item-category-management',
          fullPathKey: false,
          icon: 'lucide:folder-tree',
          title: '产品分类管理',
        },
      },
      {
        name: 'TenantItemAttributeManagement',
        path: '/master-data/item-attributes',
        component: () => import('#/views/admin/item-attribute-management.vue'),
        meta: {
          entryKey: 'master-data.item-attribute-management',
          fullPathKey: false,
          icon: 'lucide:sliders-horizontal',
          title: '产品属性管理',
        },
      },
      {
        name: 'TenantItemAttributeDetail',
        path: '/master-data/item-attributes/:attributeDefinitionId',
        component: () => import('#/views/admin/item-attribute-detail.vue'),
        meta: {
          activePath: '/master-data/item-attributes',
          entryKey: 'master-data.item-attribute-management',
          hideInMenu: true,
          title: '属性详情',
        },
      },
      {
        name: 'TenantItemPackagingManagement',
        path: '/master-data/item-packaging',
        component: () => import('#/views/admin/item-packaging-management.vue'),
        meta: {
          entryKey: 'master-data.item-packaging-management',
          fullPathKey: false,
          icon: 'lucide:package-check',
          title: '包装管理',
        },
      },
      {
        name: 'TenantItemBomManagement',
        path: '/master-data/item-boms',
        component: () => import('#/views/admin/item-bom-management.vue'),
        meta: {
          entryKey: 'master-data.item-bom-management',
          fullPathKey: false,
          icon: 'lucide:workflow',
          title: 'Item BOM 管理',
        },
      },
      {
        name: 'TenantCustomerManagement',
        path: '/master-data/customers',
        redirect: '/crm/accounts',
        meta: {
          activePath: '/crm/accounts',
          entryKey: 'crm.accounts',
          hideInMenu: true,
          title: '客户资源',
        },
      },
      {
        name: 'TenantSupplierManagement',
        path: '/master-data/suppliers',
        component: () => import('#/views/admin/supplier-management.vue'),
        meta: {
          entryKey: 'master-data.supplier-management',
          fullPathKey: false,
          icon: 'lucide:truck',
          title: '供应商管理',
        },
      },
      {
        name: 'TenantSupplierManagementCreate',
        path: '/master-data/suppliers/create',
        component: () => import('#/views/admin/supplier-management-create.vue'),
        meta: {
          activePath: '/master-data/suppliers',
          entryKey: 'master-data.supplier-management',
          hideInMenu: true,
          title: '创建供应商',
        },
      },
      {
        name: 'TenantSupplierManagementDetail',
        path: '/master-data/suppliers/:supplierId',
        component: () => import('#/views/admin/supplier-management-detail.vue'),
        meta: {
          activePath: '/master-data/suppliers',
          entryKey: 'master-data.supplier-management',
          hideInMenu: true,
          title: '供应商详情',
        },
      },
      {
        name: 'TenantItemManagementCreate',
        path: '/master-data/items/create',
        component: () => import('#/views/admin/item-management-create.vue'),
        meta: {
          activePath: '/master-data/items',
          entryKey: 'master-data.item-management',
          hideInMenu: true,
          title: '创建 Item',
        },
      },
      {
        name: 'TenantItemModelCreate',
        path: '/master-data/item-models/create',
        component: () => import('#/views/admin/item-model-create.vue'),
        meta: {
          activePath: '/master-data/items',
          entryKey: 'master-data.item-management',
          hideInMenu: true,
          title: '创建 ItemModel',
        },
      },
      {
        name: 'TenantItemModelDetail',
        path: '/master-data/item-models/:itemModelId',
        component: () => import('#/views/admin/item-model-detail.vue'),
        meta: {
          activePath: '/master-data/items',
          entryKey: 'master-data.item-management',
          hideInMenu: true,
          title: 'ItemModel 详情',
        },
      },
      {
        name: 'TenantItemManagementDetail',
        path: '/master-data/items/:itemId',
        component: () => import('#/views/admin/item-management-detail.vue'),
        meta: {
          activePath: '/master-data/items',
          entryKey: 'master-data.item-management',
          hideInMenu: true,
          title: 'Item 详情',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:badge-dollar-sign',
      order: 13,
      title: '销售',
    },
    name: 'TenantSales',
    path: '/sales',
    children: [
      {
        name: 'TenantSalesQuoteOrderWorkspace',
        path: '/sales/quote-orders',
        component: () => import('#/views/admin/sales-quote-order-workspace.vue'),
        meta: {
          entryKey: 'sales.quote-orders',
          icon: 'lucide:file-spreadsheet',
          title: '报价与订单',
        },
      },
      {
        name: 'TenantSalesQuoteCreate',
        path: '/sales/quote-orders/create',
        component: () => import('#/views/admin/sales-quote-create.vue'),
        meta: {
          activePath: '/sales/quote-orders',
          entryKey: 'sales.quote-orders',
          hideInMenu: true,
          title: '创建报价',
        },
      },
      {
        name: 'TenantSalesQuoteDetail',
        path: '/sales/quote-orders/quotes/:quoteId',
        component: () => import('#/views/admin/sales-quote-detail.vue'),
        meta: {
          activePath: '/sales/quote-orders',
          entryKey: 'sales.quote-orders',
          hideInMenu: true,
          title: '报价详情',
        },
      },
      {
        name: 'TenantSalesOrderDetail',
        path: '/sales/quote-orders/orders/:salesOrderId',
        component: () => import('#/views/admin/sales-order-detail.vue'),
        meta: {
          activePath: '/sales/quote-orders',
          entryKey: 'sales.quote-orders',
          hideInMenu: true,
          title: '订单详情',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:shopping-cart',
      order: 14,
      title: '采购管理',
    },
    name: 'TenantProcurement',
    path: '/procurement',
    children: [
      {
        name: 'TenantPurchaseRequestWorkspace',
        path: '/procurement/purchase-requests',
        component: () => import('#/views/admin/procurement-management.vue'),
        meta: {
          entryKey: 'procurement.management',
          fullPathKey: false,
          icon: 'lucide:file-text',
          title: '采购管理',
        },
      },
      {
        name: 'TenantPurchaseOrderWorkspace',
        path: '/procurement/purchase-orders',
        component: () => import('#/views/admin/procurement-management.vue'),
        meta: {
          activePath: '/procurement/purchase-requests',
          entryKey: 'procurement.management',
          hideInMenu: true,
          title: '采购订单',
        },
      },
      {
        name: 'TenantReceivingExpectationWorkspace',
        path: '/procurement/receiving-expectations',
        component: () => import('#/views/admin/procurement-management.vue'),
        meta: {
          activePath: '/procurement/purchase-requests',
          entryKey: 'procurement.management',
          hideInMenu: true,
          title: '收货预期',
        },
      },
      {
        name: 'TenantPurchaseRequestCreate',
        path: '/procurement/purchase-requests/create',
        component: () => import('#/views/admin/purchase-request-create.vue'),
        meta: {
          activePath: '/procurement/purchase-requests',
          entryKey: 'procurement.management',
          hideInMenu: true,
          title: '创建采购申请',
        },
      },
      {
        name: 'TenantPurchaseRequestDetail',
        path: '/procurement/purchase-requests/:purchaseRequestId',
        component: () => import('#/views/admin/purchase-request-detail.vue'),
        meta: {
          activePath: '/procurement/purchase-requests',
          entryKey: 'procurement.management',
          hideInMenu: true,
          title: '采购申请详情',
        },
      },
      {
        name: 'TenantPurchaseOrderDetail',
        path: '/procurement/purchase-orders/:purchaseOrderId',
        component: () => import('#/views/admin/purchase-order-detail.vue'),
        meta: {
          activePath: '/procurement/purchase-orders',
          entryKey: 'procurement.management',
          hideInMenu: true,
          title: '采购订单详情',
        },
      },
      {
        name: 'TenantReceivingExpectationDetail',
        path: '/procurement/receiving-expectations/:receivingExpectationId',
        component: () => import('#/views/admin/receiving-expectation-detail.vue'),
        meta: {
          activePath: '/procurement/receiving-expectations',
          entryKey: 'procurement.management',
          hideInMenu: true,
          title: '收货预期详情',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:wallet-cards',
      order: 15,
      title: 'WMS 管理',
    },
    name: 'TenantWms',
    path: '/wms',
    children: [
      {
        name: 'TenantWmsWorkspace',
        path: '/wms/receipts',
        component: () => import('#/views/admin/wms-management.vue'),
        meta: {
          entryKey: 'wms.management',
          fullPathKey: false,
          icon: 'lucide:warehouse',
          title: 'WMS 管理',
        },
      },
      {
        name: 'TenantWmsReceiptCreate',
        path: '/wms/receipts/create',
        component: () => import('#/views/admin/wms-receipt-create.vue'),
        meta: {
          activePath: '/wms/receipts',
          entryKey: 'wms.management',
          hideInMenu: true,
          title: '创建收货草稿',
        },
      },
      {
        name: 'TenantWmsReceiptDetail',
        path: '/wms/receipts/:receiptId',
        component: () => import('#/views/admin/wms-receipt-detail.vue'),
        meta: {
          activePath: '/wms/receipts',
          entryKey: 'wms.management',
          hideInMenu: true,
          title: '收货详情',
        },
      },
    ],
  },
  {
    meta: {
      icon: 'lucide:wallet-cards',
      order: 16,
      title: '财务管理',
    },
    name: 'TenantFinance',
    path: '/finance',
    children: [
      {
        name: 'TenantFinanceDashboard',
        path: '/finance/dashboard',
        component: () => import('#/views/admin/finance-management.vue'),
        meta: {
          entryKey: 'finance.dashboard',
          fullPathKey: false,
          icon: 'lucide:wallet',
          title: '财务管理',
        },
      },
      {
        name: 'TenantFinancialAccountDetail',
        path: '/finance/accounts/:financialAccountId',
        component: () => import('#/views/admin/finance-account-detail.vue'),
        meta: {
          activePath: '/finance/dashboard',
          entryKey: 'finance.dashboard',
          hideInMenu: true,
          title: '资金账户详情',
        },
      },
      {
        name: 'TenantReceivableScheduleDetail',
        path: '/finance/receivables/:receivableScheduleId',
        component: () => import('#/views/admin/finance-receivable-schedule-detail.vue'),
        meta: {
          activePath: '/finance/dashboard',
          entryKey: 'finance.dashboard',
          hideInMenu: true,
          title: '应收计划详情',
        },
      },
    ],
  },
];

export { tenantAdminRoutes };
export default tenantAdminRoutes;
