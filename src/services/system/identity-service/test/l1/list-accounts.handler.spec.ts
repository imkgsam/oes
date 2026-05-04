import { GUARDS_METADATA, INTERCEPTORS_METADATA } from '@nestjs/common/constants'
import {
  AuthenticatedOperatorGuard,
  GrpcRequestContextInterceptor,
  InternalServiceGuard,
  REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY
} from '@oes/common/authorization'
import { QueryBus } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { CountTenantAccountsHandler } from '../../src/application/queries/account/count-tenant-accounts.handler'
import { CountTenantAccountsQuery } from '../../src/application/queries/account/count-tenant-accounts.query'
import { ListAccountsHandler } from '../../src/application/queries/account/list-accounts.handler'
import { ListAccountsQuery } from '../../src/application/queries/account/list-accounts.query'
import { AccountDirectoryEntity } from '../../src/domain/entities/account-directory.entity'
import { IdentityQueryGrpcController } from '../../src/interfaces/grpc/identity-query.grpc.controller'
import { createAccountRepositoryMock } from '../helpers/identity-fixtures'

describe('list accounts query', () => {
  it('listAccounts / system scope 应按过滤与分页返回账号目录', async () => {
    const accountRepository = createAccountRepositoryMock()
    accountRepository.list.mockResolvedValue({
      items: [
        new AccountDirectoryEntity(
          'account-1',
          'user-1',
          null,
          'tenant-1',
          'TENANT',
          'Alpha Admin',
          'Janny',
          true
        )
      ],
      total: 2
    })
    const authorizationQueryScopeService = {
      build: jest.fn().mockReturnValue({ tenantId: undefined })
    }

    const handler = new ListAccountsHandler(
      accountRepository,
      authorizationQueryScopeService as never
    )

    await expect(
      handler.execute(
        new ListAccountsQuery({
          keyword: 'alpha',
          page: 2,
          pageSize: 20,
          scopeLevel: 'TENANT',
          status: 'ENABLED',
          operatorScope: {
            operatorId: 'operator-1',
            isSystemScope: true
          }
        })
      )
    ).resolves.toEqual({
      items: [
        {
          accountId: 'account-1',
          userId: 'user-1',
          userPartyId: null,
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Alpha Admin',
          userDisplayName: 'Janny',
          isEnabled: true
        }
      ],
      total: 2
    })

    expect(authorizationQueryScopeService.build).toHaveBeenCalledWith({
      resource: 'account',
      action: 'list',
      operatorScope: {
        operatorId: 'operator-1',
        isSystemScope: true
      }
    })
    expect(accountRepository.list).toHaveBeenCalledWith({
      keyword: 'alpha',
      page: 2,
      pageSize: 20,
      scopeLevel: 'TENANT',
      status: 'ENABLED',
      tenantId: undefined
    })
  })

  it('listAccounts / system scope 可显式限定来源租户查询账号目录', async () => {
    const accountRepository = createAccountRepositoryMock()
    accountRepository.list.mockResolvedValue({ items: [], total: 0 })
    const authorizationQueryScopeService = {
      build: jest.fn().mockReturnValue({ tenantId: undefined })
    }
    const handler = new ListAccountsHandler(
      accountRepository,
      authorizationQueryScopeService as never
    )

    await handler.execute(
      new ListAccountsQuery({
        keyword: 'existing',
        page: 1,
        pageSize: 10,
        scopeLevel: 'TENANT',
        status: 'ENABLED',
        tenantId: 'tenant-source-1',
        operatorScope: {
          operatorId: 'operator-1',
          isSystemScope: true
        }
      })
    )

    expect(accountRepository.list).toHaveBeenCalledWith({
      keyword: 'existing',
      page: 1,
      pageSize: 10,
      scopeLevel: 'TENANT',
      status: 'ENABLED',
      tenantId: 'tenant-source-1'
    })
  })

  it('countTenantAccounts / system scope 应按租户批量返回启用租户账号数', async () => {
    const accountRepository = createAccountRepositoryMock()
    accountRepository.countByTenantIds.mockResolvedValue([{ tenantId: 'tenant-1', total: 3 }])
    const authorizationQueryScopeService = {
      build: jest.fn().mockReturnValue({ tenantId: undefined })
    }

    const handler = new CountTenantAccountsHandler(
      accountRepository,
      authorizationQueryScopeService as never
    )

    await expect(
      handler.execute(
        new CountTenantAccountsQuery({
          tenantIds: ['tenant-1', 'tenant-2', 'tenant-1'],
          scopeLevel: 'TENANT',
          status: 'ENABLED',
          operatorScope: {
            operatorId: 'operator-1',
            isSystemScope: true
          }
        })
      )
    ).resolves.toEqual({
      counts: [
        { tenantId: 'tenant-1', total: 3 },
        { tenantId: 'tenant-2', total: 0 }
      ]
    })

    expect(authorizationQueryScopeService.build).toHaveBeenCalledWith({
      resource: 'account',
      action: 'list',
      operatorScope: {
        operatorId: 'operator-1',
        isSystemScope: true
      }
    })
    expect(accountRepository.countByTenantIds).toHaveBeenCalledWith({
      tenantIds: ['tenant-1', 'tenant-2'],
      scopeLevel: 'TENANT',
      status: 'ENABLED'
    })
  })

  it('grpc controller / listAccounts 应返回账号目录分页结果', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            accountId: 'account-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            scopeLevel: 'TENANT',
            displayName: 'Alpha Admin',
            userDisplayName: 'Janny',
            isEnabled: true
          }
        ],
        total: 1
      })
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.listAccounts({
        keyword: 'alpha',
        page: 1,
        pageSize: 20,
        scopeLevel: 'TENANT',
        status: 'ENABLED',
        tenantId: 'tenant-1'
      } as any)
    ).resolves.toEqual({
      accounts: [
        {
          accountId: 'account-1',
          userId: 'user-1',
          userPartyId: '',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Alpha Admin',
          userDisplayName: 'Janny',
          isEnabled: true
        }
      ],
      total: 1
    })
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1'
      })
    )
  })

  it('grpc controller / countTenantAccounts 应返回租户账号数', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        counts: [
          {
            tenantId: 'tenant-1',
            total: 3
          }
        ]
      })
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.countTenantAccounts({
        tenantIds: ['tenant-1'],
        scopeLevel: 'TENANT',
        status: 'ENABLED'
      } as any)
    ).resolves.toEqual({
      counts: [
        {
          tenantId: 'tenant-1',
          total: 3
        }
      ]
    })
  })

  it('grpc controller / listAccounts 应要求 authenticated operator context', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, IdentityQueryGrpcController.prototype.listAccounts) ?? []
    const interceptors =
      Reflect.getMetadata(
        INTERCEPTORS_METADATA,
        IdentityQueryGrpcController.prototype.listAccounts
      ) ?? []

    expect(
      Reflect.getMetadata(
        REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY,
        IdentityQueryGrpcController.prototype.listAccounts
      )
    ).toBe(true)
    expect(guards).toEqual([InternalServiceGuard, AuthenticatedOperatorGuard])
    expect(interceptors).toEqual([GrpcRequestContextInterceptor])
  })

  it('grpc controller / countTenantAccounts 应要求 authenticated operator context', () => {
    const guards =
      Reflect.getMetadata(GUARDS_METADATA, IdentityQueryGrpcController.prototype.countTenantAccounts) ?? []
    const interceptors =
      Reflect.getMetadata(
        INTERCEPTORS_METADATA,
        IdentityQueryGrpcController.prototype.countTenantAccounts
      ) ?? []

    expect(
      Reflect.getMetadata(
        REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY,
        IdentityQueryGrpcController.prototype.countTenantAccounts
      )
    ).toBe(true)
    expect(guards).toEqual([InternalServiceGuard, AuthenticatedOperatorGuard])
    expect(interceptors).toEqual([GrpcRequestContextInterceptor])
  })

  it('grpc controller / getAccountsByUserId 不应继续暴露 tenantName', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue([
        {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Alpha Admin',
          isEnabled: true
        }
      ])
    } as unknown as QueryBus
    const controller = new IdentityQueryGrpcController(new ValidatingQueryBus(queryBus))

    await expect(
      controller.getAccountsByUserId({
        userId: '11111111-1111-4111-8111-111111111111'
      } as any)
    ).resolves.toEqual({
      accounts: [
        {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Alpha Admin'
        }
      ]
    })
  })
})
