import {
  OperatorContextPayload,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'

describe('role-based operator permission resolver', () => {
  it('应委托 permission read adaptor 按 operator context 解析 permission codes', async () => {
    const adaptor = {
      listPermissionCodesByOperatorContext: jest.fn().mockResolvedValue([
        'identity.contact.work_email.assign',
        'identity.contact.work_email.set_status',
        'identity.contact.work_phone.assign'
      ])
    } as unknown as PermissionServicePermissionReadAdaptor
    const resolver = new RoleBasedOperatorPermissionResolver(adaptor)
    const operatorContext = {
      operator_id: '11111111-1111-4111-8111-111111111111',
      operator_type: 'HUMAN',
      issued_at: '2026-03-30T00:00:00.000Z',
      expires_at: '2026-03-30T01:00:00.000Z',
      issuer: 'auth-service',
      signature: 'sig',
      operator_roles: [' role-a ', 'role-b', 'role-a', '']
    } as OperatorContextPayload

    const permissions = await resolver.resolvePermissions(operatorContext)

    expect(adaptor.listPermissionCodesByOperatorContext).toHaveBeenCalledWith(
      operatorContext
    )
    expect(permissions).toEqual([
      'identity.contact.work_email.assign',
      'identity.contact.work_email.set_status',
      'identity.contact.work_phone.assign'
    ])
  })

  it('当 operator_roles 缺失时 / 应直接返回空权限集合', async () => {
    const adaptor = {
      listPermissionCodesByOperatorContext: jest.fn().mockResolvedValue([])
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

    expect(adaptor.listPermissionCodesByOperatorContext).toHaveBeenCalled()
    expect(permissions).toEqual([])
  })
})
