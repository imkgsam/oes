import { QueryBus } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { ListAccountWorkEmailAssetsQuery } from '../../src/application/queries/contact/list-account-work-email-assets.query'

describe('contact query 校验', () => {
  it('查询工作邮箱资产命令 / 当 accountId 不是 UUID 时 / 应返回 VALIDATION_FAILED', async () => {
    const queryBus = {
      execute: jest.fn()
    } as unknown as QueryBus
    const validatingQueryBus = new ValidatingQueryBus(queryBus)

    await expect(
      validatingQueryBus.execute(new ListAccountWorkEmailAssetsQuery('invalid-account-id'))
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: VALIDATION_FAILED.code })
    })
    expect(queryBus.execute).not.toHaveBeenCalled()
  })
})
