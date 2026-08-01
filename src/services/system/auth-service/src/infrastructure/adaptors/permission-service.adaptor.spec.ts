import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { PermissionServiceAdaptor } from './permission-service.adaptor'

describe('PermissionServiceAdaptor', () => {
  it('obtains an Auth-issued INTERNAL token for resolveExternalMachineAuthorizationSnapshot', async () => {
    const adaptor = new PermissionServiceAdaptor(
      { getService: jest.fn() } as any,
      {
        createInternalCallMetadata: jest.fn(() => new Metadata()),
        createOperatorScopedMetadata: jest.fn()
      } as any,
      {
        getContext: jest.fn(() => ({ requestId: 'req-1', traceId: 'trace-1' }))
      } as any
    )

    ;(adaptor as any).executionTokenService = {
      exchangeExecutionToken: jest.fn().mockReturnValue(of({ accessToken: 'sts-token' }))
    }
    ;(adaptor as any).trustedPermissionService = {
      resolveExternalMachineAuthorizationSnapshot: jest
        .fn()
        .mockReturnValue(of({ externalBusinessPermissionCodes: ['sales.order.read'], authzVersion: 'v1' }))
    }

    await expect(
      adaptor.resolveExternalMachineAuthorizationSnapshot('machine-1', 'tenant-1')
    ).resolves.toEqual({
      codes: ['sales.order.read'],
      authzVersion: 'v1'
    })

    const forwardedMetadata = (adaptor as any).trustedPermissionService
      .resolveExternalMachineAuthorizationSnapshot.mock.calls[0][1] as Metadata
    expect(forwardedMetadata.get('authorization')).toEqual(['Bearer sts-token'])
  })
})
