import { ResolveExternalMachineAuthorizationSnapshotHandler } from '../../src/application/queries/authorization/resolve-external-machine-authorization-snapshot.handler'
import { ResolveExternalMachineAuthorizationSnapshotQuery } from '../../src/application/queries/authorization/resolve-external-machine-authorization-snapshot.query'

describe('ResolveExternalMachineAuthorizationSnapshotHandler', () => {
  it('returns only effective explicitly external-eligible BUSINESS codes for the trusted machine tenant', async () => {
    const repository = {
      resolveExternalMachineAuthorizationSnapshot: jest.fn().mockResolvedValue({
        permissionCodes: ['inventory.read'],
        authzVersion: 'binding-1',
        decisionReference: 'permission-snapshot:machine-1:binding-1'
      })
    }
    const handler = new ResolveExternalMachineAuthorizationSnapshotHandler(repository as never)

    await expect(
      handler.execute(new ResolveExternalMachineAuthorizationSnapshotQuery('machine-1', 'tenant-1'))
    ).resolves.toEqual({
      externalBusinessPermissionCodes: ['inventory.read'],
      authzVersion: 'binding-1',
      decisionReference: 'permission-snapshot:machine-1:binding-1'
    })
  })

  it('fails closed when no eligible current machine grant exists', async () => {
    const repository = {
      resolveExternalMachineAuthorizationSnapshot: jest.fn().mockResolvedValue(null)
    }
    const handler = new ResolveExternalMachineAuthorizationSnapshotHandler(repository as never)

    await expect(
      handler.execute(new ResolveExternalMachineAuthorizationSnapshotQuery('machine-1', 'tenant-1'))
    ).resolves.toEqual({ externalBusinessPermissionCodes: [], authzVersion: '', decisionReference: '' })
  })
})
