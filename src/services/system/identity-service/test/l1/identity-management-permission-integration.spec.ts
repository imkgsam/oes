import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ACCESS_DENIED } from '@oes/common/exceptions'
import { AppLogger } from '@oes/common/logging'
import {
  attachOperatorContext,
  AuthenticatedOperatorGuard,
  GrpcRequestContextInterceptor,
  GrpcRequestContextStore,
  INTERNAL_SERVICE_AUTHENTICATOR,
  InternalServiceGuard,
  OPERATOR_PERMISSION_RESOLVER,
  OPERATOR_CONTEXT_VERIFIER,
  PermissionGuard,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'
import { IdentityManagementGrpcController } from '../../src/interfaces/grpc/identity-management.grpc.controller'
import { IdentityAuditService } from '../../src/application/services/identity-audit.service'

describe('identity management permission integration', () => {
  function createRpcExecutionContext(
    controller: IdentityManagementGrpcController,
    handlerName: keyof IdentityManagementGrpcController,
    rpcData: Record<string, unknown>
  ): ExecutionContext {
    return {
      getClass: () => controller.constructor,
      getHandler: () => controller[handlerName] as any,
      switchToRpc: () => ({
        getData: () => rpcData
      })
    } as ExecutionContext
  }

  it('当 operator_roles 可解析出接口所需权限时 / 应允许访问 addAccountOrgMembership', async () => {
    const permissionReadAdaptor = {
      listPermissionCodesByRoleId: jest.fn().mockResolvedValue(['identity.org.membership.add'])
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [IdentityManagementGrpcController],
      providers: [
        {
          provide: ValidatingCommandBus,
          useValue: { execute: jest.fn() }
        },
        {
          provide: AppLogger,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
            setContext: jest.fn()
          }
        },
        Reflector,
        GrpcRequestContextStore,
        GrpcRequestContextInterceptor,
        {
          provide: IdentityAuditService,
          useValue: {
            emitOrgMembershipEvent: jest.fn()
          }
        },
        InternalServiceGuard,
        AuthenticatedOperatorGuard,
        PermissionGuard,
        {
          provide: INTERNAL_SERVICE_AUTHENTICATOR,
          useValue: {
            authenticate: jest.fn().mockReturnValue({
              authenticated: true,
              principal: { serviceName: 'auth-service' }
            })
          }
        },
        {
          provide: OPERATOR_CONTEXT_VERIFIER,
          useValue: {
            verify: jest.fn()
          }
        },
        {
          provide: PermissionServicePermissionReadAdaptor,
          useValue: permissionReadAdaptor
        },
        RoleBasedOperatorPermissionResolver,
        {
          provide: OPERATOR_PERMISSION_RESOLVER,
          useExisting: RoleBasedOperatorPermissionResolver
        }
      ]
    }).compile()

    const controller = moduleRef.get(IdentityManagementGrpcController)
    const guard = moduleRef.get(PermissionGuard)
    const rpcData: Record<string, unknown> = {}

    attachOperatorContext(rpcData, {
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      tenant_id: 'tenant-1',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig',
      operator_roles: ['role-org-admin']
    })

    const allowed = await guard.canActivate(
      createRpcExecutionContext(controller, 'addAccountOrgMembership', rpcData)
    )

    expect(permissionReadAdaptor.listPermissionCodesByRoleId).toHaveBeenCalledWith('role-org-admin')
    expect(allowed).toBe(true)
  })

  it('当 operator_roles 无法解析出接口所需权限时 / 应拒绝访问 setAccountPrimaryOrg', async () => {
    const permissionReadAdaptor = {
      listPermissionCodesByRoleId: jest.fn().mockResolvedValue(['identity.org.membership.add'])
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [IdentityManagementGrpcController],
      providers: [
        {
          provide: ValidatingCommandBus,
          useValue: { execute: jest.fn() }
        },
        {
          provide: AppLogger,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
            setContext: jest.fn()
          }
        },
        Reflector,
        GrpcRequestContextStore,
        GrpcRequestContextInterceptor,
        {
          provide: IdentityAuditService,
          useValue: {
            emitOrgMembershipEvent: jest.fn()
          }
        },
        InternalServiceGuard,
        AuthenticatedOperatorGuard,
        PermissionGuard,
        {
          provide: INTERNAL_SERVICE_AUTHENTICATOR,
          useValue: {
            authenticate: jest.fn().mockReturnValue({
              authenticated: true,
              principal: { serviceName: 'auth-service' }
            })
          }
        },
        {
          provide: OPERATOR_CONTEXT_VERIFIER,
          useValue: {
            verify: jest.fn()
          }
        },
        {
          provide: PermissionServicePermissionReadAdaptor,
          useValue: permissionReadAdaptor
        },
        RoleBasedOperatorPermissionResolver,
        {
          provide: OPERATOR_PERMISSION_RESOLVER,
          useExisting: RoleBasedOperatorPermissionResolver
        }
      ]
    }).compile()

    const controller = moduleRef.get(IdentityManagementGrpcController)
    const guard = moduleRef.get(PermissionGuard)
    const rpcData: Record<string, unknown> = {}

    attachOperatorContext(rpcData, {
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      tenant_id: 'tenant-1',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig',
      operator_roles: ['role-org-viewer']
    })

    await expect(
      guard.canActivate(createRpcExecutionContext(controller, 'setAccountPrimaryOrg', rpcData))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
    expect(permissionReadAdaptor.listPermissionCodesByRoleId).toHaveBeenCalledWith('role-org-viewer')
  })
})
