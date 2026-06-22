import { of, throwError } from 'rxjs'
import { PermissionBusinessCardAuthorizationAdapter } from '../../src/infrastructure/adapters/permission-business-card-authorization.adapter'

const operatorContext = {
  operatorAccountId: 'acc_admin',
  operatorOrgId: 'org_001',
  traceId: 'trace_001'
}

// buildAdapter creates a permission adapter with a fake generated gRPC client.
function buildAdapter(allowed: boolean | Error) {
  const permissionClient = {
    checkPermission: jest.fn(() =>
      allowed instanceof Error ? throwError(() => allowed) : of({ allowed })
    )
  }
  const adapter = new PermissionBusinessCardAuthorizationAdapter(permissionClient as any)
  return { adapter, permissionClient }
}

describe('PermissionBusinessCardAuthorizationAdapter', () => {
  it('delegates checkPermission to permission-service RBAC and fails closed on deny', async () => {
    const { adapter, permissionClient } = buildAdapter(false)

    await expect(
      adapter.checkPermission({
        tenantId: 'tenant_001',
        permissionCode: 'public-entry.business-card.manage',
        operatorContext
      })
    ).resolves.toBe(false)

    expect(permissionClient.checkPermission).toHaveBeenCalledWith({
      tenantId: 'tenant_001',
      accountId: 'acc_admin',
      permissionCode: 'public-entry.business-card.manage'
    })
  })

  it('uses RBAC permission checks for resource checks and never falls back to historical context RPC', async () => {
    const { adapter, permissionClient } = buildAdapter(true)

    await expect(
      adapter.checkResource({
        tenantId: 'tenant_001',
        permissionCode: 'public-entry.business-card.enable',
        operatorContext,
        resource: {
          tenantId: 'tenant_001',
          businessCardId: 'card_001',
          employeeId: 'emp_001',
          status: 'DRAFT'
        }
      })
    ).resolves.toBe(true)

    expect(permissionClient.checkPermission).toHaveBeenCalledWith({
      tenantId: 'tenant_001',
      accountId: 'acc_admin',
      permissionCode: 'public-entry.business-card.enable'
    })
  })

  it('allows tenant-wide resource access after RBAC allow but denies cross-tenant resource facts', async () => {
    const { adapter, permissionClient } = buildAdapter(true)

    await expect(
      adapter.checkResource({
        tenantId: 'tenant_001',
        permissionCode: 'public-entry.business-card.disable',
        operatorContext,
        resource: {
          tenantId: 'tenant_001',
          businessCardId: 'card_001',
          employeeId: 'emp_any_org',
          status: 'ACTIVE'
        }
      })
    ).resolves.toBe(true)

    await expect(
      adapter.checkResource({
        tenantId: 'tenant_001',
        permissionCode: 'public-entry.business-card.disable',
        operatorContext,
        resource: {
          tenantId: 'tenant_002',
          businessCardId: 'card_002',
          employeeId: 'emp_other_tenant',
          status: 'ACTIVE'
        }
      })
    ).resolves.toBe(false)

    expect(permissionClient.checkPermission).toHaveBeenCalledTimes(1)
  })

  it('returns tenant-only query scope when permission-service allows list access', async () => {
    const { adapter } = buildAdapter(true)

    await expect(
      adapter.buildQueryScope({
        tenantId: 'tenant_001',
        permissionCode: 'public-entry.business-card.read',
        operatorContext
      })
    ).resolves.toEqual({ tenantId: 'tenant_001' })
  })

  it('fails closed when permission-service is unavailable', async () => {
    const { adapter } = buildAdapter(new Error('permission unavailable'))

    await expect(
      adapter.checkPermission({
        tenantId: 'tenant_001',
        permissionCode: 'public-entry.business-card.manage',
        operatorContext
      })
    ).resolves.toBe(false)
  })
})
