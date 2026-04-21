import {
  OperatorContextPayload,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'

describe('role-based operator permission resolver', () => {
  it('应基于 operator_roles 解析并去重 permission codes', async () => {
    const adaptor = {
      listPermissionCodesByRoleId: jest
        .fn()
        .mockImplementation(async (roleId: string) =>
          roleId === 'role-a'
            ? ['identity.contact.work_email.assign', 'identity.contact.work_email.set_status']
            : ['identity.contact.work_email.set_status', 'identity.org.membership.add']
        )
    } as unknown as PermissionServicePermissionReadAdaptor
    const resolver = new RoleBasedOperatorPermissionResolver(adaptor)

    const permissions = await resolver.resolvePermissions({
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig',
      operator_roles: [' role-a ', 'role-b', 'role-a', '']
    } as OperatorContextPayload)

    expect(adaptor.listPermissionCodesByRoleId).toHaveBeenCalledTimes(2)
    expect(adaptor.listPermissionCodesByRoleId).toHaveBeenNthCalledWith(
      1,
      'role-a',
      expect.objectContaining({
        operator_id: '11111111-1111-4111-8111-111111111111',
        operator_roles: [' role-a ', 'role-b', 'role-a', '']
      })
    )
    expect(adaptor.listPermissionCodesByRoleId).toHaveBeenNthCalledWith(
      2,
      'role-b',
      expect.objectContaining({
        operator_id: '11111111-1111-4111-8111-111111111111',
        operator_roles: [' role-a ', 'role-b', 'role-a', '']
      })
    )
    expect(permissions).toEqual([
      'identity.contact.work_email.assign',
      'identity.contact.work_email.set_status',
      'identity.org.membership.add'
    ])
  })

  it('当 operator_roles 缺失时 / 应直接返回空权限集合', async () => {
    const adaptor = {
      listPermissionCodesByRoleId: jest.fn()
    } as unknown as PermissionServicePermissionReadAdaptor
    const resolver = new RoleBasedOperatorPermissionResolver(adaptor)

    const permissions = await resolver.resolvePermissions({
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig'
    } as OperatorContextPayload)

    expect(adaptor.listPermissionCodesByRoleId).not.toHaveBeenCalled()
    expect(permissions).toEqual([])
  })
})
