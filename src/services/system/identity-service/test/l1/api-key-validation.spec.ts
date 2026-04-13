import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { AuthenticateApiKeyCommand } from '../../src/application/commands/service-account/authenticate-api-key.command'
import { CreateApiKeyCommand } from '../../src/application/commands/service-account/create-api-key.command'
import { RotateApiKeyCommand } from '../../src/application/commands/service-account/rotate-api-key.command'
import { GetApiKeyByIdQuery } from '../../src/application/queries/service-account/get-api-key-by-id.query'

describe('api key 校验', () => {
  it('创建 APIKey 命令 / 当 serviceAccountId 不是 UUID 时 / 应返回 VALIDATION_FAILED', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new CreateApiKeyCommand({
          serviceAccountId: 'invalid-service-account-id',
          operatorId: '11111111-1111-4111-8111-111111111111'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
  })

  it('查询 APIKey / 当 apiKeyId 不是 UUID 时 / 应返回 VALIDATION_FAILED', async () => {
    const queryBus = {
      execute: jest.fn()
    } as unknown as QueryBus
    const validatingQueryBus = new ValidatingQueryBus(queryBus)

    await expect(
      validatingQueryBus.execute(new GetApiKeyByIdQuery('invalid-api-key-id'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
  })

  it('轮换 APIKey 命令 / 当 apiKeyId 不是 UUID 时 / 应返回 VALIDATION_FAILED', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(
        new RotateApiKeyCommand({
          apiKeyId: 'invalid-api-key-id',
          operatorId: '11111111-1111-4111-8111-111111111111'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
  })

  it('认证 APIKey 命令 / 当 secret 为空时 / 应返回 VALIDATION_FAILED', async () => {
    const commandBus = {
      execute: jest.fn()
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(new AuthenticateApiKeyCommand(''))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
  })
})
