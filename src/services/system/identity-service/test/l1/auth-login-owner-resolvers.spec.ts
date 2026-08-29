import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IdentityQueryGrpcController } from '../../src/interfaces/grpc/identity-query.grpc.controller'

describe('Identity Auth-only login owner resolvers', () => {
  it('freezes the three additive methods and one exact INTERNAL Code', () => {
    const proto = readFileSync(
      join(__dirname, '../../../../../common/src/contracts/identity_service/identity_query.proto'),
      'utf8'
    )
    const controller = readFileSync(
      join(__dirname, '../../src/interfaces/grpc/identity-query.grpc.controller.ts'),
      'utf8'
    )
    for (const method of [
      'ListAuthLoginAccountCandidates',
      'ResolveAuthLoginAccount',
      'ResolveAuthEmployeeLoginAccount'
    ]) {
      expect(proto).toContain(`rpc ${method}(`)
    }
    expect(
      controller.match(
        /AuthorizeInternalCall\(\{ all: \['identity\.internal\.auth_login_account\.resolve'\] \}\)/g
      )
    ).toHaveLength(3)
    expect(controller).not.toContain("applyIdentityQueryDeclaration('resolveAuth")
  })

  it('rejects a mismatched user/account owner pair without returning account facts', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        id: 'account-1',
        userId: 'owner-user',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Owner',
        isEnabled: true
      })
    }
    const controller = new IdentityQueryGrpcController(queryBus as any)
    await expect(
      controller.resolveAuthLoginAccount({ userId: 'other-user', accountId: 'account-1' })
    ).resolves.toEqual({})
  })

  it('returns only enabled account candidates and the owner-safe projection', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue([
        {
          accountId: 'enabled',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'A',
          isEnabled: true
        },
        {
          accountId: 'disabled',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'B',
          isEnabled: false
        }
      ])
    }
    const controller = new IdentityQueryGrpcController(queryBus as any)
    const response = await controller.listAuthLoginAccountCandidates({ userId: 'user-1' })
    expect(response.accounts).toEqual([
      {
        userId: 'user-1',
        accountId: 'enabled',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'A',
        accountEnabled: true,
        employeeId: ''
      }
    ])
  })
})
