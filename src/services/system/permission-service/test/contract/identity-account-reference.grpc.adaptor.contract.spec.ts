import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { IdentityAccountReferenceGrpcAdaptor } from '../../src/infrastructure/adaptors/identity-account-reference.grpc.adaptor'

describe('IdentityAccountReferenceGrpcAdaptor', () => {
  const metadata = new Metadata()
  const identityQueryService = {
    getAccountById: jest.fn(),
    getServiceAccountById: jest.fn()
  }
  const client = {
    getService: jest.fn(() => identityQueryService)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('propagates trusted internal metadata when validating a HUMAN account', async () => {
    identityQueryService.getAccountById.mockReturnValue(
      of({
        account: {
          id: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      })
    )
    const adaptor = new IdentityAccountReferenceGrpcAdaptor({ getClient: () => client } as any)
    ;(adaptor as any).trusted = { forBusinessCall: jest.fn().mockResolvedValue(metadata) }

    await expect(adaptor.getAccountById('account-1')).resolves.toEqual({
      accountId: 'account-1',
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT',
      isActive: true
    })
    expect(identityQueryService.getAccountById).toHaveBeenCalledWith(
      { accountId: 'account-1' },
      metadata
    )
  })

  it('validates an active MACHINE principal with the same trusted metadata', async () => {
    identityQueryService.getServiceAccountById.mockReturnValue(
      of({
        account: {
          id: 'machine-1',
          tenantId: '',
          scopeLevel: 'SYSTEM',
          status: 'ACTIVE'
        }
      })
    )
    const adaptor = new IdentityAccountReferenceGrpcAdaptor({ getClient: () => client } as any)
    ;(adaptor as any).trusted = { forBusinessCall: jest.fn().mockResolvedValue(metadata) }

    await expect(adaptor.getServiceAccountById('machine-1')).resolves.toEqual({
      principalId: 'machine-1',
      tenantId: null,
      scopeLevel: 'SYSTEM',
      isActive: true
    })
    expect(identityQueryService.getServiceAccountById).toHaveBeenCalledWith(
      { serviceAccountId: 'machine-1' },
      metadata
    )
  })
})
