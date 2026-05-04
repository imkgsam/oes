import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get
  }
}))

// Verifies the tenant-web policy governance API client stays aligned with the readonly gateway contract.
describe('tenant-web policy governance api', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('lists readonly policies with filter and pagination params', async () => {
    const { listPoliciesApi } = await import('./index')

    await listPoliciesApi({
      isEnabled: true,
      keyword: 'deny',
      page: 2,
      pageSize: 50,
      permissionCode: 'permission.role_instance.update',
      tenantId: 'tenant-1'
    })

    expect(get).toHaveBeenCalledWith('/policy', {
      params: {
        isEnabled: true,
        keyword: 'deny',
        page: 2,
        pageSize: 50,
        permissionCode: 'permission.role_instance.update',
        tenantId: 'tenant-1'
      }
    })
  })

  it('loads one readonly policy detail by stable id', async () => {
    const { getPolicyByIdApi } = await import('./index')

    await getPolicyByIdApi('policy-1')

    expect(get).toHaveBeenCalledWith('/policy/policy-1')
  })

  it('loads policies linked to one permission code with an optional tenant filter', async () => {
    const { listPermissionPoliciesApi } = await import('./index')

    await listPermissionPoliciesApi('permission.role_instance.update', {
      tenantId: 'tenant-1'
    })

    expect(get).toHaveBeenCalledWith('/permission/permission.role_instance.update/policies', {
      params: {
        tenantId: 'tenant-1'
      }
    })
  })
})
