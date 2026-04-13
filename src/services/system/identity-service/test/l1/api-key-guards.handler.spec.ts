import {
  API_KEY_STATUSES,
  IDENTITY_API_KEY_ALREADY_REVOKED,
  IDENTITY_API_KEY_EXPIRED,
  IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE,
  IDENTITY_API_KEY_INVALID,
  IDENTITY_API_KEY_NOT_FOUND,
  IDENTITY_SERVICE_ACCOUNT_DISABLED,
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  MACHINE_PRINCIPAL_STATUSES,
} from '../../src/common/constants'
import { ACCESS_DENIED } from '@oes/common/exceptions'
import { CheckResourceService } from '../../src/application/authorization'
import { AuthenticateApiKeyCommand } from '../../src/application/commands/service-account/authenticate-api-key.command'
import { AuthenticateApiKeyHandler } from '../../src/application/commands/service-account/authenticate-api-key.handler'
import {
  CreateApiKeyCommand
} from '../../src/application/commands/service-account/create-api-key.command'
import {
  CreateApiKeyHandler
} from '../../src/application/commands/service-account/create-api-key.handler'
import {
  RevokeApiKeyCommand
} from '../../src/application/commands/service-account/revoke-api-key.command'
import {
  RevokeApiKeyHandler
} from '../../src/application/commands/service-account/revoke-api-key.handler'
import { RotateApiKeyCommand } from '../../src/application/commands/service-account/rotate-api-key.command'
import { RotateApiKeyHandler } from '../../src/application/commands/service-account/rotate-api-key.handler'
import {
  createApiKeyFixture,
  createApiKeyRepositoryMock,
  createServiceAccountFixture,
  createServiceAccountRepositoryMock
} from '../helpers/machine-fixtures'

