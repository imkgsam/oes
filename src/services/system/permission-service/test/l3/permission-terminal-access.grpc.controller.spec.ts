import { PermissionTerminalAccessGrpcController } from '../../src/interfaces/grpc/permission-terminal-access.grpc.controller'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { ResolveAccountTerminalAccessQuery } from '../../src/application/queries/terminal-access'

describe('PermissionTerminalAccessGrpcController', () => {
  it('maps runtime gRPC request fields into a terminal access query', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        allowed: true,
        reasonCode: 'ALLOWED',
        effectiveAllowedTerminals: ['PDA', 'WEB'],
        resolutionSource: 'ROLE_UNION',
        matchedRoleIds: ['role-1']
      })
    }
    const controller = new PermissionTerminalAccessGrpcController(queryBus as any)

    const result = await controller.resolveAccountTerminalAccess({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      terminal: 'WEB'
    })

    expect(queryBus.execute).toHaveBeenCalledWith(
      new ResolveAccountTerminalAccessQuery('account-1', 'tenant-1', ScopeLevel.TENANT, 'WEB')
    )
    expect(result).toEqual({
      allowed: true,
      reasonCode: 'ALLOWED',
      effectiveAllowedTerminals: ['PDA', 'WEB'],
      resolutionSource: 'ROLE_UNION',
      matchedRoleIds: ['role-1']
    })
  })

  it('normalizes system scope and missing terminal to fail-closed defaults', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({
        allowed: false,
        reasonCode: 'INVALID_TERMINAL',
        effectiveAllowedTerminals: [],
        resolutionSource: 'ROLE_UNION',
        matchedRoleIds: []
      })
    }
    const controller = new PermissionTerminalAccessGrpcController(queryBus as any)

    await controller.resolveAccountTerminalAccess({
      accountId: 'account-1',
      scopeLevel: 'SYSTEM'
    })

    expect(queryBus.execute).toHaveBeenCalledWith(
      new ResolveAccountTerminalAccessQuery('account-1', undefined, ScopeLevel.SYSTEM, '')
    )
  })
})
