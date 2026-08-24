import { BatchCheckPermissionHandler } from '../../src/application/queries/authorization/batch-check-permission.handler'
import { BatchCheckPermissionQuery } from '../../src/application/queries/authorization/batch-check-permission.query'

describe('BatchCheckPermissionHandler', () => {
  it('批量权限查询 / 当请求到达 handler 时 / 应逐项转发并保留 requestId 顺序', async () => {
    const authzService = {
      checkPermission: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    }

    const handler = new BatchCheckPermissionHandler(authzService as any)
    const query = new BatchCheckPermissionQuery([
      {
        requestId: 'item-1',
        accountId: 'account-1',
        permissionCode: 'permission.read',
        tenantId: 'tenant-1'
      },
      {
        requestId: 'item-2',
        accountId: 'account-2',
        permissionCode: 'permission.write'
      }
    ])

    const result = await handler.execute(query)

    expect(authzService.checkPermission).toHaveBeenNthCalledWith(
      1,
      'account-1',
      'permission.read',
      'tenant-1'
    )
    expect(authzService.checkPermission).toHaveBeenNthCalledWith(
      2,
      'account-2',
      'permission.write',
      undefined
    )
    expect(result).toEqual([
      {
        requestId: 'item-1',
        allowed: true,
        evaluationMode: 'RBAC',
        matchedPolicy: '',
        reason: 'RBAC_GRANTED',
        explainCode: 'RBAC_GRANTED'
      },
      {
        requestId: 'item-2',
        allowed: false,
        evaluationMode: 'RBAC',
        matchedPolicy: '',
        reason: 'RBAC_DENIED',
        explainCode: 'RBAC_DENIED'
      }
    ])
  })
})
