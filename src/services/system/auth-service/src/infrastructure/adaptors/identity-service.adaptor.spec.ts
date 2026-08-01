import { of } from 'rxjs'
import { ClientGrpc } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { GrpcMetadataPropagationFactory, GrpcRequestContextStore } from '@oes/common/authorization'
import { IdentityServiceAdaptor } from './identity-service.adaptor'

describe('IdentityServiceAdaptor', () => {
  it('should propagate request and trace metadata to identity-service', async () => {
    const getUserById = jest.fn().mockReturnValue(
      of({
        user: {
          id: 'user-1',
          personalEmail: 'user@example.com',
          username: 'User One'
        }
      })
    )
    const client = {
      getService: jest.fn(() => ({
        getUserById
      }))
    } as unknown as ClientGrpc

    const metadata = new Metadata()
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => metadata),
      createOperatorScopedMetadata: jest.fn()
    }
    const store = new GrpcRequestContextStore()
    const adaptor = new IdentityServiceAdaptor(client, metadataFactory, store)
    adaptor.onModuleInit()

    await store.run(
      {
        internalServiceName: 'api-gateway',
        requestId: 'req-identity',
        traceId: 'trace-identity'
      },
      async () => {
        const result = await adaptor.getUserById('user-1')
        expect(result).toEqual({
          userId: 'user-1',
          email: 'user@example.com',
          phone: undefined,
          fullName: 'User One'
        })
      }
    )

    expect(metadataFactory.createInternalCallMetadata).toHaveBeenCalledWith({
      callerServiceName: 'auth-service',
      requestId: 'req-identity',
      traceId: 'trace-identity'
    })
    expect(getUserById).toHaveBeenCalledWith({ userId: 'user-1' }, metadata)
  })

  it('obtains an Auth-issued INTERNAL token for resolveIntegrationMachineForAuth', async () => {
    const exchangeExecutionToken = jest.fn().mockReturnValue(of({ accessToken: 'sts-token' }))
    const resolveIntegrationMachineForAuth = jest
      .fn()
      .mockReturnValue(of({ eligible: true, tenantId: 'tenant-1' }))
    const client = {
      getService: jest
        .fn()
        .mockReturnValueOnce({ getUserById: jest.fn() })
    } as unknown as ClientGrpc
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => {
        const metadata = new Metadata()
        metadata.set('x-request-id', 'req-identity')
        metadata.set('x-trace-id', 'trace-identity')
        return metadata
      }),
      createOperatorScopedMetadata: jest.fn()
    }
    const store = new GrpcRequestContextStore()
    const adaptor = new IdentityServiceAdaptor(client, metadataFactory, store)
    adaptor.onModuleInit()
    ;(adaptor as any).executionTokenService = { exchangeExecutionToken }
    ;(adaptor as any).trustedIdentityQueryService = { resolveIntegrationMachineForAuth }

    await store.run(
      {
        internalServiceName: 'auth-service',
        requestId: 'req-identity',
        traceId: 'trace-identity'
      },
      async () => {
        await expect(adaptor.resolveIntegrationMachineForAuth('machine-1')).resolves.toEqual({
          eligible: true,
          tenantId: 'tenant-1'
        })
      }
    )

    expect(exchangeExecutionToken).toHaveBeenCalledWith(
      {
        targetAudience: 'urn:oes:service:identity-service',
        requestedPermissionCodes: ['identity.internal.integration_machine.resolve']
      },
      expect.any(Metadata)
    )
    expect(resolveIntegrationMachineForAuth).toHaveBeenCalledWith(
      { integrationMachineId: 'machine-1' },
      expect.any(Metadata)
    )
    const forwardedMetadata = resolveIntegrationMachineForAuth.mock.calls[0][1] as Metadata
    expect(forwardedMetadata.get('authorization')).toEqual(['Bearer sts-token'])
  })
})
