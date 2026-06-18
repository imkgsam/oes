import { QueryBus } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { createAccountSummaryFixture } from '../helpers/identity-fixtures'
import { createUserSummaryFixture } from '../helpers/identity-fixtures'
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

  it('当员工登录账号无法解析时 / resolveEmployeeLoginAccount 应返回空对象', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(null)
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.resolveEmployeeLoginAccount({
        tenantId: 'tenant-1',
        employeeId: '11111111-1111-4111-8111-111111111111'
      })
    ).resolves.toEqual({})
  })

  it('当 user 存在时 / getUserById 应返回完整用户资料摘要且不带 party 绑定', async () => {
    const userId = '11111111-1111-4111-8111-111111111111'
    const queryBus = {
      execute: jest.fn().mockResolvedValue(
        createUserSummaryFixture({
          id: userId,
          username: 'legacy-handle',
          personalEmail: 'user@example.com',
          personalPhone: '+8613900000001',
          isActive: true,
        }),
      ),
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.getUserById({
        userId,
      }),
    ).resolves.toEqual({
      user: {
        id: userId,
        username: 'legacy-handle',
        personalEmail: 'user@example.com',
        personalPhone: '+8613900000001',
        isActive: true,
      },
    })
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
        tenantPartyId: 'tenant-party-1',
        avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
        avatarAssetId: '',
        displayName: '陈双鹏',
        bio: '负责美隆陶瓷的外贸协同与重点客户经营。',
        isEnabled: true,
        scopeLevel: 'TENANT'
      }
    })
  })

  it('当员工登录账号可解析时 / resolveEmployeeLoginAccount 应返回账号登录摘要', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: '陈双鹏',
        accountEnabled: true
      })
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.resolveEmployeeLoginAccount({
        tenantId: 'tenant-1',
        employeeId: '11111111-1111-4111-8111-111111111111'
      })
    ).resolves.toEqual({
      account: {
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: '陈双鹏',
        accountEnabled: true
      }
    })
  })

  it('当联系方式动作目标可解析时 / resolveContactActionTargets 应返回 public-safe summary', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        targets: [
          {
            contactActionType: 'OPEN_WHATSAPP',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'asset-whatsapp',
            renderable: true,
            hiddenReason: null,
            publicValueSummary: {
              type: 'WHATSAPP',
              provider: null,
              label: 'Regional WhatsApp',
              displayValue: '+44 20 7946 0321',
              actionValue: '+442079460321',
              actionUri: 'https://wa.me/442079460321',
              includeInVCardAllowed: false
            }
          }
        ]
      })
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.resolveContactActionTargets({
        tenantId: 'tenant-1',
        accountId: 'account-1',
        employeeId: 'employee-1',
        targetRefs: [
          {
            contactActionType: 'OPEN_WHATSAPP',
            targetRefType: 'CONTACT_ASSET',
            targetRefId: 'asset-whatsapp'
          }
        ]
      })
    ).resolves.toEqual({
      targets: [
        {
          contactActionType: 'OPEN_WHATSAPP',
          targetRefType: 'CONTACT_ASSET',
          targetRefId: 'asset-whatsapp',
          renderable: true,
          hiddenReason: '',
          publicValueSummary: {
            type: 'WHATSAPP',
            provider: '',
            label: 'Regional WhatsApp',
            displayValue: '+44 20 7946 0321',
            actionValue: '+442079460321',
            actionUri: 'https://wa.me/442079460321',
            includeInVCardAllowed: false
          }
        }
      ]
    })
  })
})
