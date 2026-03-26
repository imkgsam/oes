import {
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT,
  IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT,
  IDENTITY_TENANT_NOT_FOUND,
  MACHINE_PRINCIPAL_SCOPE_LEVELS,
  MACHINE_PRINCIPAL_STATUSES,
  MACHINE_PRINCIPAL_TYPES
} from '../../src/common/constants'
import { CreateServiceAccountCommand } from '../../src/application/commands/service-account/create-service-account.command'
import { CreateServiceAccountHandler } from '../../src/application/commands/service-account/create-service-account.handler'
import { SetServiceAccountEnabledCommand } from '../../src/application/commands/service-account/set-service-account-enabled.command'
import { SetServiceAccountEnabledHandler } from '../../src/application/commands/service-account/set-service-account-enabled.handler'
import { ServiceAccountEntity } from '../../src/domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../src/domain/repositories/service-account.repository'
import { TenantRepository } from '../../src/domain/repositories/tenant.repository'

describe('service account 瑙勫垯', () => {
  const createTenantRepository = (): jest.Mocked<TenantRepository> =>
    ({
      findById: jest.fn()
    }) as unknown as jest.Mocked<TenantRepository>

  const createServiceAccountRepository = (): jest.Mocked<ServiceAccountRepository> =>
    ({
      findById: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      setStatus: jest.fn()
    }) as unknown as jest.Mocked<ServiceAccountRepository>

  const tenant = {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'tenant-a',
    name: 'Tenant A',
    isActive: true
  }

  const serviceAccount = new ServiceAccountEntity(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    tenant.id,
    MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
    MACHINE_PRINCIPAL_TYPES.AI_AGENT,
    'assistant-agent',
    'tenant assistant',
    MACHINE_PRINCIPAL_STATUSES.ACTIVE,
    new Date('2026-03-25T08:00:00.000Z'),
    new Date('2026-03-25T08:00:00.000Z'),
    '22222222-2222-4222-8222-222222222222',
    null,
    null
  )

  it('鍒涘缓 service account / 褰?scopeLevel 涓?TENANT 涓斾笉浼犲叆 tenantId 鏃? / 搴旇繑鍥?IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT', async () => {
    const tenantRepository = createTenantRepository()
    const serviceAccountRepository = createServiceAccountRepository()
    const handler = new CreateServiceAccountHandler(tenantRepository, serviceAccountRepository)

    await expect(
      handler.execute(
        new CreateServiceAccountCommand({
          scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
          type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
          name: 'assistant-agent',
          operatorId: '22222222-2222-4222-8222-222222222222'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT.code
      })
    })
  })

  it('鍒涘缓 service account / 褰?scopeLevel 涓?SYSTEM 浣嗕紶鍏?tenantId 鏃? / 搴旇繑鍥?IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT', async () => {
    const tenantRepository = createTenantRepository()
    const serviceAccountRepository = createServiceAccountRepository()
    const handler = new CreateServiceAccountHandler(tenantRepository, serviceAccountRepository)

    await expect(
      handler.execute(
        new CreateServiceAccountCommand({
          tenantId: tenant.id,
          scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM,
          type: MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE,
          name: 'system-agent',
          operatorId: '22222222-2222-4222-8222-222222222222'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT.code
      })
    })
  })

  it('鍒涘缓 service account / 褰?tenantId 鍦ㄧ鎴疯寖鍥村唴浣嗙鎴蜂笉瀛樺湪鏃? / 搴旇繑鍥?IDENTITY_TENANT_NOT_FOUND', async () => {
    const tenantRepository = createTenantRepository()
    const serviceAccountRepository = createServiceAccountRepository()
    tenantRepository.findById.mockResolvedValue(null)
    const handler = new CreateServiceAccountHandler(tenantRepository, serviceAccountRepository)

    await expect(
      handler.execute(
        new CreateServiceAccountCommand({
          tenantId: tenant.id,
          scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
          type: MACHINE_PRINCIPAL_TYPES.EXTERNAL_INTEGRATION,
          name: 'erp-sync',
          operatorId: '22222222-2222-4222-8222-222222222222'
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_TENANT_NOT_FOUND.code
      })
    })
  })

  it('鍒涘缓 service account / 褰撳弬鏁板悎娉曟椂 / 搴旇皟鐢ㄤ粨鍌ㄥ垱寤哄苟鍐欏叆 createdBy', async () => {
    const tenantRepository = createTenantRepository()
    const serviceAccountRepository = createServiceAccountRepository()
    tenantRepository.findById.mockResolvedValue(tenant as any)
    serviceAccountRepository.create.mockResolvedValue(serviceAccount)
    const handler = new CreateServiceAccountHandler(tenantRepository, serviceAccountRepository)

    await expect(
      handler.execute(
        new CreateServiceAccountCommand({
          tenantId: tenant.id,
          scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
          type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
          name: 'assistant-agent',
          description: 'tenant assistant',
          operatorId: '22222222-2222-4222-8222-222222222222'
        })
      )
    ).resolves.toBe(serviceAccount)

    expect(serviceAccountRepository.create).toHaveBeenCalledWith({
      tenantId: tenant.id,
      scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
      type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
      name: 'assistant-agent',
      description: 'tenant assistant',
      createdBy: '22222222-2222-4222-8222-222222222222'
    })
  })

  it('璁剧疆 service account 鍚敤鐘舵€? / 褰撶洰鏍?service account 涓嶅瓨鍦ㄦ椂 / 搴旇繑鍥?IDENTITY_SERVICE_ACCOUNT_NOT_FOUND', async () => {
    const serviceAccountRepository = createServiceAccountRepository()
    serviceAccountRepository.findById.mockResolvedValue(null)
    const handler = new SetServiceAccountEnabledHandler(serviceAccountRepository)

    await expect(
      handler.execute(
        new SetServiceAccountEnabledCommand(
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          false,
          '22222222-2222-4222-8222-222222222222'
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: IDENTITY_SERVICE_ACCOUNT_NOT_FOUND.code
      })
    })
  })

  it('璁剧疆 service account 鍚敤鐘舵€? / 褰撶鐢?service account 鏃? / 搴旇皟鐢ㄤ粨鍌ㄥ啓鍏?DISABLED', async () => {
    const serviceAccountRepository = createServiceAccountRepository()
    serviceAccountRepository.findById.mockResolvedValue(serviceAccount)
    serviceAccountRepository.setStatus.mockResolvedValue(
      new ServiceAccountEntity(
        serviceAccount.id,
        serviceAccount.tenantId,
        serviceAccount.scopeLevel,
        serviceAccount.type,
        serviceAccount.name,
        serviceAccount.description,
        MACHINE_PRINCIPAL_STATUSES.DISABLED,
        serviceAccount.createdAt,
        new Date('2026-03-25T09:00:00.000Z'),
        serviceAccount.createdBy,
        new Date('2026-03-25T09:00:00.000Z'),
        '22222222-2222-4222-8222-222222222222'
      )
    )
    const handler = new SetServiceAccountEnabledHandler(serviceAccountRepository)

    await handler.execute(
      new SetServiceAccountEnabledCommand(
        serviceAccount.id,
        false,
        '22222222-2222-4222-8222-222222222222'
      )
    )

    expect(serviceAccountRepository.setStatus).toHaveBeenCalledWith({
      serviceAccountId: serviceAccount.id,
      status: MACHINE_PRINCIPAL_STATUSES.DISABLED,
      operatorId: '22222222-2222-4222-8222-222222222222'
    })
  })
})
