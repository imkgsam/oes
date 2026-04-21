import { RoleManagementReadService } from './role-management-read.service'

describe('RoleManagementReadService', () => {
  const permissionService = {
    getRoleById: jest.fn(),
    getRoleTemplateById: jest.fn(),
    listRoles: jest.fn()
  }

  const identityAdapter = {
    getTenantById: jest.fn(),
    listTenants: jest.fn()
  }

  const service = new RoleManagementReadService(
    permissionService as any,
    identityAdapter as any
  )

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('enriches the current role page with tenant names and source template names', async () => {
    permissionService.listRoles.mockResolvedValue({
      page: 1,
      pageSize: 20,
      total: 2,
      roles: [
        {
          id: 'role-1',
          name: 'Tenant Admin',
          code: 'tenant.admin',
          tenantId: 'tenant-1',
          templateRoleId: 'template-1'
        },
        {
          id: 'role-2',
          name: 'Warehouse Admin',
          code: 'warehouse.admin',
          tenantId: 'tenant-1',
          templateRoleId: 'template-1'
        }
      ]
    })
    identityAdapter.getTenantById.mockResolvedValue({
      tenant: {
        id: 'tenant-1',
        name: '潮州市美隆陶瓷实业有限公司'
      }
    })
    permissionService.getRoleTemplateById.mockResolvedValue({
      id: 'template-1',
      name: '租户管理员',
      code: 'tenant.admin'
    })

    await expect(
      service.listRoles(
        {
          page: 1,
          pageSize: 20
        } as any,
        { requestId: 'req-1', traceId: 'trace-1' } as any
      )
    ).resolves.toMatchObject({
      roles: [
        {
          id: 'role-1',
          tenantName: '潮州市美隆陶瓷实业有限公司',
          templateRoleName: '租户管理员'
        },
        {
          id: 'role-2',
          tenantName: '潮州市美隆陶瓷实业有限公司',
          templateRoleName: '租户管理员'
        }
      ]
    })

    expect(identityAdapter.getTenantById).toHaveBeenCalledTimes(1)
    expect(permissionService.getRoleTemplateById).toHaveBeenCalledTimes(1)
  })

  it('lists tenant selector options for role creation flows', async () => {
    identityAdapter.listTenants.mockResolvedValue({
      tenants: [
        {
          id: 'tenant-1',
          code: 'tenant.alpha',
          name: 'Alpha Tenant',
          isActive: true
        }
      ]
    })

    await expect(
      service.listTenantOptions(
        {
          keyword: 'alpha',
          pageSize: 10
        },
        { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'operator-1' } } as any
      )
    ).resolves.toEqual({
      tenants: [
        {
          id: 'tenant-1',
          code: 'tenant.alpha',
          name: 'Alpha Tenant',
          isActive: true
        }
      ]
    })

    expect(identityAdapter.listTenants).toHaveBeenCalledWith(
      {
        keyword: 'alpha',
        pageSize: 10,
        activeOnly: true
      },
      { requestId: 'req-1', traceId: 'trace-1', user: { aid: 'operator-1' } }
    )
  })
})
