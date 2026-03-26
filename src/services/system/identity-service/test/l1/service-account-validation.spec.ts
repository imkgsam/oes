import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { CreateServiceAccountCommand } from '../../src/application/commands/service-account/create-service-account.command'
import { GetServiceAccountByIdQuery } from '../../src/application/queries/service-account/get-service-account-by-id.query'

describe('service account 鏍￠獙', () => {
  it('鍒涘缓 service account 鍛戒护 / 褰?scopeLevel 涓嶅湪鍚堟硶鍊煎唴鏃? / 搴旇繑鍥?VALIDATION_FAILED', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new CreateServiceAccountCommand({
          tenantId: '11111111-1111-4111-8111-111111111111',
          scopeLevel: 'INVALID_SCOPE',
          type: 'AI_AGENT',
          name: 'assistant-agent',
          operatorId: '22222222-2222-4222-8222-222222222222'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(commandBus.execute).not.toHaveBeenCalled()
  })

  it('鏌ヨ service account / 褰?serviceAccountId 涓嶆槸 UUID 鏃? / 搴旇繑鍥?VALIDATION_FAILED', async () => {
    const queryBus = {
      execute: jest.fn()
    } as unknown as QueryBus
    const validatingQueryBus = new ValidatingQueryBus(queryBus)

    await expect(
      validatingQueryBus.execute(new GetServiceAccountByIdQuery('invalid-service-account-id'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(queryBus.execute).not.toHaveBeenCalled()
  })
})
