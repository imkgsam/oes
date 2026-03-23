import { CheckPermissionQuery } from '../../src/application/queries/authorization/check-permission.query'
import { CheckPermissionWithContextQuery } from '../../src/application/queries/authorization/check-permission-with-context.query'
import { PermissionCheckGrpcController } from '../../src/interfaces/grpc/permission-check.grpc.controller'

describe('PermissionCheckGrpcController L3', () => {
  it('gRPC 检查权限 / 当 RBAC 允许时 / 应返回 AuthorizationDecisionResponse', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(true)
    }
    const controller = new PermissionCheckGrpcController(queryBus as any)

    const result = await controller.checkPermission({
      accountId: 'account-id',
      permissionCode: 'permission.read'
    } as any)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<CheckPermissionQuery>({
        accountId: 'account-id',
        permissionCode: 'permission.read'
      })
    )
    expect(result).toEqual({
      allowed: true,
      evaluationMode: 1,
      matchedPolicy: '',
      reason: 'RBAC_GRANTED'
    })
  })

  it('gRPC 检查权限上下文 / 当命中 ABAC 结果时 / 应映射上下文字段并返回 RBAC_ABAC 枚举值', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        allowed: false,
        matchedPolicy: 'deny-admin',
        reason: 'Denied by policy "deny-admin"',
        evaluationMode: 'RBAC_ABAC'
      })
    }
    const controller = new PermissionCheckGrpcController(queryBus as any)

    const result = await controller.checkPermissionWithContext({
      accountId: 'account-id',
      permissionCode: 'permission.read',
      tenantId: 'tenant-1',
      subjectAttributes: { role_codes: 'ADMIN' },
      resourceAttributes: { resource_type: 'document' },
      environmentAttributes: { ip: '127.0.0.1' },
      actionAttributes: { action: 'read' }
    } as any)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<CheckPermissionWithContextQuery>({
        accountId: 'account-id',
        permissionCode: 'permission.read',
        tenantId: 'tenant-1',
        subject: { role_codes: 'ADMIN' },
        resource: { resource_type: 'document' },
        environment: { ip: '127.0.0.1' },
        action: { action: 'read' }
      })
    )
    expect(result).toEqual({
      allowed: false,
      evaluationMode: 2,
      matchedPolicy: 'deny-admin',
      reason: 'Denied by policy "deny-admin"'
    })
  })
})
