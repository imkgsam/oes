import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { PermissionServiceAdaptor } from '../../../../src/infrastructure/adaptors/permission-service.adaptor'

describe('PermissionServiceAdaptor', () => {
  it('obtains an Auth-issued INTERNAL token for resolveExternalMachineAuthorizationSnapshot', async () => {
    const adaptor = new PermissionServiceAdaptor({
      getClient: () => ({ getService: jest.fn() })
    } as any)

    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer sts-token')
    const forInternalCall = jest.fn().mockResolvedValue(metadata)
    ;(adaptor as any).trusted = { forInternalCall }
    ;(adaptor as any).permissionService = {
      resolveExternalMachineAuthorizationSnapshot: jest
        .fn()
        .mockReturnValue(
          of({ externalBusinessPermissionCodes: ['sales.order.read'], authzVersion: 'v1' })
        )
    }

    await expect(
      adaptor.resolveExternalMachineAuthorizationSnapshot('machine-1', 'tenant-1')
    ).resolves.toEqual({
      codes: ['sales.order.read'],
      authzVersion: 'v1'
    })

    const forwardedMetadata = (adaptor as any).permissionService
      .resolveExternalMachineAuthorizationSnapshot.mock.calls[0][1] as Metadata
    expect(forwardedMetadata.get('authorization')).toEqual(['Bearer sts-token'])
    expect(forInternalCall).toHaveBeenCalledWith(
      'permission-service',
      'permission.internal.external_machine.snapshot.resolve'
    )
  })
})
