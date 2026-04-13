import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory, INTERNAL_SERVICE_UNAVAILABLE } from '@oes/common/exceptions'
import {
  attachOperatorContext,
  PERMISSION_DEPENDENCY_UNAVAILABLE,
  PermissionGuard,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'

describe('permission guard role resolution', () => {
  function createExecutionContext(rpcData: Record<string, unknown>) {
    return {
      getHandler: () => 'handler',
      getClass: () => 'controller',
      switchToRpc: () => ({
        getData: () => rpcData
      })
    } as any
  }

  it('当 operator_roles 可解析到所需权限时 / 应允许通过', async () => {
    const rpcData: Record<string, unknown> = {}
    attachOperatorContext(rpcData, {
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      tenant_id: 'tenant-1',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig',
      operator_roles: ['role-a']
    })

    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('identity.org.membership.add')
    } as unknown as Reflector
    const adaptor = {
      listPermissionCodesByRoleId: jest.fn().mockResolvedValue(['identity.org.membership.add'])
    } as unknown as PermissionServicePermissionReadAdaptor
    const guard = new PermissionGuard(
      reflector,
      new RoleBasedOperatorPermissionResolver(adaptor)
    )

    const allowed = await guard.canActivate(createExecutionContext(rpcData))

    expect(allowed).toBe(true)
  })

  it('当缺少 operator_roles 时 / 应拒绝通过', async () => {
    const rpcData: Record<string, unknown> = {}
    attachOperatorContext(rpcData, {
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      tenant_id: 'tenant-1',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig'
    } as any)

    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('identity.org.membership.add')
    } as unknown as Reflector
    const adaptor = {
      listPermissionCodesByRoleId: jest.fn()
    } as unknown as PermissionServicePermissionReadAdaptor
    const guard = new PermissionGuard(
      reflector,
      new RoleBasedOperatorPermissionResolver(adaptor)
    )

    expect(adaptor.listPermissionCodesByRoleId).not.toHaveBeenCalled()

    try {
      await guard.canActivate(createExecutionContext(rpcData))
      throw new Error('expected guard to deny access')
    } catch (error) {
      expect(error).toMatchObject({
        definition: expect.objectContaining({
          code: ACCESS_DENIED.code
        })
      })
    }
  })

  it('当权限依赖不可用时 / 应抛出 PERMISSION_DEPENDENCY_UNAVAILABLE', async () => {
    const rpcData: Record<string, unknown> = {}
    attachOperatorContext(rpcData, {
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      tenant_id: 'tenant-1',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig',
      operator_roles: ['role-a']
    })

    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('identity.org.membership.add')
    } as unknown as Reflector
    const adaptor = {
      listPermissionCodesByRoleId: jest.fn().mockRejectedValue(
        ExceptionFactory.infrastructure(INTERNAL_SERVICE_UNAVAILABLE, {
          upstream: 'permission-service'
        })
      )
    } as unknown as PermissionServicePermissionReadAdaptor
    const guard = new PermissionGuard(
      reflector,
      new RoleBasedOperatorPermissionResolver(adaptor)
    )

    await expect(guard.canActivate(createExecutionContext(rpcData))).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: PERMISSION_DEPENDENCY_UNAVAILABLE.code
      })
    })
  })
})
