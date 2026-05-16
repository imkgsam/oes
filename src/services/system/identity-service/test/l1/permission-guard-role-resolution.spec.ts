import { Reflector } from '@nestjs/core'
import {
  ACCESS_DENIED,
  ExceptionFactory,
  INTERNAL_SERVICE_UNAVAILABLE
} from '@oes/common/exceptions'
import {
  RequirePermissions,
  attachOperatorContext,
  PERMISSION_DEPENDENCY_UNAVAILABLE,
  PermissionGuard,
  PermissionServicePermissionReadAdaptor,
  RequirePermissionsMetadata,
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

  function createRpcData() {
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

    return rpcData
  }

  function createGuard(
    requiredPermissions: RequirePermissionsMetadata | undefined,
    permissionCodes: string[]
  ) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredPermissions)
    } as unknown as Reflector
    const adaptor = {
      listPermissionCodesByOperatorContext: jest.fn().mockResolvedValue(permissionCodes)
    } as unknown as PermissionServicePermissionReadAdaptor
    const guard = new PermissionGuard(reflector, new RoleBasedOperatorPermissionResolver(adaptor))

    return guard
  }

  it('未声明权限元数据时 / 应允许通过且不解析权限依赖', async () => {
    const rpcData = createRpcData()
    const resolver = {
      resolvePermissions: jest.fn()
    }
    const guard = new PermissionGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector,
      resolver as any
    )

    const allowed = await guard.canActivate(createExecutionContext(rpcData))

    expect(allowed).toBe(true)
    expect(resolver.resolvePermissions).not.toHaveBeenCalled()
  })

  it('all 权限全部解析到时 / 应允许通过', async () => {
    const rpcData = createRpcData()
    const guard = createGuard(
      { all: ['identity.contact.work_email.assign', 'identity.contact.work_phone.assign'] },
      ['identity.contact.work_email.assign', 'identity.contact.work_phone.assign']
    )

    const allowed = await guard.canActivate(createExecutionContext(rpcData))

    expect(allowed).toBe(true)
  })

  it('all 权限部分缺失时 / 应拒绝通过', async () => {
    const rpcData = createRpcData()
    const guard = createGuard(
      { all: ['identity.contact.work_email.assign', 'identity.contact.work_phone.assign'] },
      ['identity.contact.work_email.assign']
    )

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

  it('any 权限存在一个解析到时 / 应允许通过', async () => {
    const rpcData = createRpcData()
    const guard = createGuard(
      { any: ['identity.contact.work_email.assign', 'identity.contact.work_phone.assign'] },
      ['identity.contact.work_phone.assign']
    )

    const allowed = await guard.canActivate(createExecutionContext(rpcData))

    expect(allowed).toBe(true)
  })

  it('any 权限全部缺失时 / 应拒绝通过', async () => {
    const rpcData = createRpcData()
    const guard = createGuard(
      { any: ['identity.contact.work_email.assign', 'identity.contact.work_phone.assign'] },
      []
    )

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
    const rpcData = createRpcData()
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue({ all: ['identity.contact.work_email.assign'] })
    } as unknown as Reflector
    const adaptor = {
      listPermissionCodesByOperatorContext: jest.fn().mockRejectedValue(
        ExceptionFactory.infrastructure(INTERNAL_SERVICE_UNAVAILABLE, {
          upstream: 'permission-service'
        })
      )
    } as unknown as PermissionServicePermissionReadAdaptor
    const guard = new PermissionGuard(reflector, new RoleBasedOperatorPermissionResolver(adaptor))

    await expect(guard.canActivate(createExecutionContext(rpcData))).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: PERMISSION_DEPENDENCY_UNAVAILABLE.code
      })
    })
  })
})
