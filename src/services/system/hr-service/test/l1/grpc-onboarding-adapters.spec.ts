import { Metadata, status as GrpcStatus } from '@grpc/grpc-js'
import { ClientGrpc, RpcException } from '@nestjs/microservices'
import { of, throwError } from 'rxjs'
import { IDENTITY_MANAGEMENT_SERVICE_NAME } from '@oes/common/generated/identity_service'
import { PERMISSION_MANAGEMENT_SERVICE_NAME } from '@oes/common/generated/permission_service'
import { IdentityEmployeeBindingGrpcAdapter } from '../../src/infrastructure/adapters/identity-employee-binding-grpc.adapter'
import { PermissionOnboardingGrantGrpcAdapter } from '../../src/infrastructure/adapters/permission-onboarding-grant-grpc.adapter'

describe('gRPC onboarding adapters', () => {
  const attachTrustedProducer = (adapter: object, metadata = new Metadata()) => {
    ;(adapter as any).trusted = { forBusinessCall: jest.fn().mockResolvedValue(metadata) }
    return metadata
  }

  it('identity adapter should call BindAccountToEmployee over identity-service proto', async () => {
    const bindAccountToEmployee = jest
      .fn()
      .mockReturnValue(of({ binding: { accountId: 'account-1' } }))
    const client = {
      getService: jest.fn().mockReturnValue({
        bindAccountToEmployee
      })
    } as unknown as ClientGrpc
    const adapter = new IdentityEmployeeBindingGrpcAdapter(client)
    attachTrustedProducer(adapter)

    adapter.onModuleInit()

    await expect(
      adapter.bindAccountToEmployee({
        tenantId: 'tenant-1',
        employeeId: 'employee-1',
        accountId: 'account-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          tenantId: 'tenant-1'
        }
      })
    ).resolves.toEqual({ accountId: 'account-1' })

    expect(bindAccountToEmployee).toHaveBeenCalledWith(
      {
        employeeId: 'employee-1',
        accountId: 'account-1'
      },
      expect.any(Metadata)
    )
    expect((client.getService as jest.Mock).mock.calls[0][0]).toBe(IDENTITY_MANAGEMENT_SERVICE_NAME)
  })

  it('permission adapter should call GrantInitialAccessForEmployeeAccount over permission-service proto', async () => {
    const grantInitialAccessForEmployeeAccount = jest
      .fn()
      .mockReturnValue(of({ grant: { idempotencyKey: 'grant-key-1' } }))
    const client = {
      getService: jest.fn().mockReturnValue({
        grantInitialAccessForEmployeeAccount
      })
    } as unknown as ClientGrpc
    const adapter = new PermissionOnboardingGrantGrpcAdapter(client)
    attachTrustedProducer(adapter)

    adapter.onModuleInit()

    await expect(
      adapter.grantInitialAccessForEmployeeAccount({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: ['role-1'],
        idempotencyKey: 'grant-key-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          tenantId: 'tenant-1'
        }
      })
    ).resolves.toEqual({ grantId: 'grant-key-1' })

    expect(grantInitialAccessForEmployeeAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: ['role-1'],
        idempotencyKey: 'grant-key-1'
      },
      expect.any(Metadata)
    )
    expect((client.getService as jest.Mock).mock.calls[0][0]).toBe(
      PERMISSION_MANAGEMENT_SERVICE_NAME
    )
  })

  it('permission adapter should preserve standardized business payloads coming back through native gRPC transport errors', async () => {
    const payload = {
      grpcStatus: GrpcStatus.INTERNAL,
      code: 'ROLE_NOT_ASSIGNABLE',
      message: 'Role is not assignable in the current tenant context',
      details: {
        roleId: 'role-1'
      },
      meta: {
        traceId: 'trace-1'
      }
    }
    const grantInitialAccessForEmployeeAccount = jest.fn().mockReturnValue(
      throwError(() =>
        Object.assign(new Error(payload.message), {
          code: GrpcStatus.INTERNAL,
          details: JSON.stringify(payload)
        })
      )
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        grantInitialAccessForEmployeeAccount
      })
    } as unknown as ClientGrpc
    const adapter = new PermissionOnboardingGrantGrpcAdapter(client)
    attachTrustedProducer(adapter)

    adapter.onModuleInit()

    const error = await adapter
      .grantInitialAccessForEmployeeAccount({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        roleIds: ['role-1'],
        idempotencyKey: 'grant-key-1',
        operatorContext: {
          operatorId: 'operator-1',
          operatorType: 'HUMAN',
          tenantId: 'tenant-1'
        }
      })
      .then(
        () => null,
        (reason) => reason
      )

    expect(error).toBeInstanceOf(RpcException)
    expect((error as RpcException).getError()).toMatchObject(payload)
  })
})
