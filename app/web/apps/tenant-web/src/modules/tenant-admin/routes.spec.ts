import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import tenantAdminRoutes from './routes'

vi.mock('#/locales', () => ({
  $t: (key: string) => ({
    'page.siteManagement.siteDetail': '站点详情',
    'page.siteManagement.title': '站点管理'
  }[key] ?? key)
}))

describe('tenant admin routes', () => {
  it('does not register a standalone collaboration task page because workbench owns the Task UI', () => {
    const collaborationRoute = tenantAdminRoutes.find((route) => route.name === 'TenantCollaboration')

    expect(collaborationRoute).toBeUndefined()
  })

  it('keeps the system org-management workbench on one stable tab key even when orgUnitId query changes', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const orgManagementRoute = governanceRoute?.children?.find(
      (route) => route.name === 'AdminOrgManagement'
    )

    expect(orgManagementRoute?.meta?.entryKey).toBe('admin.org-management')
    expect(orgManagementRoute?.meta?.fullPathKey).toBe(false)
  })

  it('registers managed terminal device governance under the tenant admin section', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const terminalDeviceRoute = governanceRoute?.children?.find(
      (route) => route.name === 'AdminTerminalDeviceManagement'
    )

    expect(terminalDeviceRoute?.path).toBe('/admin/terminal-device-management')
    expect(terminalDeviceRoute?.meta?.entryKey).toBe('admin.terminal-device-management')
    expect(terminalDeviceRoute?.component).toBeTypeOf('function')
  })

  it('registers public-entry management pages under the dedicated public touchpoint section', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const publicEntryRoute = tenantAdminRoutes.find((route) => route.name === 'TenantPublicEntry')
    const shortLinkRoute = publicEntryRoute?.children?.find(
      (route) => route.name === 'AdminPublicEntryShortLinks'
    )
    const businessCardAdminRoute = publicEntryRoute?.children?.find(
      (route) => route.name === 'AdminBusinessCards'
    )

    expect(governanceRoute?.children?.some((route) => route.name === 'AdminPublicEntryShortLinks')).toBe(false)
    expect(governanceRoute?.children?.some((route) => route.name === 'AdminBusinessCards')).toBe(false)
    expect(publicEntryRoute?.path).toBe('/public-entry')
    expect(publicEntryRoute?.meta?.title).toBe('公开触点')
    expect(publicEntryRoute?.meta?.icon).toBe('lucide:radio-tower')
    expect(shortLinkRoute?.path).toBe('/public-entry/short-links')
    expect(shortLinkRoute?.alias).toBeUndefined()
    expect(shortLinkRoute?.meta?.entryKey).toBe('public-entry.short-links')
    expect(shortLinkRoute?.meta?.title).toBe('公开短链')
    expect(shortLinkRoute?.meta?.icon).toBe('lucide:link')
    expect(shortLinkRoute?.component).toBeTypeOf('function')
    expect(businessCardAdminRoute?.path).toBe('/public-entry/business-cards')
    expect(businessCardAdminRoute?.alias).toBeUndefined()
    expect(businessCardAdminRoute?.meta?.entryKey).toBe('public-entry.business-cards')
    expect(businessCardAdminRoute?.meta?.title).toBe('员工数字名片')
    expect(businessCardAdminRoute?.meta?.icon).toBe('lucide:contact-round')
    expect(businessCardAdminRoute?.component).toBeTypeOf('function')
  })

  it('also exposes BusinessCard management as an employee-management nested route', () => {
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const employeeBusinessCardRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantEmployeeBusinessCards'
    )

    expect(employeeBusinessCardRoute?.path).toBe('/settings/employee-employment/business-cards')
    expect(employeeBusinessCardRoute?.meta?.entryKey).toBe('tenant-settings.employee-employment')
    expect(employeeBusinessCardRoute?.meta?.activePath).toBe('/settings/employee-employment')
    expect(employeeBusinessCardRoute?.meta?.hideInMenu).toBe(true)
    expect(employeeBusinessCardRoute?.meta?.title).toBe('员工数字名片')
    expect(employeeBusinessCardRoute?.component).toBeTypeOf('function')
  })

  it('keeps legacy public-entry admin paths as hidden redirects to canonical routes', async () => {
    const businessCardLegacyRoute = tenantAdminRoutes.find(
      (route) => route.name === 'AdminBusinessCardsLegacyRedirect'
    )
    const shortLinkLegacyRoute = tenantAdminRoutes.find(
      (route) => route.name === 'AdminPublicEntryShortLinksLegacyRedirect'
    )
    const router = createRouter({
      history: createMemoryHistory(),
      routes: tenantAdminRoutes
    })

    expect(businessCardLegacyRoute?.redirect).toBe('/settings/employee-employment/business-cards')
    expect(businessCardLegacyRoute?.meta?.entryKey).toBe('tenant-settings.employee-employment')
    expect(businessCardLegacyRoute?.meta?.hideInMenu).toBe(true)
    expect(shortLinkLegacyRoute?.redirect).toBe('/public-entry/short-links')
    expect(shortLinkLegacyRoute?.meta?.hideInMenu).toBe(true)
    expect(router.resolve('/admin/business-cards').matched.at(-1)?.name).toBe(
      'AdminBusinessCardsLegacyRedirect'
    )
    expect(router.resolve('/admin/public-entry-short-links').matched.at(-1)?.name).toBe(
      'AdminPublicEntryShortLinksLegacyRedirect'
    )
    expect(router.resolve('/settings/employee-employment/business-cards').matched.at(-1)?.name).toBe(
      'TenantEmployeeBusinessCards'
    )
    expect(router.resolve('/public-entry/business-cards').matched.at(-1)?.name).toBe('AdminBusinessCards')
    expect(router.resolve('/public-entry/short-links').matched.at(-1)?.name).toBe(
      'AdminPublicEntryShortLinks'
    )
  })

  it('keeps employee BusinessCard self-view as a hidden authenticated self-service route', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const publicEntryRoute = tenantAdminRoutes.find((route) => route.name === 'TenantPublicEntry')
    const businessCardSelfRoute = tenantAdminRoutes.find(
      (route) => route.name === 'EmployeeBusinessCardSelfView'
    )

    expect(governanceRoute?.children?.some((route) => route.name === 'EmployeeBusinessCardSelfView')).toBe(false)
    expect(publicEntryRoute?.children?.some((route) => route.name === 'EmployeeBusinessCardSelfView')).toBe(false)
    expect(businessCardSelfRoute?.path).toBe('/profile/business-card')
    expect(businessCardSelfRoute?.alias).toEqual([
      '/admin/business-card-self-view',
      '/admin/business-card-self'
    ])
    expect(businessCardSelfRoute?.meta?.entryKey).toBeUndefined()
    expect(businessCardSelfRoute?.meta?.ignoreAccess).not.toBe(true)
    expect(businessCardSelfRoute?.meta?.hideInMenu).toBe(true)
    expect(businessCardSelfRoute?.meta?.title).toBe('我的名片')
    expect(businessCardSelfRoute?.component).toBeTypeOf('function')
  })

  it('registers Site Management under tenant admin governance', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const siteRoute = governanceRoute?.children?.find((route) => route.name === 'AdminSiteManagement')
    const siteDetailRoute = governanceRoute?.children?.find((route) => route.name === 'AdminSiteManagementDetail')

    expect(siteRoute?.path).toBe('/admin/site-management')
    expect(siteRoute?.meta?.entryKey).toBe('admin.site-management')
    expect(siteRoute?.meta?.icon).toBe('lucide:globe-2')
    expect(siteRoute?.meta?.title).toBe('站点管理')
    expect(siteRoute?.component).toBeTypeOf('function')
    expect(siteDetailRoute?.path).toBe('/admin/site-management/:siteId')
    expect(siteDetailRoute?.meta?.activePath).toBe('/admin/site-management')
    expect(siteDetailRoute?.meta?.entryKey).toBe('admin.site-management')
    expect(siteDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(siteDetailRoute?.meta?.title).toBe('站点详情')
    expect(siteDetailRoute?.component).toBeTypeOf('function')
  })

  it('registers terminal-aware account security settings without reusing managed device routes', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const platformTerminalSecurityRoute = governanceRoute?.children?.find(
      (route) => route.name === 'AdminPlatformTerminalSecuritySettings'
    )
    const tenantTerminalMfaRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantTerminalMfaSettings'
    )

    expect(platformTerminalSecurityRoute?.path).toBe('/admin/platform-terminal-security')
    expect(platformTerminalSecurityRoute?.meta?.entryKey).toBe(
      'admin.platform-terminal-security'
    )
    expect(platformTerminalSecurityRoute?.component).toBeTypeOf('function')
    expect(tenantTerminalMfaRoute?.path).toBe('/settings/terminal-mfa')
    expect(tenantTerminalMfaRoute?.meta?.entryKey).toBe('tenant-settings.terminal-mfa')
    expect(tenantTerminalMfaRoute?.component).toBeTypeOf('function')
  })

  it('removes the legacy organization-people routes after splitting org and employee settings pages', () => {
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const organizationPeopleRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrganizationPeople'
    )
    const membersRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrganizationPeopleMembers'
    )
    const departmentsRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrganizationPeopleDepartments'
    )

    expect(organizationPeopleRoute).toBeUndefined()
    expect(membersRoute).toBeUndefined()
    expect(departmentsRoute).toBeUndefined()
  })

  it('binds the split organization and employee pages to their dedicated entry keys', () => {
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const legacyEmployeeRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantEmployeeEmploymentManagement'
    )
    const legacyOrgRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrgStructureManagement'
    )

    expect(legacyOrgRoute?.meta?.entryKey).toBe('tenant-settings.org-structure')
    expect(legacyOrgRoute?.component).toBeTypeOf('function')
    expect(legacyOrgRoute?.meta?.hideInMenu).toBeUndefined()
    expect(legacyOrgRoute?.meta?.title).toBe('组织架构')
    expect(legacyEmployeeRoute?.meta?.entryKey).toBe(
      'tenant-settings.employee-employment'
    )
    expect(legacyEmployeeRoute?.meta?.icon).toBe('lucide:id-card')
    expect(legacyEmployeeRoute?.component).toBeTypeOf('function')
    expect(legacyEmployeeRoute?.meta?.hideInMenu).toBeUndefined()
    expect(legacyEmployeeRoute?.meta?.title).toBe('员工管理')
  })

  it('adds hidden department and employee detail routes under the split settings pages', () => {
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const orgDetailRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrgUnitDetail'
    )
    const employeeDetailRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantEmployeeDetail'
    )

    expect(orgDetailRoute?.path).toBe('/settings/org-structure/:orgUnitId')
    expect(orgDetailRoute?.meta?.entryKey).toBe('tenant-settings.org-structure')
    expect(orgDetailRoute?.meta?.activePath).toBe('/settings/org-structure')
    expect(orgDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(employeeDetailRoute?.path).toBe('/settings/employee-employment/:employeeId')
    expect(employeeDetailRoute?.meta?.entryKey).toBe('tenant-settings.employee-employment')
    expect(employeeDetailRoute?.meta?.activePath).toBe('/settings/employee-employment')
    expect(employeeDetailRoute?.meta?.hideInMenu).toBe(true)
  })

  it('binds item list, category, attribute, create, and detail routes to dedicated master-data entries', () => {
    const masterDataRoute = tenantAdminRoutes.find((route) => route.name === 'TenantMasterData')
    const itemListRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemManagement'
    )
    const itemCategoryRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemCategoryManagement'
    )
    const itemAttributeRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemAttributeManagement'
    )
    const itemAttributeDetailRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemAttributeDetail'
    )
    const itemPackagingRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemPackagingManagement'
    )
    const itemBomRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemBomManagement'
    )
    const itemCreateRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemManagementCreate'
    )
    const itemModelCreateRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemModelCreate'
    )
    const itemModelDetailRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemModelDetail'
    )
    const itemDetailRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemManagementDetail'
    )

    expect(itemListRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemListRoute?.path).toBe('/master-data/items')
    expect(itemCategoryRoute?.meta?.entryKey).toBe('master-data.item-category-management')
    expect(itemCategoryRoute?.path).toBe('/master-data/item-categories')
    expect(itemCategoryRoute?.meta?.hideInMenu).toBeUndefined()
    expect(itemCategoryRoute?.meta?.title).toBe('产品分类管理')
    expect(itemAttributeRoute?.meta?.entryKey).toBe('master-data.item-attribute-management')
    expect(itemAttributeRoute?.path).toBe('/master-data/item-attributes')
    expect(itemAttributeRoute?.meta?.hideInMenu).toBeUndefined()
    expect(itemAttributeRoute?.meta?.title).toBe('产品属性管理')
    expect(itemAttributeDetailRoute?.path).toBe('/master-data/item-attributes/:attributeDefinitionId')
    expect(itemAttributeDetailRoute?.meta?.entryKey).toBe('master-data.item-attribute-management')
    expect(itemAttributeDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(itemAttributeDetailRoute?.meta?.activePath).toBe('/master-data/item-attributes')
    expect(itemPackagingRoute?.meta?.entryKey).toBe('master-data.item-packaging-management')
    expect(itemPackagingRoute?.path).toBe('/master-data/item-packaging')
    expect(itemPackagingRoute?.meta?.hideInMenu).toBeUndefined()
    expect(itemPackagingRoute?.meta?.title).toBe('包装管理')
    expect(itemBomRoute?.meta?.entryKey).toBe('master-data.item-bom-management')
    expect(itemBomRoute?.path).toBe('/master-data/item-boms')
    expect(itemBomRoute?.meta?.hideInMenu).toBeUndefined()
    expect(itemBomRoute?.meta?.title).toBe('Item BOM 管理')
    expect(itemCreateRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemCreateRoute?.meta?.hideInMenu).toBe(true)
    expect(itemCreateRoute?.meta?.activePath).toBe('/master-data/items')
    expect(itemModelCreateRoute?.path).toBe('/master-data/item-models/create')
    expect(itemModelCreateRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemModelCreateRoute?.meta?.hideInMenu).toBe(true)
    expect(itemModelCreateRoute?.meta?.activePath).toBe('/master-data/items')
    expect(itemModelCreateRoute?.meta?.title).toBe('创建 ItemModel')
    expect(itemModelDetailRoute?.path).toBe('/master-data/item-models/:itemModelId')
    expect(itemModelDetailRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemModelDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(itemModelDetailRoute?.meta?.activePath).toBe('/master-data/items')
    expect(itemDetailRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(itemDetailRoute?.meta?.activePath).toBe('/master-data/items')
  })

  it('binds the CRM P1 customer workspace to the dedicated master-data customer entry', () => {
    const masterDataRoute = tenantAdminRoutes.find((route) => route.name === 'TenantMasterData')
    const customerListRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantCustomerManagement'
    )

    expect(customerListRoute?.meta?.entryKey).toBe('master-data.customer-management')
    expect(customerListRoute?.path).toBe('/master-data/customers')
    expect(
      masterDataRoute?.children?.some((route) => route.name === 'TenantCustomerManagementCreate')
    ).toBe(false)
    expect(
      masterDataRoute?.children?.some((route) => route.name === 'TenantCustomerManagementDetail')
    ).toBe(false)
  })

  it('binds supplier list, create, and detail routes to the dedicated master-data supplier entry', () => {
    const masterDataRoute = tenantAdminRoutes.find((route) => route.name === 'TenantMasterData')
    const supplierListRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantSupplierManagement'
    )
    const supplierCreateRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantSupplierManagementCreate'
    )
    const supplierDetailRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantSupplierManagementDetail'
    )

    expect(supplierListRoute?.meta?.entryKey).toBe('master-data.supplier-management')
    expect(supplierListRoute?.path).toBe('/master-data/suppliers')
    expect(supplierCreateRoute?.meta?.entryKey).toBe('master-data.supplier-management')
    expect(supplierCreateRoute?.meta?.hideInMenu).toBe(true)
    expect(supplierCreateRoute?.meta?.activePath).toBe('/master-data/suppliers')
    expect(supplierDetailRoute?.meta?.entryKey).toBe('master-data.supplier-management')
    expect(supplierDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(supplierDetailRoute?.meta?.activePath).toBe('/master-data/suppliers')
  })

  it('adds the sales quote-order workspace with dedicated create, quote detail, and order detail routes', () => {
    const salesRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSales')
    const workspaceRoute = salesRoute?.children?.find(
      (route) => route.name === 'TenantSalesQuoteOrderWorkspace'
    )
    const quoteCreateRoute = salesRoute?.children?.find(
      (route) => route.name === 'TenantSalesQuoteCreate'
    )
    const quoteDetailRoute = salesRoute?.children?.find(
      (route) => route.name === 'TenantSalesQuoteDetail'
    )
    const orderDetailRoute = salesRoute?.children?.find(
      (route) => route.name === 'TenantSalesOrderDetail'
    )

    expect(salesRoute?.meta?.title).toBe('销售')
    expect(workspaceRoute?.path).toBe('/sales/quote-orders')
    expect(workspaceRoute?.meta?.entryKey).toBe('sales.quote-orders')
    expect(workspaceRoute?.meta?.title).toBe('报价与订单')
    expect(quoteCreateRoute?.meta?.entryKey).toBe('sales.quote-orders')
    expect(quoteCreateRoute?.meta?.hideInMenu).toBe(true)
    expect(quoteCreateRoute?.meta?.activePath).toBe('/sales/quote-orders')
    expect(quoteDetailRoute?.meta?.entryKey).toBe('sales.quote-orders')
    expect(quoteDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(quoteDetailRoute?.meta?.activePath).toBe('/sales/quote-orders')
    expect(orderDetailRoute?.meta?.entryKey).toBe('sales.quote-orders')
    expect(orderDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(orderDetailRoute?.meta?.activePath).toBe('/sales/quote-orders')
  })

  it('adds the procurement workspace with dedicated PR, PO, and receiving detail routes', () => {
    const procurementRoute = tenantAdminRoutes.find((route) => route.name === 'TenantProcurement')
    const purchaseRequestListRoute = procurementRoute?.children?.find(
      (route) => route.name === 'TenantPurchaseRequestWorkspace'
    )
    const purchaseRequestCreateRoute = procurementRoute?.children?.find(
      (route) => route.name === 'TenantPurchaseRequestCreate'
    )
    const purchaseRequestDetailRoute = procurementRoute?.children?.find(
      (route) => route.name === 'TenantPurchaseRequestDetail'
    )
    const purchaseOrderListRoute = procurementRoute?.children?.find(
      (route) => route.name === 'TenantPurchaseOrderWorkspace'
    )
    const purchaseOrderDetailRoute = procurementRoute?.children?.find(
      (route) => route.name === 'TenantPurchaseOrderDetail'
    )
    const receivingExpectationListRoute = procurementRoute?.children?.find(
      (route) => route.name === 'TenantReceivingExpectationWorkspace'
    )
    const receivingExpectationDetailRoute = procurementRoute?.children?.find(
      (route) => route.name === 'TenantReceivingExpectationDetail'
    )

    expect(procurementRoute?.meta?.title).toBe('采购管理')
    expect(purchaseRequestListRoute?.path).toBe('/procurement/purchase-requests')
    expect(purchaseRequestListRoute?.meta?.entryKey).toBe('procurement.management')
    expect(purchaseRequestCreateRoute?.meta?.entryKey).toBe('procurement.management')
    expect(purchaseRequestCreateRoute?.meta?.hideInMenu).toBe(true)
    expect(purchaseRequestCreateRoute?.meta?.activePath).toBe('/procurement/purchase-requests')
    expect(purchaseRequestDetailRoute?.meta?.entryKey).toBe('procurement.management')
    expect(purchaseRequestDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(purchaseRequestDetailRoute?.meta?.activePath).toBe('/procurement/purchase-requests')
    expect(purchaseOrderListRoute?.path).toBe('/procurement/purchase-orders')
    expect(purchaseOrderListRoute?.meta?.entryKey).toBe('procurement.management')
    expect(purchaseOrderDetailRoute?.meta?.entryKey).toBe('procurement.management')
    expect(purchaseOrderDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(purchaseOrderDetailRoute?.meta?.activePath).toBe('/procurement/purchase-orders')
    expect(receivingExpectationListRoute?.path).toBe('/procurement/receiving-expectations')
    expect(receivingExpectationListRoute?.meta?.entryKey).toBe('procurement.management')
    expect(receivingExpectationDetailRoute?.meta?.entryKey).toBe('procurement.management')
    expect(receivingExpectationDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(receivingExpectationDetailRoute?.meta?.activePath).toBe(
      '/procurement/receiving-expectations'
    )
  })

  it('adds the finance workspace with dedicated account and receivable detail routes', () => {
    const financeRoute = tenantAdminRoutes.find((route) => route.name === 'TenantFinance')
    const workspaceRoute = financeRoute?.children?.find(
      (route) => route.name === 'TenantFinanceDashboard'
    )
    const accountDetailRoute = financeRoute?.children?.find(
      (route) => route.name === 'TenantFinancialAccountDetail'
    )
    const receivableDetailRoute = financeRoute?.children?.find(
      (route) => route.name === 'TenantReceivableScheduleDetail'
    )

    expect(financeRoute?.meta?.title).toBe('财务管理')
    expect(workspaceRoute?.path).toBe('/finance/dashboard')
    expect(workspaceRoute?.meta?.entryKey).toBe('finance.dashboard')
    expect(accountDetailRoute?.meta?.entryKey).toBe('finance.dashboard')
    expect(accountDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(accountDetailRoute?.meta?.activePath).toBe('/finance/dashboard')
    expect(receivableDetailRoute?.meta?.entryKey).toBe('finance.dashboard')
    expect(receivableDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(receivableDetailRoute?.meta?.activePath).toBe('/finance/dashboard')
  })

})
