import { CheckPermissionQuery } from '../../src/application/queries/authorization/check-permission.query'
import { BatchCheckPermissionQuery } from '../../src/application/queries/authorization/batch-check-permission.query'
import { CheckPermissionWithContextQuery } from '../../src/application/queries/authorization/check-permission-with-context.query'
import { PermissionCheckGrpcController } from '../../src/interfaces/grpc/permission-check.grpc.controller'

describe('PermissionCheckGrpcController L3', () => {
  it('gRPC 检查权限 / 当 RBAC 允许时 / 应返回 AuthorizationDecisionResponse', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(true)
    }
    const controller = new PermissionCheckGrpcController(queryBus as any, { emitAuthorizationDecision: jest.fn() } as any)

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
      reason: 'RBAC_GRANTED',
      explainCode: 'RBAC_GRANTED',
      matchedPolicyId: '',
      policyExplainEntries: []
    })
  })

  it('gRPC 批量检查权限 / 当收到多项请求时 / 应保留 requestId 并返回逐项结果', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue([
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
    }
    const permissionAuditService = {
      emitAuthorizationDecision: jest.fn()
    }
    const controller = new PermissionCheckGrpcController(
      queryBus as any,
      permissionAuditService as any
    )

    const result = await controller.batchCheckPermission({
      items: [
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
      ]
    } as any)

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<BatchCheckPermissionQuery>({
        items: [
          {
            requestId: 'item-1',
            accountId: 'account-1',
            permissionCode: 'permission.read',
            tenantId: 'tenant-1'
          },
          {
            requestId: 'item-2',
            accountId: 'account-2',
            permissionCode: 'permission.write',
            tenantId: undefined
          }
        ]
      })
    )
    expect(result).toEqual({
      decisions: [
        {
          requestId: 'item-1',
          allowed: true,
          evaluationMode: 1,
          matchedPolicy: '',
          reason: 'RBAC_GRANTED',
          explainCode: 'RBAC_GRANTED'
        },
        {
          requestId: 'item-2',
          allowed: false,
          evaluationMode: 1,
          matchedPolicy: '',
          reason: 'RBAC_DENIED',
          explainCode: 'RBAC_DENIED'
        }
      ]
    })
    expect(permissionAuditService.emitAuthorizationDecision).toHaveBeenCalledTimes(2)
  })

  it('gRPC 检查权限上下文 / 当命中 ABAC 结果时 / 应映射上下文字段并返回 RBAC_ABAC 枚举值', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        allowed: false,
        matchedPolicy: 'deny-admin',
        matchedPolicyId: 'deny-1',
        reason: 'Denied by policy "deny-admin"',
        evaluationMode: 'RBAC_ABAC',
        explainCode: 'POLICY_DENY_MATCHED',
        policyExplainEntries: [
          {
            policyId: 'deny-1',
            policyName: 'deny-admin',
            effect: 'DENY',
            priority: 100,
            applicable: true,
            matched: true,
            reasonCode: 'DENY_POLICY_MATCHED'
          }
        ]
      })
    }
    const controller = new PermissionCheckGrpcController(queryBus as any, { emitAuthorizationDecision: jest.fn() } as any)

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
      reason: 'Denied by policy "deny-admin"',
      explainCode: 'POLICY_DENY_MATCHED',
      matchedPolicyId: 'deny-1',
      policyExplainEntries: [
        {
          policyId: 'deny-1',
          policyName: 'deny-admin',
          effect: 2,
          priority: 100,
          applicable: true,
          matched: true,
          reasonCode: 'DENY_POLICY_MATCHED'
        }
      ]
    })
  })
})
