import { ResolvePublicBusinessCardIdentityHandler } from '../../src/application/queries/contact/resolve-public-business-card-identity.handler'
import { ResolvePublicBusinessCardIdentityQuery } from '../../src/application/queries/contact/resolve-public-business-card-identity.query'

function fixture(
  overrides: { tenantId?: string; enabled?: boolean; displayName?: string | null } = {}
) {
  const binding = {
    findByEmployeeId: jest.fn().mockResolvedValue({
      id: 'binding-1',
      tenantId: overrides.tenantId ?? 'tenant-1',
      accountId: 'account-1',
      employeeId: '00000000-0000-4000-8000-000000000302'
    })
  }
  const account = {
    findById: jest.fn().mockResolvedValue({
      id: 'account-1',
      userId: 'user-1',
      tenantId: overrides.tenantId ?? 'tenant-1',
      scopeLevel: 'TENANT',
      displayName: overrides.displayName === undefined ? 'Alex Chen' : overrides.displayName,
      isEnabled: overrides.enabled ?? true
    })
  }
  const assets = {
    listByIds: jest.fn().mockResolvedValue([
      {
        id: 'email-1',
        tenantId: 'tenant-1',
        accountId: 'account-1',
        employeeId: null,
        status: 'ACTIVE',
        type: 'WORK_EMAIL',
        value: 'alex@example.com',
        displayName: null,
        provider: null,
        usage: ['VCARD_CANDIDATE']
      }
    ])
  }
  return {
    handler: new ResolvePublicBusinessCardIdentityHandler(
      binding as any,
      account as any,
      assets as any
    ),
    binding,
    account,
    assets
  }
}

const employeeId = '00000000-0000-4000-8000-000000000302'

function query() {
  return new ResolvePublicBusinessCardIdentityQuery({
    tenantId: 'tenant-1',
    employeeId,
    targetRefs: [
      { contactActionType: 'SEND_EMAIL', targetRefType: 'CONTACT_ASSET', targetRefId: 'email-1' },
      { contactActionType: 'CALL_PHONE', targetRefType: 'CONTACT_ASSET', targetRefId: 'missing' }
    ]
  })
}

describe('ResolvePublicBusinessCardIdentityHandler', () => {
  it('returns enabled same-tenant identity and independently renderable public-safe targets', async () => {
    const { handler } = fixture()
    await expect(handler.execute(query())).resolves.toMatchObject({
      available: true,
      tenantId: 'tenant-1',
      employeeId,
      accountId: 'account-1',
      displayName: 'Alex Chen',
      targets: [
        expect.objectContaining({ targetRefId: 'email-1', renderable: true }),
        expect.objectContaining({ targetRefId: 'missing', renderable: false })
      ],
      reasonCode: ''
    })
  })

  it.each([
    ['cross-tenant binding', { tenantId: 'tenant-2' }],
    ['disabled account', { enabled: false }],
    ['blank display name', { displayName: ' ' }]
  ])('fails closed for %s', async (_, overrides) => {
    const { handler, assets } = fixture(overrides)
    await expect(handler.execute(query())).resolves.toMatchObject({ available: false })
    expect(assets.listByIds).not.toHaveBeenCalled()
  })
})
