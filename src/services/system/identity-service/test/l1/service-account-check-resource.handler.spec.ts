import { ACCESS_DENIED } from '@oes/common/exceptions'
import { CheckResourceService } from '../../src/application/authorization'
import { GetAccountByIdHandler } from '../../src/application/queries/account/get-account-by-id.handler'
import { GetAccountByIdQuery } from '../../src/application/queries/account/get-account-by-id.query'
import { GetApiKeyByIdHandler } from '../../src/application/queries/service-account/get-api-key-by-id.handler'
import { GetApiKeyByIdQuery } from '../../src/application/queries/service-account/get-api-key-by-id.query'
import { GetServiceAccountByIdHandler } from '../../src/application/queries/service-account/get-service-account-by-id.handler'
import { GetServiceAccountByIdQuery } from '../../src/application/queries/service-account/get-service-account-by-id.query'
import {
  createAccountRepositoryMock,
  createAccountSummaryFixture
} from '../helpers/identity-fixtures'
import {
  createApiKeyFixture,
  createApiKeyRepositoryMock,
  createServiceAccountFixture,
  createServiceAccountRepositoryMock
} from '../helpers/machine-fixtures'

// Verifies detail query handlers enforce checkResource before returning cross-tenant resources.
describe('service-account detail checkResource handlers', () => {
  it('getAccountById / 应拒绝 tenant scope 读取跨租户 account', async () => {
    const accountRepository = createAccountRepositoryMock()
    accountRepository.findById.mockResolvedValue(
      createAccountSummaryFixture({
        id: 'account-1',
        tenantId: 'tenant-b'
      })
    )

    const handler = new GetAccountByIdHandler(accountRepository, new CheckResourceService())

    await expect(
      handler.execute(
        new GetAccountByIdQuery('33333333-3333-3333-3333-333333333333', {
          operatorId: 'operator-3',
          tenantId: 'tenant-a',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
  })

  it('getServiceAccountById / 应拒绝 tenant scope 读取跨租户 service account', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: 'service-account-1',
        tenantId: 'tenant-b'
      })
    )

    const handler = new GetServiceAccountByIdHandler(
      serviceAccountRepository,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new GetServiceAccountByIdQuery('11111111-1111-1111-1111-111111111111', {
          operatorId: 'operator-1',
          tenantId: 'tenant-a',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
  })

  it('getApiKeyById / 应拒绝 tenant scope 读取跨租户 api key', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()

    apiKeyRepository.findById.mockResolvedValue(
      createApiKeyFixture({
        id: 'api-key-1',
        serviceAccountId: 'service-account-2'
      })
    )
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: 'service-account-2',
        tenantId: 'tenant-b'
      })
    )

    const handler = new GetApiKeyByIdHandler(
      apiKeyRepository,
      serviceAccountRepository,
      new CheckResourceService()
    )

    await expect(
      handler.execute(
        new GetApiKeyByIdQuery('22222222-2222-2222-2222-222222222222', {
          operatorId: 'operator-2',
          tenantId: 'tenant-a',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
  })
})
