import { PrismaAccountDirectoryMapper } from '../infrastructure/mappers/prisma-account.mapper'

describe('PrismaAccountDirectoryMapper', () => {
  it('uses the account profile display name as the admin directory user display name', () => {
    const result = PrismaAccountDirectoryMapper.toDomain({
      id: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      avatarUrl: null,
      displayName: '陈双武',
      bio: null,
      isEnable: true,
      Tenant: {
        isActive: true,
        name: '潮州市达屋科技有限公司'
      },
      User: {
        username: 'chen.shuangwu'
      }
    } as any)

    expect(result.displayName).toBe('陈双武')
  })

  it('does not use legacy local tenant active state when mapping account enabled state', () => {
    const result = PrismaAccountDirectoryMapper.toDomain({
      id: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      avatarUrl: null,
      displayName: 'Tenant Account',
      bio: null,
      isEnable: true,
      Tenant: {
        isActive: false,
        name: 'Legacy Local Tenant'
      },
      User: {
        username: 'tenant.account'
      }
    } as any)

    expect(result.isEnabled).toBe(true)
  })
})
