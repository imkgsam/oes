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
      query: {
        employeeId: 'employee-9',
        pageKey: 'tenant-settings.organization-people',
        tab: 'members'
      }
    })

    expect(resolveRedirect(legacyOrgRoute ?? {}, {
      orgUnitId: 'org-9'
    })).toEqual({
      name: 'TenantOrganizationPeople',
      query: {
        orgUnitId: 'org-9',
        pageKey: 'tenant-settings.organization-people',
        tab: 'departments'
      }
    })
  })
})
