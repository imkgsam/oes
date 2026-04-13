import { of } from 'rxjs'
import {
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore,
  PermissionServicePermissionReadAdaptor
} from '@oes/common/authorization'

describe('permission service permission read adaptor', () => {
  it('应命中短 TTL 缓存，避免重复读取同一 roleId', async () => {
    const listRolePermissions = jest.fn().mockReturnValue(
      of({
        permissions: [
          { code: 'identity.org.membership.add' },
          { code: 'identity.org.membership.add' },
          { code: 'identity.contact.work_email.assign' }
        ]
      })
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        listRolePermissions
      })
    } as any
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => ({} as any)),
      createOperatorScopedMetadata: jest.fn()
    }
    const adaptor = new PermissionServicePermissionReadAdaptor(
      client,
      metadataFactory,
      new GrpcRequestContextStore()
    )

    adaptor.onModuleInit()

    const first = await adaptor.listPermissionCodesByRoleId('role-a')
    const second = await adaptor.listPermissionCodesByRoleId('role-a')

    expect(listRolePermissions).toHaveBeenCalledTimes(1)
    expect(first).toEqual([
      'identity.org.membership.add',
      'identity.contact.work_email.assign'
    ])
    expect(second).toEqual(first)
  })

  it('应按 roleId 分别缓存，不同 roleId 不应互相污染', async () => {
    const listRolePermissions = jest.fn().mockImplementation((request: { roleId?: string }) =>
      of({
        permissions:
          request.roleId === 'role-a'
            ? [{ code: 'identity.org.membership.add' }]
            : [{ code: 'identity.org.membership.remove' }]
      })
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        listRolePermissions
      })
    } as any
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => ({} as any)),
      createOperatorScopedMetadata: jest.fn()
    }
    const adaptor = new PermissionServicePermissionReadAdaptor(
      client,
      metadataFactory,
      new GrpcRequestContextStore()
    )

    adaptor.onModuleInit()

    const permissionsA = await adaptor.listPermissionCodesByRoleId('role-a')
    const permissionsB = await adaptor.listPermissionCodesByRoleId('role-b')

    expect(listRolePermissions).toHaveBeenCalledTimes(2)
    expect(permissionsA).toEqual(['identity.org.membership.add'])
    expect(permissionsB).toEqual(['identity.org.membership.remove'])
  })
})
