import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  GatewayPermissionGuard,
  RequirePermissions,
  REQUIRE_PERMISSIONS_METADATA_KEY
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
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({
          user
        })
      })
    } as unknown as ExecutionContext
  }

  function createGuard(
    permissionResults: Record<string, boolean> | 'throw',
    requiredPermissions?: unknown
  ) {
    const checkPermission = jest.fn().mockImplementation(({ permissionCode }) => {
      if (permissionResults === 'throw') {
        return throwError(() => new Error('permission upstream unavailable'))
      }
      return of({ allowed: permissionResults[permissionCode] ?? false })
    })
    const guard = new GatewayPermissionGuard(
      {
        getService: jest.fn().mockReturnValue({
          checkPermission
        })
      } as any,
      {
        getAllAndOverride: jest
          .fn()
          .mockImplementation((metadataKey: string) =>
            metadataKey === REQUIRE_PERMISSIONS_METADATA_KEY ? requiredPermissions : undefined
          )
      } as unknown as Reflector,
      { warn: jest.fn() } as any,
      metadataFactory as any
    )

    guard.onModuleInit()
    return { guard, checkPermission }
  }

  it('RequirePermissions 应写入统一 permission metadata shape', () => {
    class TestController {
      @RequirePermissions({ all: ['permission.read'] })
      read() {}
    }

    const reflector = new Reflector()

    expect(reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, TestController.prototype.read)).toEqual({
      all: ['permission.read']
    })
  })

  it('RequirePermissions 同时声明 all 与 any 时应 fail fast', () => {
    expect(() =>
      RequirePermissions({ all: ['permission.read'], any: ['permission.write'] } as any)
    ).toThrow(/all.*any|any.*all/i)
  })

  it('未声明权限元数据时应直接放行', async () => {
    const { guard } = createGuard({}, undefined)

    const allowed = await guard.canActivate(createContext({ id: 'account-id' }))

    expect(allowed).toBe(true)
  })

  it('all 权限全部通过时应允许访问并保持 holderId 优先级', async () => {
    const { guard, checkPermission } = createGuard(
      {
        'permission.read': true,
        'permission.write': true
      },
      { all: ['permission.read', 'permission.write'] }
    )

    const allowed = await guard.canActivate(
      createContext({
        holderId: 'account-holder-id',
        id: 'fallback-id',
        sub: 'fallback-sub'
      })
    )

    expect(allowed).toBe(true)
    expect(checkPermission).toHaveBeenCalledTimes(2)
    expect(checkPermission).toHaveBeenNthCalledWith(
      1,
      { accountId: 'account-holder-id', permissionCode: 'permission.read' },
      metadata
    )
    expect(checkPermission).toHaveBeenNthCalledWith(
      2,
      { accountId: 'account-holder-id', permissionCode: 'permission.write' },
      metadata
    )
  })

  it('all 权限部分拒绝时应拒绝访问', async () => {
    const { guard } = createGuard(
      {
        'permission.read': true,
        'permission.write': false
      },
      { all: ['permission.read', 'permission.write'] }
    )

    const allowed = await guard.canActivate(createContext({ id: 'account-id' }))

    expect(allowed).toBe(false)
  })

  it('any 权限存在一个通过时应允许访问并保持 aid 回退行为', async () => {
    const { guard, checkPermission } = createGuard(
      {
        'permission.read': false,
        'permission.write': true
      },
      { any: ['permission.read', 'permission.write'] }
    )

    const allowed = await guard.canActivate(
      createContext({
        aid: 'account-from-aid',
        sub: 'user-sub'
      })
    )

    expect(allowed).toBe(true)
    expect(checkPermission).toHaveBeenNthCalledWith(
      1,
      { accountId: 'account-from-aid', permissionCode: 'permission.read' },
      metadata
    )
    expect(checkPermission).toHaveBeenNthCalledWith(
      2,
      { accountId: 'account-from-aid', permissionCode: 'permission.write' },
      metadata
    )
  })

  it('any 权限全部拒绝时应拒绝访问', async () => {
    const { guard } = createGuard(
      {
        'permission.read': false,
        'permission.write': false
      },
      { any: ['permission.read', 'permission.write'] }
    )

    const allowed = await guard.canActivate(createContext({ id: 'account-id' }))

    expect(allowed).toBe(false)
  })

  it('下游异常时应 fail-closed 拒绝访问', async () => {
    const { guard } = createGuard('throw', { all: ['permission.read'] })

    const allowed = await guard.canActivate(
      createContext({
        id: 'account-id'
      })
    )

    expect(allowed).toBe(false)
  })
})
