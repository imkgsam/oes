import { PermissionServicePermissionReadAdaptor } from '../adaptors'
import { OperatorContextPayload } from '../types'
import { RoleBasedOperatorPermissionResolver } from './role-based-operator-permission-resolver.service'

describe('RoleBasedOperatorPermissionResolver', () => {
  it('resolves permissions through the operator account access summary', async () => {
    const permissionReadAdaptor = {
      listPermissionCodesByOperatorContext: jest
        .fn()
        .mockResolvedValue(['auth.session.admin.view', 'auth.audit.list']),
      listPermissionCodesByRoleId: jest.fn()
    } as unknown as PermissionServicePermissionReadAdaptor
    const resolver = new RoleBasedOperatorPermissionResolver(permissionReadAdaptor)
    const operatorContext: OperatorContextPayload = {
      operator_id: 'account-admin-1',
      operator_type: 'USER',
      tenant_id: undefined,
      issued_at: '2026-04-17T00:00:00.000Z',
      expires_at: '2026-04-17T00:05:00.000Z',
      issuer: 'api-gateway',
      operator_roles: ['role-system-admin'],
      signature: 'signature'
    }

    await expect(resolver.resolvePermissions(operatorContext)).resolves.toEqual([
      'auth.session.admin.view',
      'auth.audit.list'
    ])
    expect(permissionReadAdaptor.listPermissionCodesByOperatorContext).toHaveBeenCalledWith(
      operatorContext
    )
    expect(permissionReadAdaptor.listPermissionCodesByRoleId).not.toHaveBeenCalled()
  })
})
