import { of } from 'rxjs'
import {
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore,
  PermissionServicePermissionReadAdaptor
} from '@oes/common/authorization'

describe('permission service permission read adaptor', () => {
  it('应命中短 TTL 缓存，避免重复读取同一 roleId', async () => {
    const listRolePermissions = jest.fn().mockReturnValue(
      of({
        permissions: [
          { code: 'identity.contact.work_email.assign' },
          { code: 'identity.contact.work_email.assign' },
          { code: 'identity.contact.work_email.assign' }
        ]
      })
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        listRolePermissions
      })
    } as any
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => ({} as any)),
      createOperatorScopedMetadata: jest.fn()
    }
    const adaptor = new PermissionServicePermissionReadAdaptor(
      client,
      metadataFactory,
      new GrpcRequestContextStore()
    )

    adaptor.onModuleInit()

    const first = await adaptor.listPermissionCodesByRoleId('role-a')
    const second = await adaptor.listPermissionCodesByRoleId('role-a')

    expect(listRolePermissions).toHaveBeenCalledTimes(1)
    expect(first).toEqual([
      'identity.contact.work_email.assign'
    ])
    expect(second).toEqual(first)
  })

  it('应按 roleId 分别缓存，不同 roleId 不应互相污染', async () => {
    const listRolePermissions = jest.fn().mockImplementation((request: { roleId?: string }) =>
      of({
        permissions:
          request.roleId === 'role-a'
            ? [{ code: 'identity.contact.work_email.assign' }]
            : [{ code: 'identity.contact.work_phone.assign' }]
      })
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        listRolePermissions
      })
    } as any
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => ({} as any)),
      createOperatorScopedMetadata: jest.fn()
    }
    const adaptor = new PermissionServicePermissionReadAdaptor(
      client,
      metadataFactory,
      new GrpcRequestContextStore()
    )

    adaptor.onModuleInit()

    const permissionsA = await adaptor.listPermissionCodesByRoleId('role-a')
    const permissionsB = await adaptor.listPermissionCodesByRoleId('role-b')

    expect(listRolePermissions).toHaveBeenCalledTimes(2)
    expect(permissionsA).toEqual(['identity.contact.work_email.assign'])
    expect(permissionsB).toEqual(['identity.contact.work_phone.assign'])
  })

  it('应在存在 request context 时透传 internal metadata', async () => {
    const listRolePermissions = jest.fn().mockReturnValue(
      of({
        permissions: [{ code: 'identity.contact.work_email.assign' }]
      })
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        listRolePermissions
      })
    } as any
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => ({ kind: 'internal' } as any)),
      createOperatorScopedMetadata: jest.fn(() => ({ kind: 'operator' } as any))
    }
    const contextStore = new GrpcRequestContextStore()
    const adaptor = new PermissionServicePermissionReadAdaptor(
      client,
      metadataFactory,
      contextStore
    )

    adaptor.onModuleInit()

    const permissions = await contextStore.run(
      {
        requestId: 'request-1',
        traceId: 'trace-1',
        operatorContext: {
          operator_id: 'account-1',
          operator_type: 'USER',
          operator_roles: ['role-1'],
          request_id: 'request-1',
          trace_id: 'trace-1',
          issued_at: '2026-04-15T00:00:00.000Z',
          expires_at: '2026-04-15T00:05:00.000Z',
          issuer: 'api-gateway',
          signature: 'signed'
        }
      },
      () => adaptor.listPermissionCodesByRoleId('role-1')
    )

    expect(permissions).toEqual(['identity.contact.work_email.assign'])
    expect(metadataFactory.createInternalCallMetadata).toHaveBeenCalledWith({
      callerServiceName: 'identity-service',
      requestId: 'request-1',
      traceId: 'trace-1'
    })
  })

  it('应按 operator context 读取 account access summary', async () => {
    const getAccountAccessSummary = jest.fn().mockReturnValue(
      of({
        actionCodes: ['identity.contact.work_email.assign']
      })
    )
    const client = {
      getService: jest.fn().mockReturnValue({
        getAccountAccessSummary
      })
    } as any
    const metadataFactory: GrpcMetadataPropagationFactory = {
      createInternalCallMetadata: jest.fn(() => ({ kind: 'internal' } as any)),
      createOperatorScopedMetadata: jest.fn(() => ({ kind: 'operator' } as any))
    }
    const adaptor = new PermissionServicePermissionReadAdaptor(
      client,
      metadataFactory,
      new GrpcRequestContextStore()
    )

    const permissions = await adaptor.listPermissionCodesByOperatorContext({
      operator_id: 'account-guard',
      operator_type: 'USER',
      tenant_id: 'tenant-guard',
      operator_roles: ['role-guard'],
      request_id: 'request-guard',
      trace_id: 'trace-guard',
      issued_at: '2026-04-15T00:00:00.000Z',
      expires_at: '2026-04-15T00:05:00.000Z',
      issuer: 'api-gateway',
      signature: 'signed'
    })

    expect(permissions).toEqual(['identity.contact.work_email.assign'])
    expect(getAccountAccessSummary).toHaveBeenCalledWith(
      {
        accountId: 'account-guard',
        tenantId: 'tenant-guard',
        scopeLevel: 'TENANT'
      },
      { kind: 'internal' }
    )
    expect(metadataFactory.createInternalCallMetadata).toHaveBeenCalledWith({
      callerServiceName: 'identity-service',
      requestId: undefined,
      traceId: undefined
    })
  })
})
