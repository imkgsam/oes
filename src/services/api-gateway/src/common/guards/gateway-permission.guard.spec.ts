import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  GatewayPermissionGuard,
  PERMISSION_CHECK_KEY,
  PermissionCheckType
} from '@oes/common'
import { of, throwError } from 'rxjs'

describe('GatewayPermissionGuard', () => {
  const metadata = { internal: 'metadata' }
  const metadataFactory = {
    createInternalCallMetadata: jest.fn().mockReturnValue(metadata)
  }

  function createContext(user?: Record<string, any>): ExecutionContext {
    return {
      getHandler: () => function handler() {},
      switchToHttp: () => ({
        getRequest: () => ({
          user
        })
      })
    } as unknown as ExecutionContext
  }

  it('应优先使用 holderId 作为操作者标识执行权限检查', async () => {
    const checkPermission = jest.fn().mockReturnValue(of({ allowed: true }))
    const guard = new GatewayPermissionGuard(
      {
        getService: jest.fn().mockReturnValue({
          checkPermission
        })
      } as any,
      {
        get: jest.fn().mockImplementation((metadataKey: string) =>
          metadataKey === PERMISSION_CHECK_KEY
            ? {
                type: PermissionCheckType.ALL,
                permissions: ['permission.read']
              }
            : undefined
        )
      } as unknown as Reflector,
      { warn: jest.fn() } as any,
      metadataFactory as any
    )

    guard.onModuleInit()

    const allowed = await guard.canActivate(
      createContext({
        holderId: 'account-holder-id',
        id: 'fallback-id',
        sub: 'fallback-sub'
      })
    )

    expect(allowed).toBe(true)
    expect(checkPermission).toHaveBeenCalledWith(
      {
        accountId: 'account-holder-id',
        permissionCode: 'permission.read'
      },
      metadata
    )
  })

  it('当 JWT 只携带 aid 时应使用 account id 执行权限检查', async () => {
    const checkPermission = jest.fn().mockReturnValue(of({ allowed: true }))
    const guard = new GatewayPermissionGuard(
      {
        getService: jest.fn().mockReturnValue({
          checkPermission
        })
      } as any,
      {
        get: jest.fn().mockImplementation((metadataKey: string) =>
          metadataKey === PERMISSION_CHECK_KEY
            ? {
                type: PermissionCheckType.ALL,
                permissions: ['permission.read']
              }
            : undefined
        )
      } as unknown as Reflector,
      { warn: jest.fn() } as any,
      metadataFactory as any
    )

    guard.onModuleInit()

    const allowed = await guard.canActivate(
      createContext({
        aid: 'account-from-aid',
        sub: 'user-sub'
      })
    )

    expect(allowed).toBe(true)
    expect(checkPermission).toHaveBeenCalledWith(
      {
        accountId: 'account-from-aid',
        permissionCode: 'permission.read'
      },
      metadata
    )
  })

  it('下游异常时应 fail-closed 拒绝访问', async () => {
    const guard = new GatewayPermissionGuard(
      {
        getService: jest.fn().mockReturnValue({
          checkPermission: jest.fn().mockReturnValue(
            throwError(() => new Error('permission upstream unavailable'))
          )
        })
      } as any,
      {
        get: jest.fn().mockImplementation((metadataKey: string) =>
          metadataKey === PERMISSION_CHECK_KEY
            ? {
                type: PermissionCheckType.ALL,
                permissions: ['permission.read']
              }
            : undefined
        )
      } as unknown as Reflector,
      { warn: jest.fn() } as any,
      metadataFactory as any
    )

    guard.onModuleInit()

    const allowed = await guard.canActivate(
      createContext({
        id: 'account-id'
      })
    )

    expect(allowed).toBe(false)
  })

  it('未声明权限元数据时应直接放行', async () => {
    const guard = new GatewayPermissionGuard(
      {
        getService: jest.fn()
      } as any,
      {
        get: jest.fn().mockReturnValue(undefined)
      } as unknown as Reflector,
      { warn: jest.fn() } as any,
      metadataFactory as any
    )

    guard.onModuleInit()

    const allowed = await guard.canActivate(createContext({ id: 'account-id' }))

    expect(allowed).toBe(true)
  })
})
