import { CheckPermissionWithContextHandler } from '../../src/application/queries/authorization/check-permission-with-context.handler'
import { CheckPermissionWithContextQuery } from '../../src/application/queries/authorization/check-permission-with-context.query'
import { AuthzDecision } from '../../src/domain/services/policy-engine'

describe('CheckPermissionWithContextHandler', () => {
  it('上下文权限查询 / 当请求到达 handler 时 / 应完整转发给鉴权服务', async () => {
    const decision: AuthzDecision = {
      allowed: true,
      matchedPolicy: 'allow-admin',
      evaluationMode: 'RBAC_ABAC'
    }
    const authzService = {
      checkPermissionWithContext: jest.fn().mockResolvedValue(decision)
    }
    const handler = new CheckPermissionWithContextHandler(authzService as any)
    const query = new CheckPermissionWithContextQuery({
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      permissionCode: 'permission.read',
      tenantId: 'tenant-1',
      subject: { role_codes: ['ADMIN'] },
      resource: { resource_type: 'document' },
      environment: { ip: '127.0.0.1' },
      action: { name: 'read' }
    })

    const result = await handler.execute(query)

    expect(authzService.checkPermissionWithContext).toHaveBeenCalledWith({
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      permissionCode: 'permission.read',
      tenantId: 'tenant-1',
      subject: { role_codes: ['ADMIN'] },
      resource: { resource_type: 'document' },
      environment: { ip: '127.0.0.1' },
      action: { name: 'read' }
    })
    expect(result).toBe(decision)
  })
})
