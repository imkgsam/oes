import { QueryBus } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { createAccountSummaryFixture } from '../helpers/identity-fixtures'
import { IdentityQueryGrpcController } from '../../src/interfaces/grpc/identity-query.grpc.controller'

describe('identity query optional result', () => {
  it('当 user 不存在时 / getUserById 应返回空对象', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(null)
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.getUserById({
        userId: '11111111-1111-4111-8111-111111111111'
      })
    ).resolves.toEqual({})
  })

  it('当 account 不存在时 / getAccountById 应返回空对象', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(null)
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.getAccountById({
        accountId: '11111111-1111-4111-8111-111111111111'
      })
    ).resolves.toEqual({})
  })

  it('当 account 存在时 / getAccountById 应返回完整账户资料摘要', async () => {
    const accountId = '11111111-1111-4111-8111-111111111111'
    const queryBus = {
      execute: jest.fn().mockResolvedValue(
        createAccountSummaryFixture({
          id: accountId,
          userId: 'user-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
          displayName: '陈双鹏',
          bio: '负责美隆陶瓷的外贸协同与重点客户经营。',
          isEnabled: true
        })
      )
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.getAccountById({
        accountId
      })
    ).resolves.toEqual({
      account: {
        id: accountId,
        userId: 'user-1',
        tenantId: 'tenant-1',
        avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
        displayName: '陈双鹏',
        bio: '负责美隆陶瓷的外贸协同与重点客户经营。',
        isEnabled: true,
        scopeLevel: 'TENANT'
      }
    })
  })

  it('当 tenant 不存在时 / getTenantById 应返回空对象', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(null)
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.getTenantById({
        tenantId: '11111111-1111-4111-8111-111111111111'
      })
    ).resolves.toEqual({})
  })
})