describe('api key 规则', () => {
  const activeServiceAccount = createServiceAccountFixture()
  const checkResourceService = new CheckResourceService()

  it('创建 APIKey / 当 service account 不存在时 / 应返回 IDENTITY_SERVICE_ACCOUNT_NOT_FOUND', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const apiKeyRepository = createApiKeyRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(null)
    const handler = new CreateApiKeyHandler(
      serviceAccountRepository,
      apiKeyRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new CreateApiKeyCommand({
          serviceAccountId: activeServiceAccount.id,
          operatorId: '11111111-1111-4111-8111-111111111111'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_SERVICE_ACCOUNT_NOT_FOUND.code })
    })
  })

  it('创建 APIKey / 当 service account 为禁用状态时 / 应返回 IDENTITY_SERVICE_ACCOUNT_DISABLED', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const apiKeyRepository = createApiKeyRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: activeServiceAccount.id,
        status: MACHINE_PRINCIPAL_STATUSES.DISABLED,
        disabledAt: new Date('2026-03-28T01:00:00.000Z'),
        disabledBy: '11111111-1111-4111-8111-111111111111'
      })
    )
    const handler = new CreateApiKeyHandler(
      serviceAccountRepository,
      apiKeyRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new CreateApiKeyCommand({
          serviceAccountId: activeServiceAccount.id,
          operatorId: '11111111-1111-4111-8111-111111111111'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_SERVICE_ACCOUNT_DISABLED.code })
    })
  })

  it('创建 APIKey / 当 expiresAt 不在未来时 / 应返回 IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const apiKeyRepository = createApiKeyRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(activeServiceAccount)
    const handler = new CreateApiKeyHandler(
      serviceAccountRepository,
      apiKeyRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new CreateApiKeyCommand({
          serviceAccountId: activeServiceAccount.id,
          expiresAt: '2020-01-01T00:00:00.000Z',
          operatorId: '11111111-1111-4111-8111-111111111111'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE.code })
    })
  })

  it('创建 APIKey / 当 tenant scope 操作者访问跨租户 service account 时 / 应返回 ACCESS_DENIED', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const apiKeyRepository = createApiKeyRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: activeServiceAccount.id,
        tenantId: 'tenant-b'
      })
    )
    const handler = new CreateApiKeyHandler(
      serviceAccountRepository,
      apiKeyRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new CreateApiKeyCommand({
          serviceAccountId: activeServiceAccount.id,
          operatorId: '11111111-1111-4111-8111-111111111111',
          operatorScope: {
            tenantId: 'tenant-a',
            isSystemScope: false
          }
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: ACCESS_DENIED.code })
    })
  })

  it('撤销 APIKey / 当 APIKey 不存在时 / 应返回 IDENTITY_API_KEY_NOT_FOUND', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findById.mockResolvedValue(null)
    const handler = new RevokeApiKeyHandler(
      apiKeyRepository,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new RevokeApiKeyCommand(
          '11111111-1111-4111-8111-111111111111',
          '22222222-2222-4222-8222-222222222222'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_API_KEY_NOT_FOUND.code })
    })
  })

  it('撤销 APIKey / 当 APIKey 已撤销时 / 应返回 IDENTITY_API_KEY_ALREADY_REVOKED', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findById.mockResolvedValue(
      createApiKeyFixture({
        serviceAccountId: activeServiceAccount.id,
        keyCode: 'key_abc',
        status: API_KEY_STATUSES.REVOKED,
        updatedAt: new Date('2026-03-28T01:00:00.000Z'),
        revokedAt: new Date('2026-03-28T01:00:00.000Z'),
        revokedBy: '22222222-2222-4222-8222-222222222222'
      })
    )
    serviceAccountRepository.findById.mockResolvedValue(activeServiceAccount)
    const handler = new RevokeApiKeyHandler(
      apiKeyRepository,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new RevokeApiKeyCommand(
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          '22222222-2222-4222-8222-222222222222'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_API_KEY_ALREADY_REVOKED.code })
    })
  })

  it('认证 APIKey / 当 secret 无法匹配任何 APIKey 时 / 应返回 IDENTITY_API_KEY_INVALID', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findByHashedValue.mockResolvedValue(null)
    const handler = new AuthenticateApiKeyHandler(apiKeyRepository, serviceAccountRepository)

    await expect(handler.execute(new AuthenticateApiKeyCommand('sk_missing'))).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_API_KEY_INVALID.code })
    })
  })

  it('认证 APIKey / 当 APIKey 已过期时 / 应返回 IDENTITY_API_KEY_EXPIRED', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findByHashedValue.mockResolvedValue(
      createApiKeyFixture({
        serviceAccountId: activeServiceAccount.id,
        keyCode: 'key_expired',
        expiresAt: new Date('2020-01-01T00:00:00.000Z')
      })
    )
    const handler = new AuthenticateApiKeyHandler(apiKeyRepository, serviceAccountRepository)

    await expect(handler.execute(new AuthenticateApiKeyCommand('sk_expired'))).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_API_KEY_EXPIRED.code })
    })
  })

  it('认证 APIKey / 当 service account 可用时 / 应刷新 lastUsedAt 并返回 principal', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const activeApiKey = createApiKeyFixture({
      serviceAccountId: activeServiceAccount.id,
      keyCode: 'key_live'
    })
    const touchedApiKey = createApiKeyFixture({
      id: activeApiKey.id,
      serviceAccountId: activeApiKey.serviceAccountId,
      keyCode: activeApiKey.keyCode,
      lastUsedAt: new Date('2026-03-28T03:00:00.000Z'),
      updatedAt: new Date('2026-03-28T03:00:00.000Z')
    })
    apiKeyRepository.findByHashedValue.mockResolvedValue(activeApiKey)
    apiKeyRepository.touchLastUsed.mockResolvedValue(touchedApiKey)
    serviceAccountRepository.findById.mockResolvedValue(activeServiceAccount)
    const handler = new AuthenticateApiKeyHandler(apiKeyRepository, serviceAccountRepository)

    const result = await handler.execute(new AuthenticateApiKeyCommand('sk_live'))

    expect(apiKeyRepository.touchLastUsed).toHaveBeenCalledWith({
      apiKeyId: activeApiKey.id
    })
    expect(result.apiKey.lastUsedAt).toEqual(new Date('2026-03-28T03:00:00.000Z'))
    expect(result.serviceAccount.id).toBe(activeServiceAccount.id)
  })

  it('轮换 APIKey / 当当前 key 不存在时 / 应返回 IDENTITY_API_KEY_NOT_FOUND', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findById.mockResolvedValue(null)
    const handler = new RotateApiKeyHandler(
      apiKeyRepository,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new RotateApiKeyCommand({
          apiKeyId: '11111111-1111-4111-8111-111111111111',
          operatorId: '22222222-2222-4222-8222-222222222222'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_API_KEY_NOT_FOUND.code })
    })
  })

  it('轮换 APIKey / 当 service account 已禁用时 / 应返回 IDENTITY_SERVICE_ACCOUNT_DISABLED', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findById.mockResolvedValue(
      createApiKeyFixture({
        serviceAccountId: activeServiceAccount.id,
        keyCode: 'key_rotate'
      })
    )
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: activeServiceAccount.id,
        status: MACHINE_PRINCIPAL_STATUSES.DISABLED,
        disabledAt: new Date('2026-03-28T01:00:00.000Z'),
        disabledBy: '11111111-1111-4111-8111-111111111111'
      })
    )
    const handler = new RotateApiKeyHandler(
      apiKeyRepository,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new RotateApiKeyCommand({
          apiKeyId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          operatorId: '22222222-2222-4222-8222-222222222222'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: IDENTITY_SERVICE_ACCOUNT_DISABLED.code })
    })
  })

  it('撤销 APIKey / 当 tenant scope 操作者读取跨租户资源时 / 应返回 ACCESS_DENIED', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findById.mockResolvedValue(
      createApiKeyFixture({
        serviceAccountId: activeServiceAccount.id,
        keyCode: 'key_cross_tenant'
      })
    )
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: activeServiceAccount.id,
        tenantId: 'tenant-b'
      })
    )
    const handler = new RevokeApiKeyHandler(
      apiKeyRepository,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new RevokeApiKeyCommand(
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          '22222222-2222-4222-8222-222222222222',
          {
            operatorId: '22222222-2222-4222-8222-222222222222',
            tenantId: 'tenant-a',
            isSystemScope: false
          }
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: ACCESS_DENIED.code })
    })
  })

  it('轮换 APIKey / 当 tenant scope 操作者读取跨租户资源时 / 应返回 ACCESS_DENIED', async () => {
    const apiKeyRepository = createApiKeyRepositoryMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    apiKeyRepository.findById.mockResolvedValue(
      createApiKeyFixture({
        serviceAccountId: activeServiceAccount.id,
        keyCode: 'key_cross_tenant_rotate'
      })
    )
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: activeServiceAccount.id,
        tenantId: 'tenant-b'
      })
    )
    const handler = new RotateApiKeyHandler(
      apiKeyRepository,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new RotateApiKeyCommand({
          apiKeyId: '11111111-1111-4111-8111-111111111111',
          operatorId: '22222222-2222-4222-8222-222222222222',
          operatorScope: {
            operatorId: '22222222-2222-4222-8222-222222222222',
            tenantId: 'tenant-a',
            isSystemScope: false
          }
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: ACCESS_DENIED.code })
    })
  })
})
