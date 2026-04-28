import { describe, expect, it } from 'vitest'

import tenantAdminRoutes from './routes'

function resolveRedirect(route: { redirect?: unknown }, query: Record<string, string>) {
  return typeof route.redirect === 'function'
    ? route.redirect({ query } as any)
    : route.redirect
}

describe('tenant admin routes', () => {
  it('keeps the system org-management workbench on one stable tab key even when orgUnitId query changes', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const orgManagementRoute = governanceRoute?.children?.find(
      (route) => route.name === 'AdminOrgManagement'
    )

    expect(orgManagementRoute?.meta?.entryKey).toBe('admin.org-management')
    expect(orgManagementRoute?.meta?.fullPathKey).toBe(false)
  })

  it('binds the unified organization-people entry and its child tabs to the dedicated entry key', () => {
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

    expect(organizationPeopleRoute?.meta?.entryKey).toBe(
      'tenant-settings.organization-people'
    )
    expect(organizationPeopleRoute?.meta?.fullPathKey).toBe(false)
    expect(membersRoute?.meta?.entryKey).toBe('tenant-settings.organization-people')
    expect(departmentsRoute?.meta?.entryKey).toBe('tenant-settings.organization-people')
    expect(membersRoute?.meta?.activePath).toBe('/settings/organization-people')
    expect(departmentsRoute?.meta?.activePath).toBe('/settings/organization-people')
  })

  it('keeps the legacy organization and employee jump routes on their original entry keys', () => {
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const legacyEmployeeRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantEmployeeEmploymentManagement'
    )
    const legacyOrgRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrgStructureManagement'
    )

    expect(legacyOrgRoute?.meta?.entryKey).toBe('tenant-settings.org-structure')
    expect(legacyEmployeeRoute?.meta?.entryKey).toBe(
      'tenant-settings.employee-employment'
    )
  })

  it('uses the organization people root route as the single visible workbench entry', () => {
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const organizationPeopleRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrganizationPeople'
    )

    expect(typeof organizationPeopleRoute?.redirect).toBe('undefined')
    expect(organizationPeopleRoute?.path).toBe('/settings/organization-people')
    expect(organizationPeopleRoute?.meta?.fullPathKey).toBe(false)
  })

  it('binds item list, create, and detail routes to the dedicated master-data item entry', () => {
    const masterDataRoute = tenantAdminRoutes.find((route) => route.name === 'TenantMasterData')
    const itemListRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemManagement'
    )
    const itemCreateRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemManagementCreate'
    )
    const itemDetailRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantItemManagementDetail'
    )

    expect(itemListRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemListRoute?.path).toBe('/master-data/items')
    expect(itemCreateRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemCreateRoute?.meta?.hideInMenu).toBe(true)
    expect(itemCreateRoute?.meta?.activePath).toBe('/master-data/items')
    expect(itemDetailRoute?.meta?.entryKey).toBe('master-data.item-management')
    expect(itemDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(itemDetailRoute?.meta?.activePath).toBe('/master-data/items')
  })

  it('binds customer list, create, and detail routes to the dedicated master-data customer entry', () => {
    const masterDataRoute = tenantAdminRoutes.find((route) => route.name === 'TenantMasterData')
    const customerListRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantCustomerManagement'
    )
    const customerCreateRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantCustomerManagementCreate'
    )
    const customerDetailRoute = masterDataRoute?.children?.find(
      (route) => route.name === 'TenantCustomerManagementDetail'
    )

    expect(customerListRoute?.meta?.entryKey).toBe('master-data.customer-management')
    expect(customerListRoute?.path).toBe('/master-data/customers')
    expect(customerCreateRoute?.meta?.entryKey).toBe('master-data.customer-management')
    expect(customerCreateRoute?.meta?.hideInMenu).toBe(true)
    expect(customerCreateRoute?.meta?.activePath).toBe('/master-data/customers')
    expect(customerDetailRoute?.meta?.entryKey).toBe('master-data.customer-management')
    expect(customerDetailRoute?.meta?.hideInMenu).toBe(true)
    expect(customerDetailRoute?.meta?.activePath).toBe('/master-data/customers')
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

  it('redirects legacy employee and org settings routes into the unified workbench tabs', () => {
    const settingsRoute = tenantAdminRoutes.find((route) => route.name === 'TenantSettings')
    const legacyEmployeeRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantEmployeeEmploymentManagement'
    )
    const legacyOrgRoute = settingsRoute?.children?.find(
      (route) => route.name === 'TenantOrgStructureManagement'
    )

    expect(resolveRedirect(legacyEmployeeRoute ?? {}, {
      employeeId: 'employee-9'
    })).toEqual({
      name: 'TenantOrganizationPeople',
      query: {}
    })

    expect(resolveRedirect(legacyOrgRoute ?? {}, {
      orgUnitId: 'org-9'
    })).toEqual({
      name: 'TenantOrganizationPeople',
      query: {
        tab: 'departments'
      }
    })
  })
})
