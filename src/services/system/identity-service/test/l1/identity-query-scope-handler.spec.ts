import { ListAuditEventsHandler } from '../../src/application/queries/audit/list-audit-events.handler'
import { ListAuditEventsQuery } from '../../src/application/queries/audit/list-audit-events.query'
import { ListAccountWorkPhoneAssetsHandler } from '../../src/application/queries/contact/list-account-work-phone-assets.handler'
import { ListAccountWorkPhoneAssetsQuery } from '../../src/application/queries/contact/list-account-work-phone-assets.query'
import { ListApiKeysByServiceAccountIdHandler } from '../../src/application/queries/service-account/list-api-keys-by-service-account-id.handler'
import { ListApiKeysByServiceAccountIdQuery } from '../../src/application/queries/service-account/list-api-keys-by-service-account-id.query'
import { ListServiceAccountsHandler } from '../../src/application/queries/service-account/list-service-accounts.handler'
import { ListServiceAccountsQuery } from '../../src/application/queries/service-account/list-service-accounts.query'
import { MACHINE_PRINCIPAL_STATUSES } from '../../src/common/constants'

// Verifies identity query handlers translate authorization scope into repository-facing filters.
describe('identity query scope handlers', () => {
  it('查询审计事件列表 / 应优先使用 query scope 收口租户条件', async () => {
    const repository = {
      list: jest.fn().mockResolvedValue({ items: [], nextCursor: undefined })
    }
    const authorizationQueryScopeService = {
      build: jest.fn().mockReturnValue({ tenantId: 'tenant-0' })
    }

    const handler = new ListAuditEventsHandler(
      repository as never,
      authorizationQueryScopeService as never
    )

    await handler.execute(
      new ListAuditEventsQuery({
        tenantId: '11111111-1111-1111-1111-111111111111',
        result: 'SUCCEEDED',
        pageSize: 20,
        operatorScope: {
          operatorId: 'operator-0',
          tenantId: 'tenant-0',
          isSystemScope: false
        }
      })
    )

    expect(authorizationQueryScopeService.build).toHaveBeenCalledWith({
      resource: 'audit_event',
      action: 'list',
      operatorScope: {
        operatorId: 'operator-0',
        tenantId: 'tenant-0',
        isSystemScope: false
      }
    })
    expect(repository.list).toHaveBeenCalledWith({
      service: undefined,
      module: undefined,
      eventType: undefined,
      result: 'SUCCEEDED',
      operatorId: undefined,
      tenantId: 'tenant-0',
      orgId: undefined,
      resourceType: undefined,
      resourceId: undefined,
      occurredAtFrom: undefined,
      occurredAtTo: undefined,
      cursor: undefined,
      pageSize: 20
    })
  })

  it('查询工作电话资产 / 应将 query scope 传递给联系方式仓储', async () => {
    const repository = {
      listByAccountIdAndType: jest.fn().mockResolvedValue([])
    }
    const authorizationQueryScopeService = {
      build: jest.fn().mockReturnValue({ tenantId: 'tenant-1' })
    }

    const handler = new ListAccountWorkPhoneAssetsHandler(
      repository as never,
      authorizationQueryScopeService as never
    )

    await handler.execute(
      new ListAccountWorkPhoneAssetsQuery('11111111-1111-1111-1111-111111111111', {
        operatorId: 'operator-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      })
    )

    expect(authorizationQueryScopeService.build).toHaveBeenCalledWith({
      resource: 'account_contact_asset',
      action: 'list',
      operatorScope: {
        operatorId: 'operator-1',
        tenantId: 'tenant-1',
        isSystemScope: false
      }
    })
    expect(repository.listByAccountIdAndType).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'WORK_PHONE',
      { tenantId: 'tenant-1' }
    )
  })

  it('查询服务账号列表 / 应优先使用 query scope 收口租户条件', async () => {
    const repository = {
      list: jest.fn().mockResolvedValue([])
    }
    const authorizationQueryScopeService = {
      build: jest.fn().mockReturnValue({ tenantId: 'tenant-2' })
    }

    const handler = new ListServiceAccountsHandler(
      repository as never,
      authorizationQueryScopeService as never
    )

    await handler.execute(
      new ListServiceAccountsQuery({
        tenantId: '11111111-1111-1111-1111-111111111111',
        status: MACHINE_PRINCIPAL_STATUSES.ACTIVE,
        operatorScope: {
          operatorId: 'operator-2',
          tenantId: 'tenant-2',
          isSystemScope: false
        }
      })
    )

    expect(authorizationQueryScopeService.build).toHaveBeenCalledWith({
      resource: 'service_account',
      action: 'list',
      operatorScope: {
        operatorId: 'operator-2',
        tenantId: 'tenant-2',
        isSystemScope: false
      }
    })
    expect(repository.list).toHaveBeenCalledWith({
      tenantId: 'tenant-2',
      scopeLevel: undefined,
      type: undefined,
      status: MACHINE_PRINCIPAL_STATUSES.ACTIVE
    })
  })

  it('查询 API key 列表 / 应将 query scope 传递给 api key 仓储', async () => {
    const repository = {
      listByServiceAccountId: jest.fn().mockResolvedValue([])
    }
    const authorizationQueryScopeService = {
      build: jest.fn().mockReturnValue({ tenantId: 'tenant-4' })
    }

    const handler = new ListApiKeysByServiceAccountIdHandler(
      repository as never,
      authorizationQueryScopeService as never
    )

    await handler.execute(
      new ListApiKeysByServiceAccountIdQuery(
        '22222222-2222-2222-2222-222222222222',
        {
          operatorId: 'operator-3',
          tenantId: 'tenant-4',
          isSystemScope: false
        }
      )
    )

    expect(authorizationQueryScopeService.build).toHaveBeenCalledWith({
      resource: 'api_key',
      action: 'list',
      operatorScope: {
        operatorId: 'operator-3',
        tenantId: 'tenant-4',
        isSystemScope: false
      }
    })
    expect(repository.listByServiceAccountId).toHaveBeenCalledWith(
      '22222222-2222-2222-2222-222222222222',
      { tenantId: 'tenant-4' }
    )
  })
})
