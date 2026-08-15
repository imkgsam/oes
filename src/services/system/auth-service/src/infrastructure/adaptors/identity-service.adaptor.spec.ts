import { of } from 'rxjs'
import { ClientGrpc } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
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
    const adaptor = new IdentityServiceAdaptor(client)
    const forBusinessCall = jest.fn().mockResolvedValue(metadata)
    ;(adaptor as any).trusted = { forBusinessCall }
    adaptor.onModuleInit()

    const result = await adaptor.getUserById('user-1')
    expect(result).toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      phone: undefined,
      fullName: 'User One'
    })

    expect(forBusinessCall).toHaveBeenCalledWith('identity-service', ['identity.account.list'])
    expect(getUserById).toHaveBeenCalledWith({ userId: 'user-1' }, metadata)
  })

  it('obtains an Auth-issued INTERNAL token for resolveIntegrationMachineForAuth', async () => {
    const resolveIntegrationMachineForAuth = jest
      .fn()
      .mockReturnValue(of({ eligible: true, tenantId: 'tenant-1' }))
    const client = {
      getService: jest
        .fn()
        .mockReturnValueOnce({ getUserById: jest.fn() })
    } as unknown as ClientGrpc
    const adaptor = new IdentityServiceAdaptor(client)
    adaptor.onModuleInit()
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer sts-token')
    const forInternalCall = jest.fn().mockResolvedValue(metadata)
    ;(adaptor as any).trusted = { forInternalCall }
    ;(adaptor as any).identityQueryService = { resolveIntegrationMachineForAuth }

    await expect(adaptor.resolveIntegrationMachineForAuth('machine-1')).resolves.toEqual({
      eligible: true,
      tenantId: 'tenant-1'
    })

    expect(forInternalCall).toHaveBeenCalledWith(
      'identity-service',
      'identity.internal.integration_machine.resolve'
    )
    expect(resolveIntegrationMachineForAuth).toHaveBeenCalledWith(
      { integrationMachineId: 'machine-1' },
      expect.any(Metadata)
    )
    const forwardedMetadata = resolveIntegrationMachineForAuth.mock.calls[0][1] as Metadata
    expect(forwardedMetadata.get('authorization')).toEqual(['Bearer sts-token'])
  })
})
