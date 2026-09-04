import {
  IDENTITY_SERVICE_ACCOUNT_NOT_FOUND,
  IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT,
  IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT,
  IDENTITY_TENANT_NOT_FOUND,
  MACHINE_PRINCIPAL_SCOPE_LEVELS,
  MACHINE_PRINCIPAL_STATUSES,
  MACHINE_PRINCIPAL_TYPES
} from '../common/constants'
import { ACCESS_DENIED } from '@oes/common/exceptions'
import { CheckResourceService } from '../application/authorization'
import { CreateServiceAccountCommand } from '../application/commands/service-account/create-service-account.command'
import { CreateServiceAccountHandler } from '../application/commands/service-account/create-service-account.handler'
import { SetServiceAccountEnabledCommand } from '../application/commands/service-account/set-service-account-enabled.command'
import { SetServiceAccountEnabledHandler } from '../application/commands/service-account/set-service-account-enabled.handler'
import {
  createServiceAccountFixture,
  createServiceAccountRepositoryMock,
  createTenantReferencePortMock
} from '../../test/helpers/machine-fixtures'

describe('service account 规则', () => {
  const checkResourceService = new CheckResourceService()
  const tenant = {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'tenant-a',
    name: 'Tenant A',
    isActive: true
  }

  const serviceAccount = createServiceAccountFixture({
    tenantId: tenant.id,
    scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
    type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
    name: 'assistant-agent',
    description: 'tenant assistant',
    createdAt: new Date('2026-03-25T08:00:00.000Z'),
    updatedAt: new Date('2026-03-25T08:00:00.000Z'),
    createdBy: '22222222-2222-4222-8222-222222222222'
  })

  it('创建 service account / 当 scopeLevel 为 TENANT 且不传 tenantId 时 / 应返回 IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT', async () => {
    const tenantReferencePort = createTenantReferencePortMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const handler = new CreateServiceAccountHandler(
      tenantReferencePort,
      serviceAccountRepository,
      checkResourceService
    )

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

  it('创建 service account / 当 scopeLevel 为 SYSTEM 但传入 tenantId 时 / 应返回 IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT', async () => {
    const tenantReferencePort = createTenantReferencePortMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const handler = new CreateServiceAccountHandler(
      tenantReferencePort,
      serviceAccountRepository,
      checkResourceService
    )

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

  it('创建 service account / 当 tenantId 位于租户范围内但租户不存在时 / 应返回 IDENTITY_TENANT_NOT_FOUND', async () => {
    const tenantReferencePort = createTenantReferencePortMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    tenantReferencePort.findById.mockResolvedValue(null)
    const handler = new CreateServiceAccountHandler(
      tenantReferencePort,
      serviceAccountRepository,
      checkResourceService
    )

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

  it('创建 service account / 当参数合法时 / 应调用仓储创建并写入 createdBy', async () => {
    const tenantReferencePort = createTenantReferencePortMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    tenantReferencePort.findById.mockResolvedValue(tenant as any)
    serviceAccountRepository.create.mockResolvedValue(serviceAccount)
    const handler = new CreateServiceAccountHandler(
      tenantReferencePort,
      serviceAccountRepository,
      checkResourceService
    )

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

  it('创建 service account / 当 tenant scope 操作者尝试在其他租户下创建时 / 应返回 ACCESS_DENIED', async () => {
    const tenantReferencePort = createTenantReferencePortMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    tenantReferencePort.findById.mockResolvedValue({
      ...tenant,
      id: 'tenant-b'
    } as any)
    const handler = new CreateServiceAccountHandler(
      tenantReferencePort,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new CreateServiceAccountCommand({
          tenantId: 'tenant-b',
          scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.TENANT,
          type: MACHINE_PRINCIPAL_TYPES.AI_AGENT,
          name: 'assistant-agent',
          operatorId: '22222222-2222-4222-8222-222222222222',
          operatorScope: {
            tenantId: tenant.id,
            isSystemScope: false
          }
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
  })

  it('创建 service account / 当 tenant scope 操作者尝试创建 system-scope principal 时 / 应返回 ACCESS_DENIED', async () => {
    const tenantReferencePort = createTenantReferencePortMock()
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    const handler = new CreateServiceAccountHandler(
      tenantReferencePort,
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new CreateServiceAccountCommand({
          scopeLevel: MACHINE_PRINCIPAL_SCOPE_LEVELS.SYSTEM,
          type: MACHINE_PRINCIPAL_TYPES.INTERNAL_SERVICE,
          name: 'system-agent',
          operatorId: '22222222-2222-4222-8222-222222222222',
          operatorScope: {
            tenantId: tenant.id,
            isSystemScope: false
          }
        })
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
  })

  it('设置 service account 启用状态 / 当目标 service account 不存在时 / 应返回 IDENTITY_SERVICE_ACCOUNT_NOT_FOUND', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(null)
    const handler = new SetServiceAccountEnabledHandler(
      serviceAccountRepository,
      checkResourceService
    )

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

  it('设置 service account 启用状态 / 当禁用 service account 时 / 应调用仓储写入 DISABLED', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(serviceAccount)
    serviceAccountRepository.setStatus.mockResolvedValue(
      createServiceAccountFixture({
        id: serviceAccount.id,
        tenantId: serviceAccount.tenantId,
        scopeLevel: serviceAccount.scopeLevel,
        type: serviceAccount.type,
        name: serviceAccount.name,
        description: serviceAccount.description,
        status: MACHINE_PRINCIPAL_STATUSES.DISABLED,
        createdAt: serviceAccount.createdAt,
        updatedAt: new Date('2026-03-25T09:00:00.000Z'),
        createdBy: serviceAccount.createdBy,
        disabledAt: new Date('2026-03-25T09:00:00.000Z'),
        disabledBy: '22222222-2222-4222-8222-222222222222'
      })
    )
    const handler = new SetServiceAccountEnabledHandler(
      serviceAccountRepository,
      checkResourceService
    )

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

  it('设置 service account 启用状态 / 当 tenant scope 操作者读取跨租户资源时 / 应返回 ACCESS_DENIED', async () => {
    const serviceAccountRepository = createServiceAccountRepositoryMock()
    serviceAccountRepository.findById.mockResolvedValue(
      createServiceAccountFixture({
        id: serviceAccount.id,
        tenantId: 'tenant-b'
      })
    )
    const handler = new SetServiceAccountEnabledHandler(
      serviceAccountRepository,
      checkResourceService
    )

    await expect(
      handler.execute(
        new SetServiceAccountEnabledCommand(
          serviceAccount.id,
          false,
          '22222222-2222-4222-8222-222222222222',
          {
            operatorId: '22222222-2222-4222-8222-222222222222',
            tenantId: 'tenant-a',
            isSystemScope: false
          }
        )
      )
    ).rejects.toMatchObject({
      definition: expect.objectContaining({
        code: ACCESS_DENIED.code
      })
    })
  })
})
