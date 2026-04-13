import { CommandBus } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { AssignAccountWorkEmailAssetCommand } from '../../src/application/commands/contact/assign-account-work-email-asset.command'
import { SetAccountPrimaryWorkEmailAssetCommand } from '../../src/application/commands/contact/set-account-primary-work-email-asset.command'

describe('contact command 校验', () => {
  it('分配工作邮箱命令 / 当 accountId 不是 UUID 时 / 应返回 VALIDATION_FAILED', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new AssignAccountWorkEmailAssetCommand(
          'invalid-account-id',
          'user@corp.com',
          false,
          '11111111-1111-4111-8111-111111111111'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(commandBus.execute).not.toHaveBeenCalled()
  })

  it('设置主工作邮箱命令 / 当 operatorId 不是 UUID 时 / 应返回 VALIDATION_FAILED', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new SetAccountPrimaryWorkEmailAssetCommand(
          '11111111-1111-4111-8111-111111111111',
          'invalid-operator-id'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(commandBus.execute).not.toHaveBeenCalled()
  })
})
