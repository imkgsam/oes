import { QueryBus } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { IdentityQueryGrpcController } from '../../src/interfaces/grpc/identity-query.grpc.controller'
import { ListTenantsHandler } from '../../src/application/queries/tenant/list-tenants.handler'
import { ListTenantsQuery } from '../../src/application/queries/tenant/list-tenants.query'
import { TenantSummaryEntity } from '../../src/domain/entities/tenant-summary.entity'
import { createTenantRepositoryMock } from '../helpers/machine-fixtures'

describe('list tenants query', () => {
  it('listTenants / system scope 应按关键词与结果上限返回租户目录', async () => {
    const tenantRepository = createTenantRepositoryMock()
    tenantRepository.list.mockResolvedValue([
      new TenantSummaryEntity('tenant-1', 'tenant.alpha', 'Alpha Tenant', true),
      new TenantSummaryEntity('tenant-2', 'tenant.beta', 'Beta Tenant', true)
    ])

    const handler = new ListTenantsHandler(tenantRepository)

    await expect(
      handler.execute(
        new ListTenantsQuery({
          keyword: 'tenant',
          pageSize: 10,
          activeOnly: true,
          operatorScope: {
            operatorId: 'operator-1',
            isSystemScope: true
          }
        })
      )
    ).resolves.toEqual([
      {
        id: 'tenant-1',
        code: 'tenant.alpha',
        name: 'Alpha Tenant',
        isActive: true
      },
      {
        id: 'tenant-2',
        code: 'tenant.beta',
        name: 'Beta Tenant',
        isActive: true
      }
    ])

    expect(tenantRepository.list).toHaveBeenCalledWith({
      tenantId: undefined,
      keyword: 'tenant',
      pageSize: 10,
      isActive: true
    })
  })

  it('listTenants / tenant scope 应被限制为当前 tenant', async () => {
    const tenantRepository = createTenantRepositoryMock()
    tenantRepository.list.mockResolvedValue([
      new TenantSummaryEntity('tenant-1', 'tenant.alpha', 'Alpha Tenant', true)
    ])

    const handler = new ListTenantsHandler(tenantRepository)

    await handler.execute(
      new ListTenantsQuery({
        pageSize: 20,
        activeOnly: true,
        operatorScope: {
          operatorId: 'operator-tenant',
          tenantId: 'tenant-1',
          isSystemScope: false
        }
      })
    )

    expect(tenantRepository.list).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      keyword: undefined,
      pageSize: 20,
      isActive: true
    })
  })

  it('grpc controller / listTenants 应返回租户摘要列表', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue([
        {
          id: 'tenant-1',
          code: 'tenant.alpha',
          name: 'Alpha Tenant',
          isActive: true
        }
      ])
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.listTenants({
        keyword: 'alpha',
        pageSize: 10,
        activeOnly: true
      })
    ).resolves.toEqual({
      tenants: [
        {
          id: 'tenant-1',
          code: 'tenant.alpha',
          name: 'Alpha Tenant',
          isActive: true
        }
      ]
    })
  })
})
