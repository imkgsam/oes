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
})
